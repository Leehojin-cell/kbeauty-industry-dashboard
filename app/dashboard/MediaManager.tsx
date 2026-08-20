"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

type MediaType = "video" | "youtube" | "image";
type Directory = { id: string; media_type: MediaType; name: string };
type MediaItem = { id: string; directory_id: string | null; media_type: MediaType; title: string; file_url: string | null; youtube_url: string | null; mime_type: string | null; size_bytes: number | null; created_at: string; local?: boolean };

const LABELS: Record<MediaType, string> = { video: "동영상 저장", youtube: "YouTube 링크", image: "이미지 저장" };
const ACCEPT: Record<MediaType, string> = { video: "video/*", youtube: "", image: "image/*" };
const LOCAL_DIRS = "kbeauty-media-directories";
const LOCAL_ITEMS = "kbeauty-media-items";
const LOCAL_DB = "kbeauty-media-files";

function formatSize(size: number | null) { if (!size) return ""; if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`; return `${(size / (1024 * 1024)).toFixed(1)}MB`; }
function youtubeId(url: string | null) { if (!url) return ""; const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/); return m?.[1] || ""; }
function readLocalDirs(): Directory[] { try { return JSON.parse(localStorage.getItem(LOCAL_DIRS) || "[]"); } catch { return []; } }
function readLocalItems(): MediaItem[] { try { return JSON.parse(localStorage.getItem(LOCAL_ITEMS) || "[]"); } catch { return []; } }
function writeLocalDirs(v: Directory[]) { localStorage.setItem(LOCAL_DIRS, JSON.stringify(v)); }
function writeLocalItems(v: MediaItem[]) { localStorage.setItem(LOCAL_ITEMS, JSON.stringify(v)); }
function openLocalDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => { const r = indexedDB.open(LOCAL_DB, 1); r.onupgradeneeded = () => r.result.createObjectStore("files"); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }); }
async function putLocalFile(id: string, file: File) { const db = await openLocalDB(); await new Promise<void>((resolve, reject) => { const tx = db.transaction("files", "readwrite"); tx.objectStore("files").put(file, id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close(); }
async function getLocalFile(id: string): Promise<Blob | null> { const db = await openLocalDB(); return new Promise((resolve, reject) => { const r = db.transaction("files", "readonly").objectStore("files").get(id); r.onsuccess = () => { db.close(); resolve(r.result || null); }; r.onerror = () => { db.close(); reject(r.error); }; }); }

export default function MediaManager({ isAdmin }: { isAdmin: boolean }) {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newDirType, setNewDirType] = useState<MediaType | null>(null);
  const [newDirName, setNewDirName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [youtubeDir, setYoutubeDir] = useState("");
  const [uploadDir, setUploadDir] = useState<Record<"video" | "image", string>>({ video: "", image: "" });
  const [dragOver, setDragOver] = useState<MediaType | null>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const loadLocalFiles = useCallback(async (localItems: MediaItem[]) => {
    const hydrated: MediaItem[] = [];
    for (const item of localItems) {
      if (!item.local || !item.file_url) { hydrated.push(item); continue; }
      try { const blob = await getLocalFile(item.id); if (blob) hydrated.push({ ...item, file_url: URL.createObjectURL(blob) }); } catch { hydrated.push(item); }
    }
    return hydrated;
  }, []);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true); setError("");
    const localDirs = readLocalDirs();
    const localItems = await loadLocalFiles(readLocalItems());
    try {
      const res = await fetch("/api/media", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `미디어 API 오류 (${res.status})`);
      setDirectories([...(data.directories || []), ...localDirs.filter(ld => !(data.directories || []).some((d: Directory) => d.id === ld.id))]);
      setItems([...(data.items || []), ...localItems.filter(li => !(data.items || []).some((i: MediaItem) => i.id === li.id))]);
    } catch (e) {
      setDirectories(localDirs); setItems(localItems);
      if (!localDirs.length && !localItems.length) setError(`${e instanceof Error ? e.message : "미디어 데이터를 불러오지 못했습니다."} · 브라우저 임시 저장 모드로도 사용할 수 있습니다.`);
      else setError("서버 저장소에 연결되지 않아 브라우저 임시 저장 내용을 표시합니다.");
    } finally { setLoading(false); }
  }, [isAdmin, loadLocalFiles]);

  useEffect(() => { load(); }, [load]);
  const dirs = (type: MediaType) => directories.filter(d => d.media_type === type);
  const itemsOf = (type: MediaType) => items.filter(i => i.media_type === type);

  async function createDirectory() {
    if (!newDirType || !newDirName.trim()) return;
    const name = newDirName.trim();
    try {
      const res = await fetch("/api/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "directory", mediaType: newDirType, name }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `디렉토리 생성 오류 (${res.status})`);
      setDirectories(v => [...v, { id: data.id, media_type: newDirType, name: data.name || name }]);
      setError("");
    } catch (e) {
      const local: Directory = { id: `local-dir-${crypto.randomUUID()}`, media_type: newDirType, name };
      const next = [...readLocalDirs(), local]; writeLocalDirs(next); setDirectories(v => [...v, local]);
      setError(`서버 저장에 실패해 브라우저에 디렉토리를 저장했습니다. (${e instanceof Error ? e.message : "서버 오류"})`);
    }
    setNewDirName(""); setNewDirType(null);
  }

  async function saveItem(payload: Record<string, unknown>) {
    try {
      const res = await fetch("/api/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "item", ...payload }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `콘텐츠 저장 오류 (${res.status})`);
      await load();
    } catch (e) {
      const local: MediaItem = { id: `local-item-${crypto.randomUUID()}`, directory_id: (payload.directoryId as string) || null, media_type: payload.mediaType as MediaType, title: String(payload.title || ""), file_url: (payload.fileUrl as string) || null, youtube_url: (payload.youtubeUrl as string) || null, mime_type: (payload.mimeType as string) || null, size_bytes: (payload.sizeBytes as number) || null, created_at: new Date().toISOString(), local: true };
      const next = [...readLocalItems(), local]; writeLocalItems(next); setItems(v => [...v, local]);
      throw new Error(`서버 저장 실패 → 브라우저 임시 저장으로 보관했습니다. ${e instanceof Error ? e.message : ""}`);
    }
  }

  async function uploadFile(file: File, type: "video" | "image") {
    setError("");
    try {
      const result = await upload(`media/${type}/${Date.now()}-${file.name.replace(/[^\w가-힣.()-]/g, "_")}`, file, { access: "public", handleUploadUrl: "/api/media/upload", multipart: true, onUploadProgress: p => setError(`${LABELS[type]} 업로드 중 ${Math.round(p.percentage)}%`) });
      const title = window.prompt("저장할 제목을 입력하세요", file.name.replace(/\.[^.]+$/, "")) || file.name;
      await saveItem({ mediaType: type, title, directoryId: uploadDir[type] || null, fileUrl: result.url, blobPathname: result.pathname, mimeType: file.type, sizeBytes: file.size });
      setError("");
    } catch (e) {
      try {
        const title = window.prompt("서버 업로드에 실패했습니다. 브라우저에 저장할 제목을 입력하세요", file.name.replace(/\.[^.]+$/, "")) || file.name;
        const id = `local-item-${crypto.randomUUID()}`; await putLocalFile(id, file);
        const local: MediaItem = { id, directory_id: uploadDir[type] || null, media_type: type, title, file_url: id, youtube_url: null, mime_type: file.type, size_bytes: file.size, created_at: new Date().toISOString(), local: true };
        const next = [...readLocalItems(), local]; writeLocalItems(next); setItems(v => [...v, { ...local, file_url: URL.createObjectURL(file) }]);
        setError(`브라우저 임시 저장 완료 · 서버 업로드 실패 원인: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
      } catch (localError) { setError(localError instanceof Error ? localError.message : "파일 저장에 실패했습니다."); }
    }
  }

  async function handleFiles(files: FileList | File[], type: "video" | "image") { for (const file of Array.from(files)) await uploadFile(file, type); }
  async function handleDrop(e: React.DragEvent, type: MediaType) {
    e.preventDefault(); e.stopPropagation(); setDragOver(null);
    if (type === "youtube") { const url = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("text/plain"); if (url) setYoutubeUrl(url.trim()); return; }
    if (e.dataTransfer.files?.length) await handleFiles(e.dataTransfer.files, type);
  }
  async function addYoutube() {
    const id = youtubeId(youtubeUrl); if (!id || !youtubeTitle.trim()) { setError("YouTube URL과 제목을 입력해주세요."); return; }
    try { await saveItem({ mediaType: "youtube", title: youtubeTitle.trim(), directoryId: youtubeDir || null, youtubeUrl: youtubeUrl.trim() }); setYoutubeUrl(""); setYoutubeTitle(""); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "YouTube 링크 저장에 실패했습니다."); }
  }
  async function removeItem(id: string) {
    if (!window.confirm("이 콘텐츠를 삭제할까요?")) return;
    if (id.startsWith("local-item-")) { const next = readLocalItems().filter(i => i.id !== id); writeLocalItems(next); setItems(v => v.filter(i => i.id !== id)); return; }
    const res = await fetch(`/api/media?id=${encodeURIComponent(id)}`, { method: "DELETE" }); const data = await res.json().catch(() => ({})); if (!res.ok) { setError(data.error || "삭제하지 못했습니다."); return; } await load();
  }

  function card(type: MediaType) {
    const typeDirs = dirs(type), typeItems = itemsOf(type);
    return <section className="media-card" key={type}>
      <div className="media-card-head"><div><h3>{LABELS[type]}</h3><p>{type === "video" ? "일반 동영상 파일을 저장합니다." : type === "youtube" ? "YouTube URL을 저장하고 임베드로 재생합니다." : "이미지 파일을 저장합니다."}</p></div><button className="media-add-dir" onClick={() => setNewDirType(type)}>＋ 새 디렉토리</button></div>
      <div className="media-body"><aside className="media-folders"><strong>▣ 전체 {type === "video" ? "동영상" : type === "youtube" ? "YouTube" : "이미지"}</strong>{typeDirs.map(d => <button key={d.id} className={(type === "youtube" ? youtubeDir : uploadDir[type as "video" | "image"]) === d.id ? "selected" : ""} onClick={() => type === "youtube" ? setYoutubeDir(d.id) : setUploadDir(v => ({ ...v, [type]: d.id }))}>▱ {d.name}</button>)}<button className="folder-new" onClick={() => setNewDirType(type)}>＋ 새 디렉토리</button></aside>
        <div className="media-main">{type === "youtube" ? <div className={`youtube-add ${dragOver === "youtube" ? "is-drag" : ""}`} onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDragOver("youtube"); }} onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver("youtube"); }} onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setDragOver(null); }} onDrop={e => handleDrop(e, "youtube")}><div className="dropbox"><span>↳</span><b>YouTube 링크를 여기에 드래그하거나 입력하세요</b><input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..."/><input value={youtubeTitle} onChange={e => setYoutubeTitle(e.target.value)} placeholder="영상 제목"/><button onClick={addYoutube}>추가</button></div></div> : <div className={`dropbox ${dragOver === type ? "active" : ""}`} onDragEnter={e => { e.preventDefault(); e.stopPropagation(); setDragOver(type); }} onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(type); }} onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setDragOver(null); }} onDrop={e => handleDrop(e, type)} onClick={() => (type === "video" ? videoRef : imageRef).current?.click()}><span>⇧</span><b>{type === "video" ? "동영상 파일" : "이미지 파일"}을 드래그하거나 업로드하세요</b><small>{type === "video" ? "MP4, MOV, WEBM 등" : "JPG, PNG, WEBP, GIF 등"}</small><button type="button" onClick={e => { e.stopPropagation(); (type === "video" ? videoRef : imageRef).current?.click(); }}>파일 선택</button></div>}
          <div className="media-list">{typeItems.length ? typeItems.map(item => <article className="media-item" key={item.id}>{type === "video" && item.file_url ? <video src={item.file_url} controls preload="metadata" /> : type === "image" && item.file_url ? <img src={item.file_url} alt={item.title} /> : type === "youtube" ? <div className="yt-thumb">{youtubeId(item.youtube_url) ? <img src={`https://i.ytimg.com/vi/${youtubeId(item.youtube_url)}/mqdefault.jpg`} alt="" /> : "▶"}</div> : null}<div className="media-meta"><b>{item.title}</b><small>{type === "youtube" ? item.youtube_url : `${formatSize(item.size_bytes)} · ${new Date(item.created_at).toLocaleDateString("ko-KR")}`}</small>{type === "youtube" && item.youtube_url && <a href={item.youtube_url} target="_blank" rel="noreferrer">YouTube에서 열기</a>}</div><button className="media-delete" onClick={() => removeItem(item.id)}>⋮</button></article>) : <div className="media-empty">저장된 콘텐츠가 없습니다.</div>}</div>
        </div></div></section>;
  }

  if (!isAdmin) return <section className="media-manager locked"><div className="media-lock"><span>🔒</span><div><h2>동영상 & 이미지</h2><p>로그인 후 동영상 저장, YouTube 링크, 이미지 저장 기능을 이용할 수 있습니다.</p></div><a href="/login">로그인</a></div></section>;
  return <section className="media-manager"><div className="media-title"><div><h2>동영상 & 이미지</h2><p>로그인한 사용자만 콘텐츠와 디렉토리를 관리할 수 있습니다.</p></div>{loading && <span>불러오는 중...</span>}</div>{error && <div className="media-error">{error}</div>}<div className="media-grid">{card("video")}{card("youtube")}{card("image")}</div><input ref={videoRef} hidden type="file" accept={ACCEPT.video} multiple onChange={e => e.target.files && handleFiles(e.target.files, "video")} /><input ref={imageRef} hidden type="file" accept={ACCEPT.image} multiple onChange={e => e.target.files && handleFiles(e.target.files, "image")} />{newDirType && <div className="media-modal"><div className="media-modal-box"><h3>{LABELS[newDirType]} 새 디렉토리</h3><input autoFocus value={newDirName} onChange={e => setNewDirName(e.target.value)} onKeyDown={e => e.key === "Enter" && createDirectory()} placeholder="디렉토리 제목"/><div><button onClick={() => setNewDirType(null)}>취소</button><button className="primary" onClick={createDirectory}>만들기</button></div></div></div>}<style jsx>{`.media-manager{margin:14px 0 28px;background:#fff;border:1px solid #dce4ef;border-radius:9px;padding:14px;box-shadow:0 2px 8px rgba(30,55,90,.06)}.media-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.media-title h2{margin:0;font-size:15px}.media-title p{margin:4px 0 0;color:#74839a;font-size:10px}.media-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.media-card{border:1px solid #dfe6ef;border-radius:8px;overflow:hidden;min-width:0}.media-card-head{padding:10px;border-bottom:1px solid #e8edf4;display:flex;justify-content:space-between;gap:6px}.media-card-head h3{margin:0;font-size:13px;color:#163b75}.media-card-head p{margin:4px 0 0;font-size:10px;color:#78869a}.media-add-dir{border:1px solid #2f73e6;background:#fff;color:#2f73e6;border-radius:5px;padding:4px 7px;font-size:10px;white-space:nowrap}.media-body{display:grid;grid-template-columns:110px minmax(0,1fr);min-height:300px}.media-folders{border-right:1px solid #e7edf4;padding:8px;display:flex;flex-direction:column;gap:4px}.media-folders strong{font-size:10px;color:#163b75;margin-bottom:3px}.media-folders button{border:0;background:transparent;text-align:left;padding:5px;font-size:10px;color:#52647b;border-radius:4px;cursor:pointer}.media-folders button:hover,.media-folders button.selected{background:#edf4ff;color:#1d61c9;font-weight:700}.media-folders .folder-new{color:#2f73e6;margin-top:auto}.media-main{padding:8px;min-width:0}.dropbox{min-height:100px;border:1px dashed #9fbde6;background:#f8fbff;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:8px;cursor:pointer;text-align:center}.dropbox.active,.youtube-add.is-drag .dropbox{border-color:#2f73e6;background:#edf5ff;box-shadow:0 0 0 2px rgba(47,115,230,.1)}.dropbox span{font-size:18px;color:#2f73e6}.dropbox b{font-size:10px;color:#40536d}.dropbox small{font-size:9px;color:#8996a8}.dropbox button{border:1px solid #2f73e6;background:#fff;color:#2f73e6;border-radius:5px;padding:4px 8px;font-size:10px}.youtube-add .dropbox{align-items:stretch}.youtube-add input{height:30px;border:1px solid #d6dfeb;border-radius:5px;padding:0 8px;font-size:10px}.youtube-add button{align-self:flex-end;background:#2f73e6;color:#fff;border:0;border-radius:5px;padding:5px 10px;font-size:10px}.media-list{margin-top:8px;display:flex;flex-direction:column;gap:5px;max-height:210px;overflow:auto}.media-item{display:grid;grid-template-columns:74px minmax(0,1fr) 20px;gap:7px;align-items:center;border:1px solid #e5eaf1;border-radius:5px;padding:5px;background:#fff}.media-item video,.media-item img,.yt-thumb{width:74px;height:46px;object-fit:cover;border-radius:4px;background:#edf2f7}.media-meta{min-width:0;display:flex;flex-direction:column;gap:3px}.media-meta b{font-size:10px;color:#1f3659;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.media-meta small,.media-meta a{font-size:9px;color:#7c899a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.media-meta a{color:#2f73e6;text-decoration:none}.media-delete{border:0;background:transparent;color:#7c899a;cursor:pointer}.media-empty{height:80px;display:flex;align-items:center;justify-content:center;color:#8a97a8;font-size:10px}.media-lock{display:flex;align-items:center;justify-content:center;gap:12px;min-height:100px;background:#fffaf0;border:1px solid #f3dfb2;border-radius:7px}.media-lock>span{font-size:22px}.media-lock h2{margin:0;font-size:14px}.media-lock p{margin:4px 0 0;color:#7a6b50;font-size:10px}.media-lock a{background:#2f73e6;color:#fff;text-decoration:none;border-radius:5px;padding:7px 14px;font-size:10px}.media-error{margin:0 0 8px;padding:7px 9px;background:#fff4f4;color:#c43c49;border:1px solid #f0cdd1;border-radius:5px;font-size:10px}.media-modal{position:fixed;inset:0;background:rgba(10,25,50,.35);display:flex;align-items:center;justify-content:center;z-index:100}.media-modal-box{background:#fff;width:330px;border-radius:9px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.2)}.media-modal-box h3{margin:0 0 10px;font-size:14px}.media-modal-box input{width:100%;height:34px;border:1px solid #d7e0eb;border-radius:5px;padding:0 9px;font-size:11px}.media-modal-box>div{display:flex;justify-content:flex-end;gap:6px;margin-top:10px}.media-modal-box button{border:1px solid #d7e0eb;background:#fff;border-radius:5px;padding:6px 10px;font-size:10px}.media-modal-box .primary{background:#2f73e6;color:#fff;border-color:#2f73e6}.locked{margin-top:14px}@media(max-width:1000px){.media-grid{grid-template-columns:1fr}.media-body{min-height:260px}}`}</style></section>;
}
