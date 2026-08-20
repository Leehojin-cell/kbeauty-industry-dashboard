"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { upload } from "@vercel/blob/client";

type MediaType = "video" | "youtube" | "image";
type Directory = { id: string; media_type: MediaType; name: string };
type MediaItem = { id: string; directory_id: string | null; media_type: MediaType; title: string; file_url: string | null; youtube_url: string | null; mime_type: string | null; size_bytes: number | null; created_at: string };

const LABELS: Record<MediaType, string> = { video: "동영상 저장", youtube: "YouTube 링크", image: "이미지 저장" };
const ACCEPT: Record<MediaType, string> = { video: "video/*", youtube: "", image: "image/*" };

function youtubeId(url: string | null) {
  if (!url) return "";
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
  return match?.[1] || "";
}

function formatSize(size: number | null) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))}KB`;
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

const styles = {
  shell: { border: "1px solid #d9e2ef", borderRadius: 8, background: "#fff", padding: 10, color: "#0b2d5c" } as const,
  heading: { fontSize: 13, fontWeight: 800, margin: "0 0 2px" } as const,
  sub: { fontSize: 9, color: "#7890ad", margin: 0 } as const,
  grid: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginTop: 8 } as const,
  card: { minWidth: 0, border: "1px solid #d7e2ef", borderRadius: 7, background: "#fff", overflow: "hidden" } as const,
  cardHead: { minHeight: 47, padding: "7px 8px", borderBottom: "1px solid #e2e9f2", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 5 } as const,
  body: { display: "grid", gridTemplateColumns: "112px minmax(0,1fr)", minHeight: 205 } as const,
  folders: { borderRight: "1px solid #e2e9f2", padding: 6, display: "flex", flexDirection: "column", gap: 3 } as const,
  folder: { border: 0, background: "transparent", textAlign: "left", padding: "5px 6px", borderRadius: 4, fontSize: 10, color: "#365476", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } as const,
  selectedFolder: { background: "#edf5ff", color: "#1262d6", fontWeight: 700 } as const,
  main: { minWidth: 0, padding: 8, display: "flex", flexDirection: "column", gap: 7 } as const,
  drop: { border: "1px dashed #9dbff0", borderRadius: 6, minHeight: 108, background: "#fbfdff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 5, padding: 9, textAlign: "center" } as const,
  dropActive: { border: "2px solid #2573e8", background: "#eef6ff", boxShadow: "0 0 0 3px rgba(37,115,232,.08)" } as const,
  dropTitle: { fontSize: 10, fontWeight: 700, color: "#174c8d" } as const,
  input: { height: 28, border: "1px solid #cbd8e7", borderRadius: 4, padding: "0 7px", fontSize: 10, outline: "none", minWidth: 0 } as const,
  button: { height: 27, border: "1px solid #2877e5", background: "#2877e5", color: "#fff", borderRadius: 4, padding: "0 9px", fontSize: 10, fontWeight: 700, cursor: "pointer" } as const,
  ghost: { height: 26, border: "1px solid #c9d7e8", background: "#fff", color: "#2e537b", borderRadius: 4, padding: "0 8px", fontSize: 10, cursor: "pointer" } as const,
  list: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 5 } as const,
  item: { border: "1px solid #e1e8f1", borderRadius: 5, overflow: "hidden", background: "#fff" } as const,
  thumb: { width: "100%", height: 68, objectFit: "cover", display: "block", background: "#f3f6fa" } as const,
  meta: { padding: "5px 6px" } as const,
  itemTitle: { fontSize: 10, fontWeight: 700, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as const,
  itemInfo: { fontSize: 8, color: "#8293a8", display: "block", marginTop: 2 } as const,
};

export default function MediaManager({ isAdmin }: { isAdmin: boolean }) {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState<MediaType | null>(null);
  const [newDirType, setNewDirType] = useState<MediaType | null>(null);
  const [newDirName, setNewDirName] = useState("");
  const [selectedDir, setSelectedDir] = useState<Record<MediaType, string>>({ video: "", youtube: "", image: "" });
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const videoInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setError("");
      const response = await fetch("/api/media", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `미디어 서버 오류 (${response.status})`);
      setDirectories(data.directories || []);
      setItems(data.items || []);
    } catch (e) {
      setDirectories([]); setItems([]);
      setError(e instanceof Error ? e.message : "미디어 데이터를 불러오지 못했습니다.");
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    const preventBrowserFileOpen = (event: globalThis.DragEvent) => {
      if (event.dataTransfer?.types?.includes("Files") || event.dataTransfer?.types?.includes("text/uri-list")) event.preventDefault();
    };
    window.addEventListener("dragover", preventBrowserFileOpen);
    window.addEventListener("drop", preventBrowserFileOpen);
    return () => { window.removeEventListener("dragover", preventBrowserFileOpen); window.removeEventListener("drop", preventBrowserFileOpen); };
  }, [isAdmin]);

  if (!isAdmin) {
    return <section style={styles.shell}><div style={{ textAlign: "center", padding: "14px 8px" }}><div style={{ fontSize: 20, marginBottom: 3 }}>🔒</div><h3 style={{ ...styles.heading, fontSize: 12 }}>동영상 & 이미지</h3><p style={{ ...styles.sub, fontSize: 9 }}>로그인 후 동영상 저장, YouTube 링크, 이미지 저장 기능을 이용할 수 있습니다.</p></div></section>;
  }

  const dirs = (type: MediaType) => directories.filter((d) => d.media_type === type);
  const visibleItems = (type: MediaType) => items.filter((item) => item.media_type === type && (!selectedDir[type] || item.directory_id === selectedDir[type]));

  async function createDirectory() {
    if (!newDirType || !newDirName.trim()) return;
    try {
      setBusy(true); setError("");
      const response = await fetch("/api/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "directory", mediaType: newDirType, name: newDirName.trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `디렉토리 생성 오류 (${response.status})`);
      const directory = { id: data.id, media_type: newDirType, name: data.name } as Directory;
      setDirectories((current) => [...current, directory]);
      setSelectedDir((current) => ({ ...current, [newDirType]: directory.id }));
      setNewDirName(""); setNewDirType(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "디렉토리를 만들지 못했습니다.");
    } finally { setBusy(false); }
  }

  async function saveItem(payload: Record<string, unknown>) {
    const response = await fetch("/api/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "item", ...payload }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `콘텐츠 저장 오류 (${response.status})`);
  }

  async function uploadFile(file: File, type: "video" | "image") {
    if (!file || !file.type.startsWith(type === "video" ? "video/" : "image/")) { setError(type === "video" ? "동영상 파일만 넣어주세요." : "이미지 파일만 넣어주세요."); return; }
    const defaultTitle = file.name.replace(/\.[^.]+$/, "");
    const title = window.prompt("저장할 제목을 입력하세요", defaultTitle)?.trim();
    if (!title) return;
    try {
      setBusy(true); setError("");
      const result = await upload(`media/${type}/${Date.now()}-${file.name.replace(/[^\w가-힣.()-]/g, "_")}`, file, { access: "public", handleUploadUrl: "/api/media/upload", multipart: true, onUploadProgress: (progress) => setError(`${LABELS[type]} 업로드 중 ${Math.round(progress.percentage)}%`) });
      await saveItem({ mediaType: type, title, directoryId: selectedDir[type] || null, fileUrl: result.url, blobPathname: result.pathname, mimeType: file.type, sizeBytes: file.size });
      setError(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "파일 업로드에 실패했습니다."); }
    finally { setBusy(false); }
  }

  async function handleFiles(files: FileList | File[], type: "video" | "image") { for (const file of Array.from(files)) await uploadFile(file, type); }

  async function handleDrop(event: DragEvent<HTMLDivElement>, type: MediaType) {
    event.preventDefault(); event.stopPropagation(); setDragOver(null);
    if (type === "youtube") {
      const url = (event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain") || "").trim();
      if (url) setYoutubeUrl(url);
      return;
    }
    if (event.dataTransfer.files?.length) await handleFiles(event.dataTransfer.files, type);
  }

  async function addYoutube() {
    if (!youtubeId(youtubeUrl)) { setError("유효한 YouTube URL을 넣어주세요."); return; }
    if (!youtubeTitle.trim()) { setError("YouTube 영상 제목을 입력해주세요."); return; }
    try {
      setBusy(true); setError("");
      await saveItem({ mediaType: "youtube", title: youtubeTitle.trim(), directoryId: selectedDir.youtube || null, youtubeUrl: youtubeUrl.trim() });
      setYoutubeUrl(""); setYoutubeTitle(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "YouTube 링크 저장에 실패했습니다."); }
    finally { setBusy(false); }
  }

  async function removeItem(id: string) {
    if (!window.confirm("이 콘텐츠를 삭제할까요?")) return;
    try {
      const response = await fetch(`/api/media?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "삭제하지 못했습니다.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "삭제하지 못했습니다."); }
  }

  function dragHandlers(type: MediaType) {
    return {
      onDragEnter: (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setDragOver(type); },
      onDragOver: (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = type === "youtube" ? "link" : "copy"; setDragOver(type); },
      onDragLeave: (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); if (event.currentTarget === event.target) setDragOver(null); },
      onDrop: (event: DragEvent<HTMLDivElement>) => handleDrop(event, type),
    };
  }

  function card(type: MediaType) {
    const typeDirs = dirs(type), list = visibleItems(type), selected = selectedDir[type];
    return <section style={styles.card} key={type}>
      <div style={styles.cardHead}><div><h3 style={styles.heading}>{LABELS[type]}</h3><p style={styles.sub}>{type === "video" ? "일반 동영상 파일을 저장합니다." : type === "youtube" ? "YouTube URL을 저장하고 임베드로 재생합니다." : "이미지 파일을 저장합니다."}</p></div><button type="button" style={styles.ghost} onClick={() => { setNewDirType(type); setNewDirName(""); }}>＋ 새 디렉토리</button></div>
      <div style={styles.body}>
        <aside style={styles.folders}>
          <button type="button" style={{ ...styles.folder, ...(selected === "" ? styles.selectedFolder : {}) }} onClick={() => setSelectedDir((current) => ({ ...current, [type]: "" }))}>▣ 전체 {type === "video" ? "동영상" : type === "youtube" ? "YouTube" : "이미지"}</button>
          {typeDirs.map((directory) => <button type="button" key={directory.id} title={directory.name} style={{ ...styles.folder, ...(selected === directory.id ? styles.selectedFolder : {}) }} onClick={() => setSelectedDir((current) => ({ ...current, [type]: directory.id }))}>▱ {directory.name}</button>)}
          <button type="button" style={{ ...styles.folder, color: "#2877e5", marginTop: "auto" }} onClick={() => { setNewDirType(type); setNewDirName(""); }}>＋ 새 디렉토리</button>
        </aside>
        <div style={styles.main}>
          {type === "youtube" ? <div {...dragHandlers(type)} style={{ ...styles.drop, ...(dragOver === type ? styles.dropActive : {}) }}>
            <div style={{ fontSize: 17, color: "#2877e5" }}>↳</div><b style={styles.dropTitle}>YouTube 링크를 여기에 드래그하거나 입력하세요</b>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr) auto", gap: 4, width: "100%" }}><input style={styles.input} value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." /><input style={styles.input} value={youtubeTitle} onChange={(event) => setYoutubeTitle(event.target.value)} placeholder="영상 제목" /><button type="button" style={styles.button} onClick={() => void addYoutube()} disabled={busy}>추가</button></div>
            <small style={styles.sub}>브라우저에서 YouTube 링크를 끌어와도 URL이 자동 입력됩니다.</small>
          </div> : <div {...dragHandlers(type)} style={{ ...styles.drop, ...(dragOver === type ? styles.dropActive : {}) }} onClick={() => (type === "video" ? videoInput : imageInput).current?.click()}>
            <div style={{ fontSize: 17, color: "#2877e5" }}>⇧</div><b style={styles.dropTitle}>{type === "video" ? "동영상 파일" : "이미지 파일"}을 드래그하거나 업로드하세요</b><small style={styles.sub}>{type === "video" ? "MP4, MOV, WEBM 등" : "JPG, PNG, WEBP, GIF 등"}</small><button type="button" style={styles.button} disabled={busy} onClick={(event) => { event.stopPropagation(); (type === "video" ? videoInput : imageInput).current?.click(); }}>파일 선택</button>
          </div>}
          <input ref={videoInput} type="file" accept={ACCEPT.video} multiple style={{ display: "none" }} onChange={(event) => { if (event.target.files) void handleFiles(event.target.files, "video"); event.currentTarget.value = ""; }} />
          <input ref={imageInput} type="file" accept={ACCEPT.image} multiple style={{ display: "none" }} onChange={(event) => { if (event.target.files) void handleFiles(event.target.files, "image"); event.currentTarget.value = ""; }} />
          <div style={styles.list}>{list.map((item) => <article key={item.id} style={styles.item}>
            {type === "video" && item.file_url ? <video src={item.file_url} controls preload="metadata" style={styles.thumb} /> : null}
            {type === "image" && item.file_url ? <img src={item.file_url} alt={item.title} style={styles.thumb} /> : null}
            {type === "youtube" && youtubeId(item.youtube_url) ? <iframe title={item.title} src={`https://www.youtube.com/embed/${youtubeId(item.youtube_url)}`} style={{ ...styles.thumb, border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : null}
            <div style={styles.meta}><b style={styles.itemTitle}>{item.title}</b><small style={styles.itemInfo}>{type === "youtube" ? item.youtube_url : formatSize(item.size_bytes)}</small><button type="button" style={{ border: 0, background: "transparent", color: "#8a9aaf", fontSize: 9, padding: "3px 0 0", cursor: "pointer" }} onClick={() => void removeItem(item.id)}>삭제</button></div>
          </article>)}</div>
          {!list.length && <div style={{ border: "1px dashed #d4dfec", borderRadius: 5, padding: 12, textAlign: "center", fontSize: 9, color: "#9aaabd" }}>저장된 콘텐츠가 없습니다.</div>}
        </div>
      </div>
    </section>;
  }

  return <section style={styles.shell} onDragOver={(event) => { if (event.dataTransfer.types.includes("Files") || event.dataTransfer.types.includes("text/uri-list")) event.preventDefault(); }}>
    <div style={{ marginBottom: 7 }}><h2 style={{ ...styles.heading, fontSize: 13 }}>동영상 & 이미지</h2><p style={styles.sub}>로그인한 사용자만 디렉토리와 미디어를 저장하고 관리할 수 있습니다.</p></div>
    {error && <div style={{ margin: "0 0 7px", border: "1px solid #f2b8b8", background: "#fff6f6", color: "#b42318", borderRadius: 5, padding: "7px 9px", fontSize: 9, lineHeight: 1.45 }}>{error}</div>}
    <div style={styles.grid}>{card("video")}{card("youtube")}{card("image")}</div>
    {newDirType && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(10,28,52,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setNewDirType(null); }}>
      <div style={{ width: 340, maxWidth: "100%", background: "#fff", borderRadius: 8, border: "1px solid #d6e1ed", boxShadow: "0 12px 35px rgba(0,0,0,.18)", padding: 16 }}>
        <h3 style={{ margin: "0 0 5px", fontSize: 13, color: "#0b2d5c" }}>{LABELS[newDirType]} 디렉토리 만들기</h3><p style={{ margin: "0 0 12px", fontSize: 9, color: "#7c8da2" }}>디렉토리 이름은 서버 데이터베이스에 저장되며 새로고침 후에도 유지됩니다.</p>
        <input autoFocus value={newDirName} onChange={(event) => setNewDirName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createDirectory(); }} placeholder="예: K-뷰티 산업" style={{ ...styles.input, width: "100%", boxSizing: "border-box", height: 34 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 12 }}><button type="button" style={styles.ghost} onClick={() => setNewDirType(null)}>취소</button><button type="button" style={styles.button} disabled={busy || !newDirName.trim()} onClick={() => void createDirectory()}>디렉토리 생성</button></div>
      </div>
    </div>}
  </section>;
}
