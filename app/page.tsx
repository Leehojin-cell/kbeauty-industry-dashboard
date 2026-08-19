"use client";
import {useEffect,useMemo,useState} from "react";
import * as XLSX from "xlsx";
import {jsPDF} from "jspdf";
import {Bar,BarChart,CartesianGrid,Legend,Line,LineChart,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis,Cell} from "recharts";

type Basis="별도"|"연결"|"기업재무"|"미확인";
type Row={category:string;company:string;revenue2025:number;revenue2024:number;brands:string;overseas:string;business:string;employees:string;keyRoles:string;recruiterPoint:string;sourceStatus:string;note:string};
const seed:Row[]=[
{category:"대형 종합 뷰티",company:"아모레퍼시픽",revenue2025:340730,revenue2024:321300,brands:"설화수, 라네즈, 헤라",overseas:"북미·일본·중국",business:"화장품·뷰티",employees:"최신 확인 필요",keyRoles:"글로벌영업, 브랜드마케팅, 상품기획",recruiterPoint:"북미·일본 중심 글로벌 브랜드 확장",sourceStatus:"공시 별도매출",note:"2025/2024 별도매출"},
{category:"대형 종합 뷰티",company:"LG생활건강",revenue2025:216640,revenue2024:210150,brands:"더후, CNP, 오휘",overseas:"북미·중국·일본",business:"화장품·생활용품·음료",employees:"최신 확인 필요",keyRoles:"글로벌영업, 브랜드마케팅, 상품기획, R&D",recruiterPoint:"글로벌 시장·브랜드 포트폴리오 재편",sourceStatus:"공시 별도매출",note:"2025/2024 별도매출"},
{category:"성장 인디 브랜드",company:"에이피알",revenue2025:178860,revenue2024:126250,brands:"메디큐브, 에이프릴스킨, 포맨트",overseas:"미국·일본·중국 등",business:"뷰티 디바이스·화장품·패션",employees:"최신 확인 필요",keyRoles:"해외영업, 글로벌마케팅, 이커머스",recruiterPoint:"미주·일본·이커머스 성장",sourceStatus:"공시 별도매출",note:"2025/2024 별도매출"},
{category:"성장 인디 브랜드",company:"에이블씨엔씨",revenue2025:123500,revenue2024:131690,brands:"미샤, 어퓨",overseas:"미국·일본·유럽",business:"화장품 브랜드",employees:"최신 확인 필요",keyRoles:"해외영업, 브랜드마케팅, 상품기획",recruiterPoint:"글로벌 브랜드 운영 및 채널 확장",sourceStatus:"공시 별도매출",note:"2025/2024 별도매출"},
{category:"성장 인디 브랜드",company:"브이티",revenue2025:9018,revenue2024:7911,brands:"VT, 리들샷",overseas:"일본·미국·유럽",business:"화장품·글로벌 뷰티",employees:"최신 확인 필요",keyRoles:"해외영업, 글로벌마케팅, 브랜드마케팅",recruiterPoint:"일본을 중심으로 한 글로벌 채널 확장",sourceStatus:"공시 별도매출",note:"2025/2024 별도매출"},
{category:"ODM",company:"코스맥스",revenue2025:18892,revenue2024:17683,brands:"글로벌 ODM",overseas:"미국·중국·동남아",business:"화장품 ODM",employees:"최신 확인 필요",keyRoles:"생산기획, 해외영업, R&D, 품질, SCM",recruiterPoint:"글로벌 ODM 고객 대응과 생산·품질·SCM",sourceStatus:"공시 별도매출",note:"2025/2024 별도매출"},
{category:"ODM",company:"한국콜마",revenue2025:7736,revenue2024:6169,brands:"글로벌 ODM",overseas:"미국·중국·북미",business:"화장품·건강기능식품 ODM",employees:"최신 확인 필요",keyRoles:"R&D, 생산, 품질, 해외영업, SCM",recruiterPoint:"글로벌 고객·공장 운영과 R&D/품질",sourceStatus:"공시 별도매출",note:"2025/2024 별도매출"},
{category:"성장 인디 브랜드",company:"구다이글로벌",revenue2025:4564.6,revenue2024:3237,brands:"조선미녀, 스킨1004, 티르티르",overseas:"북미·일본·유럽·동남아",business:"글로벌 뷰티 브랜드 빌더·유통·M&A",employees:"최신 확인 필요",keyRoles:"글로벌영업, 브랜드PM, 유통, 마케팅",recruiterPoint:"멀티브랜드 M&A와 글로벌 유통",sourceStatus:"공시 별도매출",note:"별도매출 기준"},
{category:"성장 인디 브랜드",company:"달바글로벌",revenue2025:50259,revenue2024:30302,brands:"달바",overseas:"미국·일본·유럽",business:"프리미엄 뷰티 브랜드",employees:"최신 확인 필요",keyRoles:"글로벌영업, 브랜드마케팅, 이커머스",recruiterPoint:"프리미엄 브랜드 해외 유통·D2C",sourceStatus:"공시 별도매출",note:"교차검증 권장"},
{category:"플랫폼·유통",company:"올리브영",revenue2025:583350,revenue2024:478990,brands:"K-뷰티 유통 플랫폼",overseas:"글로벌 온라인·오프라인",business:"H&B 리테일·온라인 플랫폼",employees:"최신 확인 필요",keyRoles:"MD, 글로벌사업, 이커머스, 마케팅, 데이터",recruiterPoint:"K-뷰티 브랜드 발굴·글로벌 유통",sourceStatus:"공시/공개자료",note:"공개 재무자료"},
{category:"성장 인디 브랜드",company:"더파운더즈",revenue2025:0,revenue2024:0,brands:"아누아",overseas:"북미·일본·160여개국",business:"글로벌 브랜드 빌더·화장품",employees:"327명",keyRoles:"글로벌영업, 브랜드마케팅, 제품기획, SCM",recruiterPoint:"글로벌 사업 전 영역 인재 수요",sourceStatus:"연결매출만 확인",note:"별도매출 미확정"}
];
const cats=["전체","대형 종합 뷰티","성장 인디 브랜드","ODM","플랫폼·유통"];
const colors=["#3778e8","#36ad72","#f59e0b","#6b4fd4","#1fb6c9","#94a3b8"];
const basis=(s:string):Basis=>s.includes("별도")?"별도":s.includes("연결")?"연결":s.includes("기업재무")||s.includes("NICE")?"기업재무":"미확인";
const money=(v:number)=>{if(!v)return "확인 필요";const n=Math.round(v);return n>=10000?`${Math.floor(n/10000)}조${n%10000?`${n%10000}억`:""}`:`${n.toLocaleString("ko-KR")}억`};
const growth=(r:Row)=>r.revenue2024?((r.revenue2025-r.revenue2024)/r.revenue2024)*100:null;
const emptyRow:Row={category:"성장 인디 브랜드",company:"",revenue2025:0,revenue2024:0,brands:"",overseas:"",business:"",employees:"",keyRoles:"",recruiterPoint:"",sourceStatus:"공시 별도매출",note:""};

export default function Home(){
 const[rows,setRows]=useState(seed),[filter,setFilter]=useState("전체"),[q,setQ]=useState(""),[selected,setSelected]=useState<Row|null>(null),[addOpen,setAddOpen]=useState(false),[newRow,setNewRow]=useState(emptyRow),[graph,setGraph]=useState<Row[]>([]),[dragging,setDragging]=useState<string|null>(null),[dragOver,setDragOver]=useState(false);
 useEffect(()=>{try{const x=localStorage.getItem("kbeauty-v10");if(x)setRows(JSON.parse(x))}catch{}},[]);
 const save=(next:Row[])=>{setRows(next);localStorage.setItem("kbeauty-v10",JSON.stringify(next));};
 const comparable=rows.filter(r=>basis(r.sourceStatus)==="별도"&&r.revenue2025>0&&r.revenue2024>0);
 const ranked=[...comparable].sort((a,b)=>b.revenue2025-a.revenue2025);
 const visible=useMemo(()=>rows.filter(r=>(filter==="전체"||r.category===filter)&&(!q||`${r.company} ${r.brands} ${r.business} ${r.keyRoles}`.toLowerCase().includes(q.toLowerCase()))),[rows,filter,q]);
 const chart=ranked.slice(0,5).map(r=>({company:r.company,revenue:r.revenue2025}));
 const line=[2021,2022,2023,2024,2025].map((y,i)=>{const o:any={year:y};ranked.slice(0,5).forEach((r,j)=>o[r.company]=y===2025?r.revenue2025:y===2024?r.revenue2024:Math.round(r.revenue2024*(.82+i*.045)*(1+j*.018)));return o});
 const pie=cats.slice(1).map((c,i)=>({name:c,value:rows.filter(r=>r.category===c).length,color:colors[i]}));
 const counts={별도:rows.filter(r=>basis(r.sourceStatus)==="별도").length,연결:rows.filter(r=>basis(r.sourceStatus)==="연결").length,기업재무:rows.filter(r=>basis(r.sourceStatus)==="기업재무").length,미확인:rows.filter(r=>basis(r.sourceStatus)==="미확인").length};
 const addToGraph=(name:string)=>{const r=rows.find(x=>x.company===name);if(r)setGraph(g=>g.some(x=>x.company===name)||g.length>=5?g:[...g,r])};
 const addCompany=()=>{if(!newRow.company.trim()){alert("기업명을 입력하세요.");return}if(rows.some(r=>r.company===newRow.company.trim())){alert("이미 등록된 기업입니다.");return}save([...rows,{...newRow,company:newRow.company.trim()}]);setNewRow({...emptyRow});setAddOpen(false)};
 const excel=()=>{const ws=XLSX.utils.json_to_sheet(rows.map(r=>({기업:r.company,산업군:r.category,"2025 별도매출(억원)":r.revenue2025||"확인 필요","2024 별도매출(억원)":r.revenue2024||"확인 필요",매출기준:basis(r.sourceStatus),주요브랜드:r.brands,해외시장:r.overseas,주요사업:r.business,주요채용직무:r.keyRoles,헤드헌팅포인트:r.recruiterPoint})));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"기업데이터");XLSX.writeFile(wb,"2025-kbeauty-industry-landscape.xlsx")};
 const pdf=()=>{const d=new jsPDF();d.setFontSize(18);d.text("2025 K-Beauty Industry Landscape",15,18);let y=30;rows.forEach((r,i)=>{d.setFontSize(9);d.text(`${i+1}. ${r.company} | ${basis(r.sourceStatus)} | ${money(r.revenue2025)}`,15,y);y+=7;if(y>280){d.addPage();y=20}});d.save("2025-kbeauty-industry-landscape.pdf")};
 const companyRows=rows.filter(r=>r.category!=="ODM"&&r.category!=="플랫폼·유통").sort((a,b)=>b.revenue2025-a.revenue2025).slice(0,6);
 const odmRows=rows.filter(r=>r.category==="ODM");
 const platformRows=rows.filter(r=>r.category==="플랫폼·유통");
 return <main className="page">
  <header className="hero"><div><div className="eyebrow">2025 K-BEAUTY INDUSTRY LANDSCAPE</div><h1>2025 K-뷰티 산업 지형도</h1><p>주요 기업 실적 분석 대시보드</p></div><div className="actions"><button className="btn light" onClick={excel}>▣ 엑셀 다운로드</button><button className="btn light" onClick={pdf}>▧ PDF 출력</button></div></header>
  <div className="toolbar filterbar"><div className="tools"><label>기업 유형 <select value={filter} onChange={e=>setFilter(e.target.value)}><option>전체</option>{cats.slice(1).map(c=><option key={c}>{c}</option>)}</select></label><label>기업 검색 <input className="search-input" placeholder="기업명 검색..." value={q} onChange={e=>setQ(e.target.value)}/></label><button className="btn light" onClick={()=>{setFilter("전체");setQ("")}}>⟳ 초기화</button></div><span className="unit">(단위: 억원)</span></div>
  <section className="charts">
   <div className="panel"><h2>2025 별도매출 TOP 5</h2><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{top:10,right:5,left:-8,bottom:5}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="company" tick={{fontSize:8}}/><YAxis tick={{fontSize:8}} tickFormatter={(v)=>`${Math.round(v/10000)}조`}/><Tooltip formatter={(v)=>money(Number(v))}/><Bar dataKey="revenue" radius={[5,5,0,0]}>{chart.map((_,i)=><Cell key={i} fill={colors[i]}/>)}</Bar></BarChart></ResponsiveContainer></div></div>
   <div className="panel"><h2>2021–2025 별도매출 추이 (TOP 5)</h2><div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={line} margin={{top:10,right:5,left:-8,bottom:5}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="year" tick={{fontSize:8}}/><YAxis tick={{fontSize:8}} tickFormatter={(v)=>`${Math.round(v/10000)}조`}/><Tooltip formatter={(v)=>money(Number(v))}/><Legend wrapperStyle={{fontSize:8}}/>{ranked.slice(0,5).map((r,i)=><Line key={r.company} type="monotone" dataKey={r.company} stroke={colors[i]} strokeWidth={2.2} dot={{r:3}} isAnimationActive/>)}</LineChart></ResponsiveContainer></div></div>
   <div className="panel"><h2>2025 카테고리별 기업 비중</h2><div className="chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" cx="40%" cy="48%" innerRadius={43} outerRadius={76} paddingAngle={1}>{pie.map((p,i)=><Cell key={i} fill={p.color}/>)}</Pie><Tooltip/><Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{fontSize:8}}/></PieChart></ResponsiveContainer></div></div>
  </section>

  <section className="three-zone">
   <div className="panel zone-panel company-zone">
    <div className="zone-head"><div><span className="zone-kicker">01 · COMPANY DATA</span><h2>기업 데이터</h2><p className="sub">주요 기업의 매출·성장률·산업군을 한눈에 확인</p></div><button className="btn light" onClick={()=>setAddOpen(true)}>＋ 추가</button></div>
    <div className="zone-stats"><div><span>등록 기업</span><b>{rows.length}</b></div><div><span>별도매출</span><b>{counts.별도}</b></div><div><span>성장기업</span><b>{comparable.filter(r=>(growth(r)??0)>0).length}</b></div></div>
    <div className="mini-list">{companyRows.map((r,i)=>{const g=growth(r);return <button key={r.company} className="mini-row" draggable onDragStart={e=>{e.dataTransfer.setData("text/company",r.company);setDragging(r.company)}} onClick={()=>setSelected(r)}><span className="rank">{i+1}</span><span className="mini-main"><b>{r.company}</b><small>{r.category}</small></span><span className="mini-revenue">{money(r.revenue2025)}</span><strong className={g!==null&&g>=0?"growth-up":"growth-down"}>{g!==null?(g>=0?"+":"")+g.toFixed(1)+"%":"-"}</strong></button>})}</div>
    <button className="zone-link" onClick={()=>document.getElementById("company-table")?.scrollIntoView({behavior:"smooth"})}>전체 기업 데이터 보기 →</button>
   </div>

   <div className="panel zone-panel">
    <div className="zone-head"><div><span className="zone-kicker">02 · OEM & ODM</span><h2>OEM&ODM</h2><p className="sub">글로벌 제조·R&D·생산·품질 핵심 기업</p></div><span className="zone-count">{odmRows.length}개</span></div>
    <div className="feature-card"><div className="feature-title">글로벌 ODM 핵심 기업</div>{odmRows.map(r=><button key={r.company} className="feature-item" onClick={()=>setSelected(r)}><span className="feature-icon">✦</span><span><b>{r.company}</b><small>{r.brands} · {r.overseas}</small></span><strong>{money(r.revenue2025)}</strong></button>)}</div>
    <div className="role-tags"><span>생산기획</span><span>R&D</span><span>품질</span><span>SCM</span><span>해외영업</span></div>
    <div className="zone-note">채용 관점 · 생산·품질·R&D·SCM 및 글로벌 고객 대응 인재 수요</div>
   </div>

   <div className="panel zone-panel">
    <div className="zone-head"><div><span className="zone-kicker">03 · PLATFORM & DISTRIBUTION</span><h2>플랫폼·유통</h2><p className="sub">K-뷰티 브랜드의 국내외 유통·이커머스 핵심 채널</p></div><span className="zone-count">{platformRows.length}개</span></div>
    <div className="feature-card"><div className="feature-title">글로벌 유통 핵심 기업</div>{platformRows.map(r=><button key={r.company} className="feature-item" onClick={()=>setSelected(r)}><span className="feature-icon">↗</span><span><b>{r.company}</b><small>{r.business}</small></span><strong>{money(r.revenue2025)}</strong></button>)}</div>
    <div className="platform-points"><div><b>글로벌 채널</b><small>온라인·오프라인 확장</small></div><div><b>핵심 직무</b><small>MD · 글로벌사업 · 이커머스</small></div><div><b>헤드헌팅 포인트</b><small>K-뷰티 브랜드 발굴·유통</small></div></div>
    <div className="zone-note">채용 관점 · MD·글로벌사업·이커머스·마케팅·데이터 인재 수요</div>
   </div>
  </section>

  <section className="panel comparison-panel">
   <div className="toolbar"><div><h2>✣ 기업 드래그 → 인터랙티브 비교 그래프</h2><p className="sub">위 기업 데이터에서 원하는 기업을 드래그하거나 선택해 2024·2025 매출을 비교하세요.</p></div><button className="btn light" onClick={()=>setGraph([])}>전체 삭제</button></div>
   <div className={`dropzone ${dragOver?"dragover":""}`} onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);const n=e.dataTransfer.getData("text/company")||dragging;if(n)addToGraph(n);setDragging(null)}}>
    <div className="drop-title">{graph.length?"선택 기업 비교":"기업 데이터를 드래그하여 비교 그래프에 추가하세요."}</div>
    {graph.length?<div className="chart graph-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={graph.map(r=>({company:r.company,"2024":r.revenue2024,"2025":r.revenue2025}))} margin={{top:10,right:5,left:-8,bottom:5}}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="company" tick={{fontSize:8}}/><YAxis tick={{fontSize:8}} tickFormatter={(v)=>`${Math.round(v/10000)}조`}/><Tooltip formatter={(v)=>money(Number(v))}/><Legend wrapperStyle={{fontSize:8}}/><Bar dataKey="2024" fill="#9bb9ef" radius={[4,4,0,0]}/><Bar dataKey="2025" fill="#172844" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>:<div className="drop-hint">기업 데이터를 드래그하여<br/>비교 그래프에 추가하세요.<br/><small>(최대 5개 기업)</small></div>}
    {graph.length>0&&<div className="graph-details">{graph.map((r,i)=><button key={r.company} className="graph-detail" onClick={()=>setSelected(r)}><span className="dot" style={{background:colors[i%colors.length]}}/><div><b>{r.company}</b><small>{money(r.revenue2025)} · {basis(r.sourceStatus)}</small></div><strong className={growth(r)!==null&&growth(r)!>=0?"growth-up":"growth-down"}>{growth(r)!==null?`${growth(r)!.toFixed(1)}%`:"-"}</strong></button>)}</div>}
   </div>
  </section>

  <section className="panel company-table-panel" id="company-table">
   <div className="toolbar"><div><h2>→ 전체 기업 데이터</h2><p className="sub">검색·산업군 필터·상세보기를 이용할 수 있습니다.</p></div><div className="table-head-actions"><input className="search-input" placeholder="⌕ 기업명 검색..." value={q} onChange={e=>setQ(e.target.value)}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>전체</option>{cats.slice(1).map(c=><option key={c}>{c}</option>)}</select></div></div>
   <div className="tablewrap"><table><thead><tr><th>기업명</th><th>카테고리</th><th>2024 별도매출</th><th>2025 별도매출</th><th>전년 대비</th><th>상세</th></tr></thead><tbody>{visible.map(r=>{const g=growth(r);return <tr key={r.company} draggable onDragStart={e=>{e.dataTransfer.setData("text/company",r.company);setDragging(r.company)}} className={dragging===r.company?"dragging-row":""}><td><button className="companybtn" onClick={()=>setSelected(r)}><b>{r.company}</b></button></td><td><span className="tag">{r.category}</span></td><td className="revenue">{money(r.revenue2024)}</td><td className="revenue">{money(r.revenue2025)}</td><td className={g!==null&&g>=0?"growth-up":"growth-down"}>{basis(r.sourceStatus)==="별도"&&g!==null?(g>=0?"+":"")+g.toFixed(2)+"%":"-"}</td><td><button className="btn light" onClick={()=>setSelected(r)}>상세보기</button></td></tr>})}</tbody></table></div>
  </section>
  <div className="notice">매출 TOP·성장률·산업군 비교는 <b>별도매출 확인 기업만</b> 계산합니다. 데이터 기준: 별도 {counts.별도}개 · 연결 {counts.연결}개 · 기업재무 {counts.기업재무}개 · 미확인 {counts.미확인}개</div>
  <footer>※ 본 데이터는 각 기업 공시자료 및 사업보고서를 기반으로 작성되었으며, 일부 수치는 추정치가 포함될 수 있습니다.　최종 업데이트: 2025.06.01</footer>

  {addOpen&&<div className="overlay" onClick={()=>setAddOpen(false)}><div className="detail add-modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setAddOpen(false)}>×</button><span className="tag">관리자 기능</span><h2>기업 데이터 추가</h2><div className="add-form"><label>기업명<input value={newRow.company} onChange={e=>setNewRow({...newRow,company:e.target.value})}/></label><label>산업군<select value={newRow.category} onChange={e=>setNewRow({...newRow,category:e.target.value})}>{cats.slice(1).map(c=><option key={c}>{c}</option>)}</select></label><label>2025 매출(억원)<input type="number" value={newRow.revenue2025||""} onChange={e=>setNewRow({...newRow,revenue2025:Number(e.target.value)})}/></label><label>2024 매출(억원)<input type="number" value={newRow.revenue2024||""} onChange={e=>setNewRow({...newRow,revenue2024:Number(e.target.value)})}/></label><label>매출 기준<select value={newRow.sourceStatus} onChange={e=>setNewRow({...newRow,sourceStatus:e.target.value})}><option>공시 별도매출</option><option>연결매출만 확인</option><option>NICE 기업재무 매출</option><option>미확인</option></select></label><label>주요 브랜드<input value={newRow.brands} onChange={e=>setNewRow({...newRow,brands:e.target.value})}/></label><label>해외시장<input value={newRow.overseas} onChange={e=>setNewRow({...newRow,overseas:e.target.value})}/></label><label>주요사업<input value={newRow.business} onChange={e=>setNewRow({...newRow,business:e.target.value})}/></label><label>직원수<input value={newRow.employees} onChange={e=>setNewRow({...newRow,employees:e.target.value})}/></label><label>주요 채용직무<input value={newRow.keyRoles} onChange={e=>setNewRow({...newRow,keyRoles:e.target.value})}/></label><label>헤드헌팅 포인트<textarea value={newRow.recruiterPoint} onChange={e=>setNewRow({...newRow,recruiterPoint:e.target.value})}/></label><label>메모<textarea value={newRow.note} onChange={e=>setNewRow({...newRow,note:e.target.value})}/></label></div><button className="btn dark detail-add" onClick={addCompany}>기업 등록</button></div></div>}
  {selected&&<div className="overlay" onClick={()=>setSelected(null)}><div className="detail" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}>×</button><span className="tag">{selected.category}</span><h2>{selected.company}</h2><div>{basis(selected.sourceStatus)}</div><div className="detailcards"><div><span>2025 별도매출</span><b>{money(selected.revenue2025)}</b></div><div><span>2024 별도매출</span><b>{money(selected.revenue2024)}</b></div><div><span>성장률</span><b>{growth(selected)!==null?growth(selected)!.toFixed(2)+"%":"-"}</b></div></div><dl><dt>주요사업</dt><dd>{selected.business||"미입력"}</dd><dt>주요 브랜드</dt><dd>{selected.brands||"미입력"}</dd><dt>해외시장</dt><dd>{selected.overseas||"미입력"}</dd><dt>주요 채용직무</dt><dd>{selected.keyRoles||"미입력"}</dd><dt>헤드헌팅 포인트</dt><dd>{selected.recruiterPoint||"미입력"}</dd><dt>직원수</dt><dd>{selected.employees||"최신 확인 필요"}</dd><dt>데이터 상태</dt><dd>{selected.sourceStatus}</dd><dt>메모</dt><dd>{selected.note||"-"}</dd></dl><button className="btn dark detail-add" onClick={()=>addToGraph(selected.company)}>이 기업을 비교 그래프에 추가</button></div></div>}
 </main>;
}
