"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";

type MediaType = "video" | "youtube" | "image";
type Directory = { id: string; media_type: MediaType; name: string };
type MediaItem = {
  id: string;
  directory_id: string | null;
  media_type: MediaType;
  title: string;
  file_url: string | null;
  blob_pathname?: string | null;
  youtube_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

const LABELS: Record<MediaType, string> = { video: "동영상 저장", youtube: "YouTube 링크", image: "이미지 저장" };
const FOLDER_LABELS: Record<MediaType, string> = { video: "동영상", youtube: "YouTube", image: "이미지" };

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
  shell: { border: "1px solid #d8e2ee", borderRadius: 9, background: "#fff", padding: 10, color: "#0b2d5c", boxShadow: "0 1px 5px rgba(20,50,90,.04)" } as const,
  heading: { fontSize: 13, fontWeight: 800, margin: 0, color: "#0b2d5c" } as const,
  sub: { fontSize: 9, color: "#7890ad", margin: "3px 0 0" } as const,
  grid: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 9, marginTop: 9 } as const,
  card: { minWidth: 0, border: "1px solid #d5e0ed", borderRadius: 8, background: "#fff", overflow: "hidden" } as const,
  cardHead: { minHeight: 48, padding: "7px 8px", borderBottom: "1px solid #e3eaf2", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 } as const,
  body: { display: "grid", gridTemplateColumns: "112px minmax(0,1fr)", minHeight: 235 } as const,
  folders: { borderRight: "1px solid #e3eaf2", padding: 6, display: "flex", flexDirection: "column", gap: 3, background: "#fbfdff" } as const,
  folder: { border: 0, background: "transparent", textAlign: "left", padding: "6px 6px", borderRadius: 5, fontSize: 10, color: "#365476", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } as const,
  selectedFolder: { background: "#edf5ff", color: "#1262d6", fontWeight: 800 } as const,
  main: { minWidth: 0, padding: 8, display: "flex", flexDirection: "column", gap: 7 } as const,
  drop: { border: "1px dashed #9dbff0", borderRadius: 7, minHeight: 104, background: "#fbfdff", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 5, padding: 8, textAlign: "center", transition: "all .15s" } as const,
  dropActive: { border: "2px solid #2877e5", background: "#eef6ff", boxShadow: "0 0 0 3px rgba(37,115,232,.08)" } as const,
  dropTitle: { fontSize: 10, fontWeight: 800, color: "#174c8d" } as const,
  input: { height: 29, border: "1px solid #cbd8e7", borderRadius: 5, padding: "0 7px", fontSize: 10, outline: "none", minWidth: 0, flex: 1 } as const,
  button: { height: 28, border: "1px solid #2877e5", background: "#2877e5", color: "#fff", borderRadius: 5, padding: "0 9px", fontSize: 10, fontWeight: 800, cursor: "pointer" } as const,
  ghost: { height: 27, border: "1px solid #bfd0e4", background: "#fff", color: "#2e537b", borderRadius: 5, padding: "0 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" } as const,
  list: { display: "grid", gridTemplateColumns: "1fr", gap: 5, overflowY: "auto", maxHeight: 132 } as const,
  item: { border: "1px solid #e1e8f1", borderRadius: 6, overflow: "hidden", background: "#fff", display: "grid", gridTemplateColumns: "72px minmax(0,1fr) auto", alignItems: "center" } as const,
  thumb: { width: 72, height: 52, objectFit: "cover", display: "block", background: "#f3f6fa" } as const,
  meta: { padding: "5px 6px", minWidth: 0 } as const,
  itemTitle: { fontSize: 10, fontWeight: 800, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#163d67" } as const,
  itemInfo: { fontSize: 8, color: "#8293a8", display: "block", marginTop: 2 } as const,
  danger: { border: "1px solid #efb5b5", background: "#fff", color: "#d83b3b", borderRadius: 5, width: 27, height: 27, cursor: "pointer", marginRight: 5 } as const,
};

export default function MediaManager({ isAdmin }: { isAdmin: boolean }) {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState<MediaType | null>(null);
  const [selectedDir, setSelectedDir] = useState<Record<MediaType, string>>({ video: "", youtube: "", image: "" });
  const [dirDialog, setDirDialog] = useState<{ mode: "create" | "rename"; type: MediaType; id?: string; name: string } | null>(null);
  const [menuDir, setMenuDir] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");
  const videoInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await fetch("/api/media", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `미디어 서버 오류 (${response.status})`);
      setDirectories(data.directories || []);
      setItems(data.items || []);
      setError("");
    } catch (e) {
      setDirectories([]);
      setItems([]);
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
    return () => {
      window.removeEventListener("dragover", preventBrowserFileOpen);
      window.removeEventListener("drop", preventBrowserFileOpen);
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return <section style={styles.shell}><div style={{ textAlign: "center", padding: "14px 8px" }}><div style={{ fontSize: 20, marginBottom: 3 }}>🔒</div><h3 style={{ ...styles.heading, fontSize: 12 }}>동영상 & 이미지</h3><p style={{ ...styles.sub, fontSize: 9 }}>로그인 후 동영상 저장, YouTube 링크, 이미지 저장 기능을 이용할 수 있습니다.</p></div></section>;
  }

  const dirs = (type: MediaType) => directories.filter((d) => d.media_type === type);
  const visibleItems = (type: MediaType) => items.filter((item) => item.media_type === type && (!selectedDir[type] || item.directory_id === selectedDir[type]));

  async function createOrRenameDirectory() {
    if (!dirDialog || !dirDialog.name.trim()) return;
    try {
      setBusy(true); setError("");
      const method = dirDialog.mode === "create" ? "POST" : "PATCH";
      const body = dirDialog.mode === "create"
        ? { action: "directory", mediaType: dirDialog.type, name: dirDialog.name.trim() }
        : { id: dirDialog.id, name: dirDialog.name.trim() };
      const response = await fetch("/api/media", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "디렉토리 저장에 실패했습니다.");
      if (dirDialog.mode === "create") {
        const directory = { id: data.id, media_type: dirDialog.type, name: data.name } as Directory;
        setDirectories((current) => [...current, directory]);
        setSelectedDir((current) => ({ ...current, [dirDialog.type]: directory.id }));
      } else {
        setDirectories((current) => current.map((d) => d.id === dirDialog.id ? { ...d, name: dirDialog.name.trim() } : d));
      }
      setDirDialog(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "디렉토리를 저장하지 못했습니다.");
    } finally { setBusy(false); }
  }

  async function deleteDirectory(directory: Directory) {
    if (!window.confirm(`'${directory.name}' 디렉토리를 삭제하시겠습니까?\n디렉토리 안의 저장된 파일과 링크도 함께 삭제됩니다.`)) return;
    try {
      setBusy(true); setError("");
      const response = await fetch(`/api/media?id=${encodeURIComponent(directory.id)}&directory=1`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "디렉토리를 삭제하지 못했습니다.");
      setDirectories((current) => current.filter((d) => d.id !== directory.id));
      setItems((current) => current.filter((item) => item.directory_id !== directory.id));
      setSelectedDir((current) => ({ ...current, [directory.media_type]: current[directory.media_type] === directory.id ? "" : current[directory.media_type] }));
      setMenuDir(null);
    } catch (e) { setError(e instanceof Error ? e.message : "디렉토리를 삭제하지 못했습니다."); }
    finally { setBusy(false); }
  }

  async function saveItem(payload: Record<string, unknown>) {
    const response = await fetch("/api/media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "item", ...payload }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `콘텐츠 저장 오류 (${response.status})`);
  }

  async function uploadFile(file: File, type: "video" | "image") {
    const expected = type === "video" ? "video/" : "image/";
    if (!file.type.startsWith(expected)) { setError(type === "video" ? "동영상 파일만 넣어주세요." : "이미지 파일만 넣어주세요."); return; }
    const defaultTitle = file.name.replace(/\.[^.]+$/, "");
    const title = window.prompt("저장할 제목을 입력하세요", defaultTitle)?.trim();
    if (!title) return;
    try {
      setBusy(true); setError("");
      const safeName = file.name.replace(/[^\w가-힣.()-]/g, "_");
      const result = await upload(`media/${type}/${Date.now()}-${safeName}`, file, {
        access: "public",
        handleUploadUrl: "/api/media/upload",
        multipart: true,
        onUploadProgress: (progress) => setError(`${LABELS[type]} 업로드 중 ${Math.round(progress.percentage)}%`),
      });
      await saveItem({ mediaType: type, title, directoryId: selectedDir[type] || null, fileUrl: result.url, blobPathname: result.pathname, mimeType: file.type, sizeBytes: file.size });
      await load();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일 업로드에 실패했습니다.");
    } finally { setBusy(false); }
  }

  async function handleFiles(files: FileList | File[], type: "video" | "image") {
    for (const file of Array.from(files)) await uploadFile(file, type);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>, type: "video" | "image") {
    if (event.target.files?.length) await handleFiles(event.target.files, type);
    event.target.value = "";
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>, type: MediaType) {
    event.preventDefault(); event.stopPropagation(); setDragOver(null);
    if (type === "youtube") {
      const raw = (event.dataTransfer.getData("text/uri-list") || event.dataTransfer.getData("text/plain") || "").trim();
      if (raw) setYoutubeUrl(raw.split("\n")[0]);
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

  async function removeItem(item: MediaItem) {
    if (!window.confirm(`'${item.title}'을(를) 삭제하시겠습니까?`)) return;
    try {
      setBusy(true); setError("");
      const response = await fetch(`/api/media?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "삭제하지 못했습니다.");
      setItems((current) => current.filter((row) => row.id !== item.id));
    } catch (e) { setError(e instanceof Error ? e.message : "삭제하지 못했습니다."); }
    finally { setBusy(false); }
  }

  function dragHandlers(type: MediaType) {
    return {
      onDragEnter: (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setDragOver(type); },
      onDragOver: (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = type === "youtube" ? "link" : "copy"; setDragOver(type); },
      onDragLeave: (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setDragOver(null); },
      onDrop: (event: DragEvent<HTMLDivElement>) => { void handleDrop(event, type); },
    };
  }

  function folderMenu(type: MediaType, directory: Directory) {
    return menuDir === directory.id ? <div style={{ position: "absolute", right: 4, top: 29, zIndex: 5, width: 100, background: "#fff", border: "1px solid #d5e0ed", borderRadius: 6, boxShadow: "0 5px 18px rgba(20,50,90,.12)", padding: 3 }}>
      <button type="button" style={{ ...styles.folder, width: "100%" }} onClick={() => { setDirDialog({ mode: "rename", type, id: directory.id, name: directory.name }); setMenuDir(null); }}>✎ 이름 변경</button>
      <button type="button" style={{ ...styles.folder, width: "100%", color: "#d83b3b" }} onClick={() => void deleteDirectory(directory)}>⌫ 삭제</button>
    </div> : null;
  }

  function card(type: MediaType) {
    const typeDirs = dirs(type);
    const list = visibleItems(type);
    const selected = selectedDir[type];
    return <section style={styles.card} key={type}>
      <div style={styles.cardHead}>
        <div><h3 style={styles.heading}>{LABELS[type]}</h3><p style={styles.sub}>{type === "video" ? "일반 동영상 파일을 저장합니다." : type === "youtube" ? "YouTube URL을 저장하고 임베드로 재생합니다." : "이미지 파일을 저장합니다."}</p></div>
        <button type="button" style={styles.ghost} disabled={busy} onClick={() => setDirDialog({ mode: "create", type, name: "" })}>＋ 새 디렉토리</button>
      </div>
      <div style={styles.body}>
        <aside style={styles.folders}>
          <button type="button" style={{ ...styles.folder, ...(selected === "" ? styles.selectedFolder : {}) }} onClick={() => setSelectedDir((current) => ({ ...current, [type]: "" }))}>▣ 전체 {FOLDER_LABELS[type]}</button>
          {typeDirs.map((directory) => <div key={directory.id} style={{ position: "relative" }}>
            <button type="button" style={{ ...styles.folder, width: "100%", paddingRight: 24, ...(selected === directory.id ? styles.selectedFolder : {}) }} onClick={() => setSelectedDir((current) => ({ ...current, [type]: directory.id }))}>📁 {directory.name}</button>
            <button type="button" aria-label="디렉토리 메뉴" style={{ position: "absolute", right: 2, top: 2, border: 0, background: "transparent", color: "#7189a5", cursor: "pointer", width: 22, height: 24 }} onClick={() => setMenuDir((current) => current === directory.id ? null : directory.id)}>⋮</button>
            {folderMenu(type, directory)}
          </div>)}
          <button type="button" style={{ ...styles.folder, color: "#2877e5", marginTop: "auto" }} onClick={() => setDirDialog({ mode: "create", type, name: "" })}>＋ 새 디렉토리</button>
        </aside>
        <div style={styles.main}>
          {type === "youtube" ? <div {...dragHandlers(type)} style={{ ...styles.drop, ...(dragOver === type ? styles.dropActive : {}) }}>
            <div style={{ fontSize: 18, color: "#e62143" }}>↗</div>
            <div style={styles.dropTitle}>YouTube 링크를 여기에 드래그하거나 입력하세요</div>
            <div style={{ display: "flex", width: "100%", gap: 4 }}>
              <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={styles.input} />
              <input value={youtubeTitle} onChange={(e) => setYoutubeTitle(e.target.value)} placeholder="영상 제목" style={styles.input} />
              <button type="button" style={styles.button} disabled={busy} onClick={() => void addYoutube()}>추가</button>
            </div>
            <span style={styles.sub}>YouTube는 파일 저장이 아니라 URL/임베드 방식으로 관리됩니다.</span>
          </div> : <div {...dragHandlers(type)} style={{ ...styles.drop, ...(dragOver === type ? styles.dropActive : {}) }}>
            <div style={{ fontSize: 22, color: "#2877e5" }}>⇧</div>
            <div style={styles.dropTitle}>{type === "video" ? "동영상 파일을 드래그 앤 드롭하세요" : "이미지 파일을 드래그 앤 드롭하세요"}</div>
            <button type="button" style={styles.button} disabled={busy} onClick={() => (type === "video" ? videoInput.current?.click() : imageInput.current?.click())}>파일 선택</button>
            <span style={styles.sub}>{type === "video" ? "MP4, MOV, AVI, WEBM 등 · 최대 500MB" : "JPG, PNG, GIF, WEBP 등"}</span>
          </div>}
          {type === "video" && <input ref={videoInput} type="file" accept="video/*" multiple hidden onChange={(e) => void handleFileChange(e, "video")} />}
          {type === "image" && <input ref={imageInput} type="file" accept="image/*" multiple hidden onChange={(e) => void handleFileChange(e, "image")} />}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><strong style={{ fontSize: 10 }}>{selected ? typeDirs.find((d) => d.id === selected)?.name : `전체 ${FOLDER_LABELS[type]}`}</strong><span style={styles.sub}>총 {list.length}개</span></div>
          {list.length === 0 ? <div style={{ border: "1px dashed #d5e0ed", borderRadius: 6, padding: "15px 8px", textAlign: "center", color: "#9aaabd", fontSize: 9 }}>저장된 콘텐츠가 없습니다.</div> : <div style={styles.list}>{list.map((item) => {
            const id = youtubeId(item.youtube_url);
            return <div key={item.id} style={styles.item}>
              {type === "youtube" ? <div style={{ width: 72, height: 52, background: "#111", overflow: "hidden" }}>{id ? <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="YouTube 썸네일" style={styles.thumb} /> : null}</div> : type === "image" ? <img src={item.file_url || ""} alt={item.title} style={styles.thumb} /> : <video src={item.file_url || undefined} style={styles.thumb} muted preload="metadata" />}
              <div style={styles.meta}><span style={styles.itemTitle}>{item.title}</span><span style={styles.itemInfo}>{formatSize(item.size_bytes)} {item.created_at ? `· ${new Date(item.created_at).toLocaleDateString("ko-KR")}` : ""}</span>{type === "youtube" && item.youtube_url && <a href={item.youtube_url} target="_blank" rel="noreferrer" style={{ fontSize: 8, color: "#2877e5" }}>YouTube 열기 ↗</a>}</div>
              <button type="button" style={styles.danger} disabled={busy} onClick={() => void removeItem(item)} title="삭제">⌫</button>
            </div>;
          })}</div>}
        </div>
      </div>
    </section>;
  }

  return <section style={styles.shell}>
    <div><h2 style={{ ...styles.heading, fontSize: 14 }}>동영상 & 이미지</h2><p style={{ ...styles.sub, fontSize: 9 }}>로그인한 사용자만 디렉토리와 동영상·YouTube·이미지를 저장하고 관리할 수 있습니다.</p></div>
    {error && <div style={{ marginTop: 7, border: "1px solid #f2c3c3", background: "#fff7f7", color: "#c33", borderRadius: 6, padding: "6px 8px", fontSize: 9 }}>{error}</div>}
    <div style={styles.grid}>{(["video", "youtube", "image"] as MediaType[]).map(card)}</div>
    {dirDialog && <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(9,25,45,.32)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: 330, background: "#fff", borderRadius: 9, boxShadow: "0 15px 45px rgba(0,0,0,.2)", padding: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, color: "#0b2d5c" }}>{dirDialog.mode === "create" ? "새 디렉토리 만들기" : "디렉토리 이름 변경"}</h3>
        <p style={{ fontSize: 9, color: "#7890ad", margin: "5px 0 10px" }}>{LABELS[dirDialog.type]}</p>
        <input autoFocus value={dirDialog.name} onChange={(e) => setDirDialog({ ...dirDialog, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") void createOrRenameDirectory(); }} placeholder="디렉토리 제목" style={{ ...styles.input, width: "100%", boxSizing: "border-box" }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 12 }}><button type="button" style={styles.ghost} onClick={() => setDirDialog(null)}>취소</button><button type="button" style={styles.button} disabled={busy || !dirDialog.name.trim()} onClick={() => void createOrRenameDirectory()}>{dirDialog.mode === "create" ? "만들기" : "저장"}</button></div>
      </div>
    </div>}
  </section>;
}
