import type { Metadata } from "next"; import "./globals.css";
export const metadata: Metadata={title:"2026 K-뷰티 산업 지형도",description:"한국 화장품 산업 지형도 대시보드"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}