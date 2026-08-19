"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Category = "대형 종합 뷰티" | "성장 인디 브랜드" | "ODM(색조)" | "ODM(기초)" | "플랫폼·유통";
type SortMode = "separate" | "consolidated" | "growth" | "manual";

type CompanyRow = {
  id: string;
  category: Category;
  company: string;
  revenue2025: number;
  revenue2025Consolidated: number;
  revenue2024: number;
  revenue2024Consolidated: number;
  brands: string;
  odm: string;
  items: string;
  ownership: string;
  location: string;
  hq?: string;
  seoulOffice?: string;
  gyeonggiOffice?: string;
  factory?: string;
  logistics?: string;
  memo: string;
  researchSource?: string;
};

const categories: Category[] = ["대형 종합 뷰티", "성장 인디 브랜드", "ODM(색조)", "ODM(기초)", "플랫폼·유통"];
const palette = ["#2f73e6", "#18a86b", "#ff9f1c", "#7754e8", "#16b7c8"];
const publicCompanies = ["아모레퍼시픽", "LG생활건강", "에이피알", "브이티", "달바글로벌", "코스맥스", "한국콜마", "씨앤씨인터내셔널", "CJ올리브영", "쿠팡"];

const locations: Record<string, string> = {
  "아모레퍼시픽": "서울특별시 용산구",
  "LG생활건강": "서울특별시 종로구",
  "에이피알": "서울특별시 송파구",
  "브이티": "서울특별시 강남구",
  "달바글로벌": "서울특별시 강남구",
  "구다이글로벌": "서울특별시 강남구",
  "토리든": "서울특별시 강남구",
  "코스맥스": "경기도 성남시",
  "한국콜마": "세종특별자치시",
  "씨앤씨인터내셔널": "경기도 성남시",
  "클리오": "서울특별시 성동구",
  "코스메카코리아": "충청북도 음성군",
  "한국화장품제조": "서울특별시 종로구",
  "CJ올리브영": "서울특별시 용산구",
  "쿠팡": "서울특별시 송파구",
  "네이버쇼핑": "경기도 성남시",
  "무신사": "서울특별시 성동구",
  "컬리": "서울특별시 강남구",
};

const seed: CompanyRow[] = [
  { id:"amore", category:"대형 종합 뷰티", company:"아모레퍼시픽", revenue2025:34073, revenue2025Consolidated:58990, revenue2024:32130, revenue2024Consolidated:45288, brands:"설화수, 라네즈, 헤라, 에뛰드", odm:"", items:"기초, 색조, 향수, 헤어케어", ownership:"", location:locations["아모레퍼시픽"], hq:"서울특별시 용산구 한강대로 100", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"lg", category:"대형 종합 뷰티", company:"LG생활건강", revenue2025:21664, revenue2025Consolidated:71255, revenue2024:28709, revenue2024Consolidated:68048, brands:"더후, CNP, 오휘, 숨37°", odm:"", items:"기초, 색조, 퍼스널케어", ownership:"", location:locations["LG생활건강"], hq:"서울특별시 종로구 새문안로 58", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"apr", category:"성장 인디 브랜드", company:"에이피알", revenue2025:17886, revenue2025Consolidated:18863, revenue2024:12625, revenue2024Consolidated:12625, brands:"메디큐브, 에이프릴스킨, 포맨트", odm:"", items:"기초, 뷰티디바이스, 향수", ownership:"", location:locations["에이피알"], hq:"서울특별시 송파구 올림픽로 300", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"vt", category:"성장 인디 브랜드", company:"브이티", revenue2025:9018, revenue2025Consolidated:6162, revenue2024:7911, revenue2024Consolidated:7911, brands:"VT, 리들샷", odm:"", items:"기초, 마스크팩, 클렌징", ownership:"", location:locations["브이티"], hq:"서울특별시 강남구", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"dalba", category:"성장 인디 브랜드", company:"달바글로벌", revenue2025:4589, revenue2025Consolidated:4589, revenue2024:2742, revenue2024Consolidated:2742, brands:"달바", odm:"", items:"페이셜케어, 선케어, 바디케어", ownership:"", location:locations["달바글로벌"], hq:"서울특별시 강남구", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"goodai", category:"성장 인디 브랜드", company:"구다이글로벌", revenue2025:2550, revenue2025Consolidated:2550, revenue2024:1501, revenue2024Consolidated:1501, brands:"조선미녀, 스킨1004, 티르티르", odm:"", items:"기초, 선케어, 메이크업", ownership:"", location:locations["구다이글로벌"], hq:"서울특별시 강남구", memo:"", researchSource:"회사 홈페이지 / 기업정보" },
  { id:"torriden", category:"성장 인디 브랜드", company:"토리든", revenue2025:2180, revenue2025Consolidated:2180, revenue2024:1367, revenue2024Consolidated:1367, brands:"토리든", odm:"", items:"기초, 클렌징, 선케어", ownership:"", location:locations["토리든"], hq:"서울특별시 강남구", memo:"", researchSource:"회사 홈페이지 / 기업정보" },
  { id:"cosmax", category:"ODM(색조)", company:"코스맥스", revenue2025:27525, revenue2025Consolidated:27525, revenue2024:21555, revenue2024Consolidated:21555, brands:"", odm:"코스맥스", items:"립, 아이, 베이스 메이크업", ownership:"", location:locations["코스맥스"], hq:"경기도 성남시 분당구 판교로 255", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"kolmar", category:"ODM(색조)", company:"한국콜마", revenue2025:26426, revenue2025Consolidated:26426, revenue2024:21557, revenue2024Consolidated:21557, brands:"", odm:"한국콜마", items:"베이스, 립, 아이 메이크업", ownership:"", location:locations["한국콜마"], hq:"세종특별자치시 전의면 덕고개길 12", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"cnc", category:"ODM(색조)", company:"씨앤씨인터내셔널", revenue2025:4893, revenue2025Consolidated:4893, revenue2024:3300, revenue2024Consolidated:3300, brands:"", odm:"씨앤씨인터내셔널", items:"립, 아이 메이크업", ownership:"", location:locations["씨앤씨인터내셔널"], hq:"경기도 성남시", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"clio", category:"성장 인디 브랜드", company:"클리오", revenue2025:4589, revenue2025Consolidated:4589, revenue2024:3940, revenue2024Consolidated:3940, brands:"클리오, 페리페라", odm:"", items:"아이, 립, 베이스 메이크업", ownership:"", location:locations["클리오"], hq:"서울특별시 성동구", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"cosme", category:"ODM(색조)", company:"코스메카코리아", revenue2025:4476, revenue2025Consolidated:4476, revenue2024:3600, revenue2024Consolidated:3600, brands:"", odm:"코스메카코리아", items:"색조 베이스, 립, 쿠션", ownership:"", location:locations["코스메카코리아"], hq:"충청북도 음성군", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"cosmax-base", category:"ODM(기초)", company:"코스맥스", revenue2025:27525, revenue2025Consolidated:27525, revenue2024:21555, revenue2024Consolidated:21555, brands:"", odm:"코스맥스", items:"세럼, 크림, 토너, 선케어", ownership:"", location:locations["코스맥스"], hq:"경기도 성남시 분당구 판교로 255", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"kolmar-base", category:"ODM(기초)", company:"한국콜마", revenue2025:26426, revenue2025Consolidated:26426, revenue2024:21557, revenue2024Consolidated:21557, brands:"", odm:"한국콜마", items:"스킨케어, 선케어, 클렌징", ownership:"", location:locations["한국콜마"], hq:"세종특별자치시 전의면 덕고개길 12", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"cosme-base", category:"ODM(기초)", company:"코스메카코리아", revenue2025:4476, revenue2025Consolidated:4476, revenue2024:3600, revenue2024Consolidated:3600, brands:"", odm:"코스메카코리아", items:"스킨케어, 선케어, 크림", ownership:"", location:locations["코스메카코리아"], hq:"충청북도 음성군", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"korea-manufacture", category:"ODM(기초)", company:"한국화장품제조", revenue2025:2125, revenue2025Consolidated:2125, revenue2024:1900, revenue2024Consolidated:1900, brands:"", odm:"한국화장품제조", items:"기초 스킨케어, 클렌징", ownership:"", location:locations["한국화장품제조"], hq:"서울특별시 종로구", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"oliveyoung", category:"플랫폼·유통", company:"CJ올리브영", revenue2025:47890, revenue2025Consolidated:47890, revenue2024:38800, revenue2024Consolidated:38800, brands:"올리브영", odm:"", items:"K-뷰티 오프라인·온라인 유통", ownership:"", location:locations["CJ올리브영"], hq:"서울특별시 용산구", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"coupang", category:"플랫폼·유통", company:"쿠팡", revenue2025:31920, revenue2025Consolidated:0, revenue2024:28000, revenue2024Consolidated:0, brands:"쿠팡 뷰티", odm:"", items:"온라인 뷰티 이커머스", ownership:"", location:locations["쿠팡"], hq:"서울특별시 송파구", memo:"", researchSource:"회사 홈페이지 / 공시자료" },
  { id:"naver", category:"플랫폼·유통", company:"네이버쇼핑", revenue2025:22450, revenue2025Consolidated:0, revenue2024:20500, revenue2024Consolidated:0, brands:"스마트스토어", odm:"", items:"온라인 뷰티 플랫폼", ownership:"", location:locations["네이버쇼핑"], hq:"경기도 성남시", memo:"", researchSource:"회사 홈페이지 / 기업정보" },
  { id:"musinsa", category:"플랫폼·유통", company:"무신사", revenue2025:14980, revenue2025Consolidated:0, revenue2024:12000, revenue2024Consolidated:0, brands:"무신사 뷰티", odm:"", items:"패션·뷰티 이커머스", ownership:"", location:locations["무신사"], hq:"서울특별시 성동구", memo:"", researchSource:"회사 홈페이지 / 기업정보" },
  { id:"kurly", category:"플랫폼·유통", company:"컬리", revenue2025:7630, revenue2025Consolidated:0, revenue2024:6200, revenue2024Consolidated:0, brands:"뷰티컬리", odm:"", items:"온라인 뷰티 유통", ownership:"", location:locations["컬리"], hq:"서울특별시 강남구", memo:"", researchSource:"회사 홈페이지 / 기업정보" },
];

const money = (v:number) => {
  if (!v) return "확인 필요";
  const n = Math.round(v);
  return n >= 10000 ? `${Math.floor(n/10000)}조${n%10000 ? `${n%10000}억` : ""}` : `${n.toLocaleString("ko-KR")}억`;
};
const growth = (r:CompanyRow) => r.revenue2024 ? ((r.revenue2025-r.revenue2024)/r.revenue2024)*100 : null;
const keyOf = (r:CompanyRow) => r.id;
const emptyRow = (category:Category, id:string):CompanyRow => ({id,category,company:"",revenue2025:0,revenue2025Consolidated:0,revenue2024:0,revenue2024Consolidated:0,brands:"",odm:"",items:"",ownership:"",location:"",memo:""});

function SortButtons({ value, onChange }:{value:SortMode;onChange:(v:SortMode)=>void}){
  const opts:[SortMode,string][] = [["separate","별도 매출"],["consolidated","연결 매출"],["growth","성장률"],["manual","직전 순서"]];
  return <div className="sort-buttons">{opts.map(([v,label])=><button key={v} type="button" className={value===v?"active":""} onClick={()=>onChange(v)}>{label}</button>)}</div>;
}

function SectionCard({ title, rows, allRows, sortMode, setSortMode, search, setSearch, onAdd, onOpen, onDropOrder, expanded, onToggle }:{
  title:string; rows:CompanyRow[]; allRows:CompanyRow[]; sortMode:SortMode; setSortMode:(v:SortMode)=>void; search:string; setSearch:(v:string)=>void; onAdd:()=>void; onOpen:(r:CompanyRow)=>void; onDropOrder:(dragId:string,targetId:string)=>void; expanded:boolean; onToggle:()=>void;
}){
  const visible = rows.filter(r=>r.company && r.company.toLowerCase().includes(search.toLowerCase())).slice(0, expanded ? rows.length : 5);
  return <section className="card category-card">
    <div className="section-head"><h2>{title}</h2><div className="section-actions"><input aria-label={`${title} 기업명 검색`} value={search} onChange={e=>setSearch(e.target.value)} placeholder="기업명 검색..."/><button type="button" className="primary" onClick={onAdd}>＋ 기업 추가</button><button type="button" onClick={onToggle}>{expanded?"접기":"전체 보기"}</button></div></div>
    <SortButtons value={sortMode} onChange={setSortMode}/>
    <div className={`table-wrap ${expanded?"expanded":"collapsed"}`}>
      <table><thead><tr><th>순위</th><th>기업명</th><th>2025 별도 매출</th><th>2025 연결 매출</th><th>성장률</th><th>회사 위치(본사)</th></tr></thead>
      <tbody>{visible.map((r,i)=><tr key={keyOf(r)} draggable onDragStart={e=>e.dataTransfer.setData("text/plain",r.id)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(id&&id!==r.id)onDropOrder(id,r.id)}} onClick={()=>onOpen(r)}><td>{i+1}</td><td className="company-link">☷ {r.company}</td><td>{money(r.revenue2025)}</td><td>{r.revenue2025Consolidated?money(r.revenue2025Consolidated):"확인 필요"}</td><td className={growth(r)!==null&&growth(r)!<0?"negative":"positive"}>{growth(r)!==null?`${growth(r)!.toFixed(1)}%`:"-"}</td><td>{r.location||"-"}</td></tr>)}</tbody></table>
    </div>
    <div className="section-foot"><span>※ 회사명을 드래그하여 순서를 변경</span><button type="button" onClick={onToggle}>{expanded?"접기":"전체 보기 →"}</button></div>
  </section>;
}

export default function HomePage(){
  const [rows,setRows] = useState<CompanyRow[]>(seed);
  const [selected,setSelected] = useState<CompanyRow|null>(null);
  const [compare,setCompare] = useState<string[]>([]);
  const [sortAll,setSortAll] = useState<SortMode>("manual");
  const [sorts,setSorts] = useState<Record<string,SortMode>>({"ODM(색조)":"manual","ODM(기초)":"manual","플랫폼·유통":"manual"});
  const [searchAll,setSearchAll] = useState("");
  const [searches,setSearches] = useState<Record<string,string>>({"ODM(색조)":"","ODM(기초)":"","플랫폼·유통":""});
  const [expanded,setExpanded] = useState<Record<string,boolean>>({"ODM(색조)":false,"ODM(기초)":false,"플랫폼·유통":false,"all":false});
  const [year,setYear] = useState("2025");
  const [categoryFilter,setCategoryFilter] = useState("전체 카테고리");
  const [regionFilter,setRegionFilter] = useState("전체 지역");

  useEffect(()=>{
    try { const saved = window.localStorage.getItem("kbeauty-dashboard-rows-v3"); if(saved) setRows(JSON.parse(saved)); } catch {}
  },[]);
  useEffect(()=>{ try { window.localStorage.setItem("kbeauty-dashboard-rows-v3",JSON.stringify(rows)); } catch {} },[rows]);

  const updateRow = (id:string, patch:Partial<CompanyRow>) => { setRows(prev=>prev.map(r=>r.id===id?{...r,...patch}:r)); setSelected(prev=>prev&&prev.id===id?{...prev,...patch}:prev); };
  const addCompany = (category:Category) => {
    const id = `${category}-${Date.now()}`;
    const row = emptyRow(category,id);
    setRows(prev=>[...prev,row]);
    setSelected(row);
  };
  const removeCompare = (id:string)=>setCompare(prev=>prev.filter(x=>x!==id));
  const addCompare = (id:string)=>setCompare(prev=>prev.includes(id)||prev.length>=5?prev:[...prev,id]);
  const dropCompare = (id:string)=>addCompare(id);
  const reorder = (category:Category, dragId:string,targetId:string) => {
    setRows(prev=>{
      const cat = prev.filter(r=>r.category===category);
      const rest = prev.filter(r=>r.category!==category);
      const from = cat.findIndex(r=>r.id===dragId); const to=cat.findIndex(r=>r.id===targetId);
      if(from<0||to<0)return prev;
      const next=[...cat]; const [item]=next.splice(from,1); next.splice(to,0,item); return [...rest,...next];
    });
  };
  const sorted = (list:CompanyRow[],mode:SortMode)=>{
    if(mode==="manual")return list;
    return [...list].sort((a,b)=> mode==="growth" ? (growth(b)||0)-(growth(a)||0) : mode==="consolidated" ? b.revenue2025Consolidated-a.revenue2025Consolidated : b.revenue2025-a.revenue2025);
  };
  const filteredAll = useMemo(()=>rows.filter(r=>r.company && (!searchAll||r.company.toLowerCase().includes(searchAll.toLowerCase())) && (categoryFilter==="전체 카테고리"||r.category===categoryFilter) && (regionFilter==="전체 지역"||r.location.includes(regionFilter))),[rows,searchAll,categoryFilter,regionFilter]);
  const allRows = sorted(filteredAll,sortAll);
  const categoryRows = (category:Category) => sorted(rows.filter(r=>r.category===category&&r.company),sorts[category]||"manual");
  const publicRows = rows.filter(r=>publicCompanies.includes(r.company)).slice(0,10);
  const top = [...rows.filter(r=>r.company)].sort((a,b)=>b.revenue2025-a.revenue2025).slice(0,10);
  const growthTop = [...rows.filter(r=>r.company)].sort((a,b)=>(growth(b)||0)-(growth(a)||0)).slice(0,10);
  const catTotals = categories.map(c=>({name:c,value:rows.filter(r=>r.category===c).reduce((s,r)=>s+r.revenue2025,0)})).filter(x=>x.value>0);
  const compareRows = compare.map(id=>rows.find(r=>r.id===id)).filter(Boolean) as CompanyRow[];
  const regions = Array.from(new Set(rows.map(r=>r.location).filter(Boolean))).slice(0,12);

  const openCompany = (r:CompanyRow)=>setSelected(r);
  const handleAllDrop = (dragId:string,targetId:string)=>{
    setRows(prev=>{ const list=[...prev]; const from=list.findIndex(r=>r.id===dragId); const to=list.findIndex(r=>r.id===targetId); if(from<0||to<0)return prev; const [item]=list.splice(from,1); list.splice(to,0,item); return list; });
  };
  const exportExcel=()=>{const ws=XLSX.utils.json_to_sheet(rows.map(r=>({기업명:r.company,카테고리:r.category,"2025 별도":r.revenue2025,"2025 연결":r.revenue2025Consolidated,"성장률":growth(r),본사:r.location,브랜드사:r.brands,ODM사:r.odm,해당품목:r.items,경영권주체:r.ownership,메모:r.memo})));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"기업데이터");XLSX.writeFile(wb,"kbeauty-company-data.xlsx");};
  const exportPdf=()=>{const doc=new jsPDF();doc.setFontSize(16);doc.text("2026 K-Beauty Industry Landscape",20,20);doc.setFontSize(9);rows.slice(0,30).forEach((r,i)=>doc.text(`${i+1}. ${r.company} | ${r.category} | ${money(r.revenue2025)} | ${r.location}`,20,30+i*6));doc.save("kbeauty-industry-dashboard.pdf");};

  return <div className="dashboard-page">
    <header className="dashboard-title"><div><h1>2026 K-뷰티 화장품 산업 지형도</h1><p>매출 · 성장률 · 기업 비교 · 채용 수요 현황</p></div><div className="title-actions"><span>외부 공개 · 보기 전용</span><Link href="/login" className="login-link">관리자 로그인</Link></div></header>
    <div className="filter-bar"><select value={year} onChange={e=>setYear(e.target.value)} aria-label="연도"><option>2025</option><option>2024</option><option>2023</option></select><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} aria-label="카테고리"><option>전체 카테고리</option>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={regionFilter} onChange={e=>setRegionFilter(e.target.value)} aria-label="지역"><option>전체 지역</option>{regions.map(r=><option key={r}>{r}</option>)}</select><button type="button" className="dark-btn" onClick={()=>{setYear("2025");setCategoryFilter("전체 카테고리");setRegionFilter("전체 지역");}}>필터 초기화</button><div className="spacer"/><small>단위: 억 원</small><button type="button" onClick={exportExcel}>엑셀 내보내기</button><button type="button" onClick={exportPdf}>PDF 출력</button></div>

    <main className="main-grid">
      <Card title="기업 매출 TOP 10"><ResponsiveContainer width="100%" height={220}><BarChart data={top} margin={{top:8,right:8,left:0,bottom:36}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="company" angle={-28} textAnchor="end" height={55} tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip formatter={(v)=>money(Number(v))}/><Bar dataKey="revenue2025" radius={[5,5,0,0]}>{top.map((_,i)=><Cell key={i} fill={palette[i%palette.length]}/>)}</Bar></BarChart></ResponsiveContainer></Card>
      <Card title="매출 성장률 TOP 10"><ResponsiveContainer width="100%" height={220}><LineChart data={growthTop.map(r=>({...r,growthValue:Number(growth(r)||0)}))} margin={{top:8,right:10,left:0,bottom:36}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="company" angle={-28} textAnchor="end" height={55} tick={{fontSize:10}}/><YAxis tickFormatter={v=>`${v}%`} tick={{fontSize:10}}/><Tooltip formatter={(v)=>`${Number(v).toFixed(1)}%`}/><Line type="monotone" dataKey="growthValue" stroke="#18a86b" strokeWidth={3} dot={{r:3}}/></LineChart></ResponsiveContainer></Card>
      <Card title="카테고리별 매출 비중"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={catTotals} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={2}>{catTotals.map((_,i)=><Cell key={i} fill={palette[i%palette.length]}/>)}</Pie><Tooltip formatter={(v)=>money(Number(v))}/></PieChart></ResponsiveContainer><div className="legend">{catTotals.map((x,i)=><span key={x.name}><i style={{background:palette[i%palette.length]}}/>{x.name} <b>{((x.value/(catTotals.reduce((s,a)=>s+a.value,0)||1))*100).toFixed(1)}%</b></span>)}</div></Card>

      <SectionCard title="ODM (색조)" rows={categoryRows("ODM(색조)")} allRows={rows} sortMode={sorts["ODM(색조)"]||"manual"} setSortMode={v=>setSorts(p=>({...p,"ODM(색조)":v}))} search={searches["ODM(색조)"]} setSearch={v=>setSearches(p=>({...p,"ODM(색조)":v}))} onAdd={()=>addCompany("ODM(색조)")} onOpen={openCompany} onDropOrder={(a,b)=>reorder("ODM(색조)",a,b)} expanded={!!expanded["ODM(색조)"]} onToggle={()=>setExpanded(p=>({...p,"ODM(색조)":!p["ODM(색조)"]}))}/>
      <SectionCard title="ODM (기초)" rows={categoryRows("ODM(기초)")} allRows={rows} sortMode={sorts["ODM(기초)"]||"manual"} setSortMode={v=>setSorts(p=>({...p,"ODM(기초)":v}))} search={searches["ODM(기초)"]} setSearch={v=>setSearches(p=>({...p,"ODM(기초)":v}))} onAdd={()=>addCompany("ODM(기초)")} onOpen={openCompany} onDropOrder={(a,b)=>reorder("ODM(기초)",a,b)} expanded={!!expanded["ODM(기초)"]} onToggle={()=>setExpanded(p=>({...p,"ODM(기초)":!p["ODM(기초)"]}))}/>
      <SectionCard title="플랫폼 · 유통" rows={categoryRows("플랫폼·유통")} allRows={rows} sortMode={sorts["플랫폼·유통"]||"manual"} setSortMode={v=>setSorts(p=>({...p,"플랫폼·유통":v}))} search={searches["플랫폼·유통"]} setSearch={v=>setSearches(p=>({...p,"플랫폼·유통":v}))} onAdd={()=>addCompany("플랫폼·유통")} onOpen={openCompany} onDropOrder={(a,b)=>reorder("플랫폼·유통",a,b)} expanded={!!expanded["플랫폼·유통"]} onToggle={()=>setExpanded(p=>({...p,"플랫폼·유통":!p["플랫폼·유통"]}))}/>

      <section className="card public-card"><div className="section-head"><h2>공개 기업 TOP 10</h2></div><p className="hint">외부 방문자는 산업 지형도의 공개 데이터만 볼 수 있습니다.</p><table><thead><tr><th>기업명</th><th>카테고리</th><th>2025 별도 매출</th><th>회사 위치</th></tr></thead><tbody>{publicRows.map(r=><tr key={r.id}><td>{r.company}</td><td>{r.category}</td><td>{money(r.revenue2025)}</td><td>{r.location}</td></tr>)}</tbody></table></section>

      <section className="card all-data"><div className="section-head"><h2>전체 기업 데이터</h2><div className="section-actions"><input aria-label="전체 기업 검색" value={searchAll} onChange={e=>setSearchAll(e.target.value)} placeholder="기업명 검색..."/><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} aria-label="전체 기업 카테고리"><option>전체 카테고리</option>{categories.map(c=><option key={c}>{c}</option>)}</select><button type="button" className="primary" onClick={()=>addCompany("성장 인디 브랜드")}>＋ 기업 추가</button><button type="button" onClick={exportExcel}>엑셀 다운로드</button><button type="button" onClick={()=>setExpanded(p=>({...p,all:!p.all}))}>{expanded.all?"접기":"전체 보기"}</button></div></div><SortButtons value={sortAll} onChange={setSortAll}/><div className={`table-wrap all-table ${expanded.all?"expanded":"collapsed"}`}><table><thead><tr><th>순서</th><th>기업명</th><th>카테고리</th><th>2025 별도 매출</th><th>2025 연결 매출</th><th>성장률</th><th>회사 위치(본사)</th></tr></thead><tbody>{allRows.map((r,i)=><tr key={r.id} draggable onDragStart={e=>e.dataTransfer.setData("text/plain",r.id)} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(id&&id!==r.id)handleAllDrop(id,r.id)}} onClick={()=>openCompany(r)}><td>☷ {i+1}</td><td className="company-link">{r.company}</td><td>{r.category}</td><td>{money(r.revenue2025)}</td><td>{r.revenue2025Consolidated?money(r.revenue2025Consolidated):"확인 필요"}</td><td className={growth(r)!==null&&growth(r)!<0?"negative":"positive"}>{growth(r)!==null?`${growth(r)!.toFixed(1)}%`:"-"}</td><td>{r.location||"-"}</td></tr>)}</tbody></table></div><div className="pagination"><span>전체 {allRows.length}개 기업</span><span>1  2  3  4  5  …  8</span></div></section>

      <section className="card compare-card"><div className="section-head"><h2>기업 드래그 → 인터랙티브 비교 그래프</h2><span className="small-badge">최대 5개</span></div><div className="drop-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData("text/plain");if(id)dropCompare(id)}}><strong>비교할 기업을 최대 5개까지 드래그해 주세요.</strong><div className="chips">{compareRows.length?compareRows.map(r=><button type="button" key={r.id} className="chip" onClick={()=>removeCompare(r.id)}>{r.company} ×</button>):<span>전체 기업 데이터 또는 카테고리 기업을 이 영역으로 드래그</span>}</div></div><div className="compare-tabs"><button type="button" className="active">매출 비교</button><button type="button">성장률 비교</button></div><ResponsiveContainer width="100%" height={330}><BarChart data={compareRows.map(r=>({company:r.company,"2024 매출":r.revenue2024,"2025 매출":r.revenue2025}))} margin={{top:20,right:10,left:10,bottom:30}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="company" tick={{fontSize:11}}/><YAxis tick={{fontSize:10}}/><Tooltip formatter={(v)=>money(Number(v))}/><Bar dataKey="2024 매출" fill="#2f73e6" radius={[4,4,0,0]}/><Bar dataKey="2025 매출" fill="#7754e8" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></section>
    </main>

    {selected && <aside className="detail-drawer"><div className="drawer-head"><div><span className="eyebrow">기업 상세 정보</span><h2>{selected.company||"신규 기업"}</h2></div><button type="button" className="close" onClick={()=>setSelected(null)}>×</button></div><div className="drawer-tabs"><button className="active" type="button">개요</button><button type="button">재무 정보</button><button type="button">채용 정보</button><button type="button">메모</button></div><div className="drawer-body"><h3>기본 정보</h3><Field label="브랜드사" value={selected.brands} onChange={v=>updateRow(selected.id,{brands:v})}/><Field label="ODM사" value={selected.odm} onChange={v=>updateRow(selected.id,{odm:v})}/><Field label="해당품목" value={selected.items} onChange={v=>updateRow(selected.id,{items:v})}/><Field label="경영권 주체" value={selected.ownership} onChange={v=>updateRow(selected.id,{ownership:v})} placeholder="현재 회사를 소유한 주체"/><Field label="작년대비 성장률(별도매출)" value={growth(selected)!==null?`${growth(selected)!.toFixed(1)}%`:"-"} readOnly/><h3>위치 정보 <small>(회사 홈페이지 기준)</small></h3><Field label="본사" value={selected.hq||selected.location} onChange={v=>updateRow(selected.id,{hq:v,location:v})}/><Field label="서울사무소" value={selected.seoulOffice||""} onChange={v=>updateRow(selected.id,{seoulOffice:v})}/><Field label="경기사무소" value={selected.gyeonggiOffice||""} onChange={v=>updateRow(selected.id,{gyeonggiOffice:v})}/><Field label="공장" value={selected.factory||""} onChange={v=>updateRow(selected.id,{factory:v})}/><Field label="물류센터" value={selected.logistics||""} onChange={v=>updateRow(selected.id,{logistics:v})}/><h3>내가 기록한 메모</h3><textarea className="memo" value={selected.memo} onChange={e=>updateRow(selected.id,{memo:e.target.value})} placeholder="대표이사 접촉, 채용 예정, 인수 후 조직개편, 헤드헌팅 후보 기업 등 자유롭게 기록"/><button type="button" className="save-btn" onClick={()=>{try{window.localStorage.setItem("kbeauty-dashboard-rows-v3",JSON.stringify(rows));}catch{} }}>저장</button><h3>인수 정보</h3><Field label="인수 주체" value={selected.ownership} onChange={v=>updateRow(selected.id,{ownership:v})}/><div className="research-note">최신 인터넷 조사 결과를 입력할 수 있으며, 현재 데이터의 근거는 회사 홈페이지·공시자료를 우선합니다.</div></div></aside>}
  </div>;
}

function Field({label,value,onChange,placeholder,readOnly=false}:{label:string;value:string;onChange?:(v:string)=>void;placeholder?:string;readOnly?:boolean}){
  return <label className="field"><span>{label}</span><input value={value||""} readOnly={readOnly} placeholder={placeholder} onChange={e=>onChange?.(e.target.value)}/></label>;
}

function Card({title,children}:{title:string;children:ReactNode}){ return <section className="card"><h2>{title}</h2>{children}</section>; }

<style jsx global>{`
:root{--navy:#0d2144;--navy2:#142d58;--blue:#2f73e6;--line:#dfe6f0;--muted:#667085;--bg:#f4f7fb;--green:#18a86b;--red:#ef4444}
*{box-sizing:border-box}.dashboard-page{min-height:calc(100vh - 54px);background:var(--bg);color:#18233a;font-family:Arial,"Noto Sans KR",sans-serif;padding-bottom:40px}.dashboard-title{height:86px;background:linear-gradient(110deg,#071a3b,#122b54);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:16px 24px}.dashboard-title h1{font-size:25px;margin:0 0 6px;font-weight:800}.dashboard-title p{font-size:12px;margin:0;color:#c9d6ea}.title-actions{display:flex;align-items:center;gap:10px}.title-actions span,.title-actions button,.title-actions .login-link{border:1px solid #36517b;background:#172f56;color:#fff;border-radius:9px;padding:8px 11px;font-size:11px;text-decoration:none}.filter-bar{max-width:1180px;margin:12px auto 0;display:flex;align-items:center;gap:8px;padding:0 4px}.filter-bar select,.filter-bar button,.section-actions input,.section-actions select,.section-actions button,.sort-buttons button{height:32px;border:1px solid #cfd8e6;background:#fff;border-radius:7px;padding:0 11px;font-size:11px;color:#26364f}.filter-bar .dark-btn{background:var(--navy);color:#fff;border-color:var(--navy)}.filter-bar .spacer{flex:1}.filter-bar small{color:#8792a5;font-size:10px}.main-grid{max-width:1180px;margin:8px auto;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}.card{background:#fff;border:1px solid #dce4ef;border-radius:8px;box-shadow:0 2px 8px rgba(16,38,70,.05);padding:11px;min-width:0}.main-grid>.card:nth-child(-n+3){grid-column:span 2}.card h2{font-size:13px;margin:0 0 9px;color:#122443}.section-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.section-head h2{margin:0}.section-actions{display:flex;gap:6px;align-items:center}.section-actions input{width:150px}.section-actions .primary,.primary{background:#2f73e6;color:#fff;border-color:#2f73e6}.small-badge{font-size:10px;background:#edf3ff;color:#2f73e6;border-radius:999px;padding:4px 7px}.sort-buttons{display:flex;gap:5px;margin:5px 0 8px}.sort-buttons button{height:27px;font-size:10px;padding:0 8px}.sort-buttons button.active{background:#eff5ff;color:#145dcc;border-color:#8db5f4;font-weight:700}.category-card{grid-column:span 2}.category-card .table-wrap{transition:max-height .35s ease,opacity .25s ease;overflow:hidden}.table-wrap.collapsed{max-height:230px}.table-wrap.expanded{max-height:1800px}.table-wrap table,.public-card table,.all-data table{width:100%;border-collapse:collapse;font-size:10px}.table-wrap th,.table-wrap td,.public-card th,.public-card td,.all-data th,.all-data td{border-bottom:1px solid #edf1f6;padding:7px 5px;text-align:left;white-space:nowrap}.table-wrap th,.public-card th,.all-data th{font-weight:700;color:#60708a;background:#fbfcfe}.table-wrap tr{cursor:pointer}.table-wrap tr:hover,.all-data tr:hover{background:#f5f8ff}.company-link{font-weight:700;color:#1c3154}.positive{color:#ef4444;font-weight:700}.negative{color:#2f73e6;font-weight:700}.section-foot,.pagination{display:flex;justify-content:space-between;align-items:center;margin-top:8px;color:#8994a7;font-size:9px}.section-foot button{border:0;background:transparent;color:#2f73e6;font-size:10px;cursor:pointer}.public-card{grid-column:span 6}.hint{font-size:10px;color:#7c8799;margin:0 0 8px}.all-data{grid-column:span 4}.all-data .all-table{transition:max-height .35s ease}.all-table.collapsed{max-height:340px;overflow:hidden}.all-table.expanded{max-height:2400px;overflow:auto}.compare-card{grid-column:span 2}.drop-zone{min-height:102px;border:1px dashed #8ab2f7;background:#f8fbff;border-radius:8px;padding:16px;text-align:center;color:#687895;font-size:10px}.drop-zone strong{display:block;color:#38507b;margin-bottom:10px}.chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px}.chip{border:1px solid #b7ccf5;background:#eef4ff;color:#215fc7;border-radius:999px;padding:5px 9px;font-size:10px;cursor:pointer}.compare-tabs{display:flex;gap:6px;margin:10px 0}.compare-tabs button{border:1px solid #d6dfed;background:#fff;border-radius:6px;padding:6px 10px;font-size:10px}.compare-tabs .active{background:#122b54;color:#fff}.legend{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;font-size:9px;color:#59677c}.legend span{display:flex;align-items:center;gap:4px}.legend i{width:7px;height:7px;border-radius:50%;display:inline-block}.detail-drawer{position:fixed;z-index:1200;right:0;top:54px;width:385px;height:calc(100vh - 54px);background:#fff;border-left:1px solid #d8e0ec;box-shadow:-8px 0 25px rgba(14,34,65,.12);overflow:auto}.drawer-head{display:flex;justify-content:space-between;padding:17px 18px 12px;border-bottom:1px solid #e8edf4}.drawer-head h2{margin:3px 0 0;font-size:18px}.eyebrow{font-size:10px;color:#2f73e6;font-weight:700}.close{border:0;background:#f3f6fa;width:30px;height:30px;border-radius:50%;font-size:20px;color:#56647a}.drawer-tabs{display:flex;padding:9px 14px;border-bottom:1px solid #edf1f6;gap:5px}.drawer-tabs button{flex:1;border:1px solid #d8e1ee;background:#fff;border-radius:6px;padding:7px 4px;font-size:10px}.drawer-tabs button.active{background:#eef4ff;color:#1e60c9;border-color:#b9cef3}.drawer-body{padding:14px 18px 30px}.drawer-body h3{font-size:12px;color:#145dcc;margin:14px 0 8px}.drawer-body h3 small{font-size:9px;color:#8a95a6;font-weight:400}.field{display:grid;grid-template-columns:110px 1fr;gap:7px;align-items:center;margin:7px 0}.field span{font-size:10px;color:#6b7890}.field input,.memo{width:100%;border:1px solid #d5deeb;border-radius:6px;background:#fff;padding:8px 9px;font-size:10px;color:#26364f}.field input:focus,.memo:focus{outline:2px solid #c6dbff;border-color:#6da0ee}.memo{min-height:150px;resize:vertical}.save-btn{margin-top:8px;border:0;background:#2f73e6;color:#fff;border-radius:7px;padding:8px 14px;font-size:10px}.research-note{margin-top:12px;background:#f7f9fc;border:1px solid #e3e8f0;border-radius:6px;padding:9px;color:#7a8698;font-size:9px;line-height:1.5}
@media(max-width:1000px){.main-grid{grid-template-columns:repeat(2,minmax(0,1fr));padding:0 10px}.main-grid>.card:nth-child(-n+3),.category-card,.public-card,.all-data,.compare-card{grid-column:span 1}.public-card,.all-data,.compare-card{grid-column:span 2}.filter-bar{padding:0 10px;flex-wrap:wrap}.title-actions{display:none}.detail-drawer{width:min(385px,92vw)}}
@media(max-width:650px){.main-grid{grid-template-columns:1fr}.main-grid>.card:nth-child(-n+3),.category-card,.public-card,.all-data,.compare-card{grid-column:span 1}.dashboard-title{padding:12px 14px}.dashboard-title h1{font-size:18px}.filter-bar{overflow:auto;flex-wrap:nowrap}.section-actions{flex-wrap:wrap}.section-actions input{width:125px}.all-data{overflow:hidden}}
`}</style>
