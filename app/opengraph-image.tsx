import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "2026 K-뷰티 화장품 산업 지형도";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f4f7fb",
          color: "#102f55",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", padding: "48px 64px", background: "linear-gradient(135deg,#071b3a,#123d75)", color: "white" }}>
          <div style={{ fontSize: 44, fontWeight: 800 }}>2026 K-뷰티 화장품 산업 지형도</div>
          <div style={{ marginTop: 12, fontSize: 22, color: "#c9dbf5" }}>한국 화장품 산업 데이터 · 기업 분석 · 미디어 관리 대시보드</div>
        </div>
        <div style={{ display: "flex", gap: 28, padding: "48px 64px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 28, borderRadius: 18, background: "white", border: "1px solid #d7e1ed" }}>
            <div style={{ fontSize: 25, fontWeight: 800, color: "#1769e8" }}>동영상 저장</div>
            <div style={{ marginTop: 20, padding: 22, borderRadius: 12, border: "2px dashed #9dbff0", fontSize: 20 }}>드래그 앤 드롭 · 미리보기</div>
            <div style={{ marginTop: 20, fontSize: 18 }}>MP4 · MOV · WEBM</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 28, borderRadius: 18, background: "white", border: "1px solid #d7e1ed" }}>
            <div style={{ fontSize: 25, fontWeight: 800, color: "#e62143" }}>YouTube 링크</div>
            <div style={{ marginTop: 20, padding: 22, borderRadius: 12, background: "#fff1f4", fontSize: 20 }}>자동 제목 · 썸네일 · 사이트 내 재생</div>
            <div style={{ marginTop: 20, fontSize: 18 }}>URL을 입력하면 영상 정보를 자동으로 가져옵니다.</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 28, borderRadius: 18, background: "white", border: "1px solid #d7e1ed" }}>
            <div style={{ fontSize: 25, fontWeight: 800, color: "#16a05d" }}>이미지 저장</div>
            <div style={{ marginTop: 20, padding: 22, borderRadius: 12, border: "2px dashed #9fd7b8", fontSize: 20 }}>이미지 드래그 앤 드롭 · 확대</div>
            <div style={{ marginTop: 20, fontSize: 18 }}>JPG · PNG · GIF · WEBP</div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", fontSize: 20, color: "#5e7692" }}>K-뷰티 산업 지형도 대시보드</div>
      </div>
    ),
    { ...size }
  );
}
