import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata={title:"2026 K-뷰티 산업 지형도",description:"한국 화장품 산업 지형도 대시보드"};

const menu=[
  {label:"산업 지형도",href:"/"},
  {label:"채용 분석",href:"/recruiting"},
  {label:"후보자 관리",href:"/candidates"},
  {label:"이력서 업로드",href:"/resume-upload"},
  {label:"AI 매칭",href:"/ai-match"},
];

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="ko"><body>
    <nav aria-label="주요 메뉴" style={{position:"sticky",top:0,zIndex:1000,display:"flex",alignItems:"center",gap:8,padding:"12px 24px",background:"rgba(255,255,255,.96)",borderBottom:"1px solid #e5e7eb",boxShadow:"0 2px 12px rgba(15,23,42,.06)",backdropFilter:"blur(10px)",overflowX:"auto",whiteSpace:"nowrap"}}>
      <div style={{fontWeight:800,fontSize:15,marginRight:10,color:"#16233b"}}>K-BEAUTY</div>
      {menu.map((item)=><Link key={item.href} href={item.href} style={{display:"inline-flex",alignItems:"center",padding:"9px 14px",borderRadius:9,textDecoration:"none",color:"#26344d",fontSize:14,fontWeight:700,border:"1px solid transparent"}}>{item.label}</Link>)}
    </nav>
    {children}
  </body></html>
}