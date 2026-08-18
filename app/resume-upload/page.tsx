"use client";

import { useMemo, useState } from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

type Company={name:string;category:string;roles:string[];markets:string[];keywords:string[];industry:string[];point:string};
type Result={c:Company;score:number;matched:string[];missing:string[];role:string;market:string;breakdown:{industry:number;role:number;market:number;keyword:number;recency:number}};

const companies:Company[]=[
{name:"브이티",category:"브랜드",roles:["해외영업","글로벌마케팅","브랜드마케팅","상품기획"],markets:["미국","유럽","일본"],keywords:["화장품","해외영업","수출","distributor","미국","유럽","일본","글로벌"],industry:["화장품","뷰티","브랜드","글로벌"],point:"미주·유럽 해외영업과 글로벌 채널 확대 경험을 우선 검토"},
{name:"에이피알",category:"브랜드·D2C",roles:["해외영업","글로벌마케팅","이커머스","상품기획"],markets:["미국","일본","중국"],keywords:["화장품","뷰티","해외영업","미국","일본","이커머스","D2C","글로벌"],industry:["화장품","뷰티","이커머스","D2C"],point:"글로벌 D2C·이커머스와 미주·일본 경험을 우선 검토"},
{name:"달바글로벌",category:"브랜드",roles:["글로벌영업","브랜드마케팅","이커머스","MD"],markets:["미국","유럽","일본"],keywords:["화장품","프리미엄","해외영업","미국","유럽","일본","이커머스","MD"],industry:["화장품","뷰티","프리미엄","이커머스"],point:"프리미엄 뷰티 해외 유통·이커머스 경험을 우선 검토"},
{name:"구다이글로벌",category:"멀티브랜드·유통",roles:["글로벌영업","브랜드PM","유통","마케팅"],markets:["북미","일본","유럽","동남아"],keywords:["화장품","글로벌","브랜드","유통","M&A","미국","일본","마케팅"],industry:["화장품","뷰티","브랜드","유통"],point:"멀티브랜드·글로벌 유통과 시장 확장 경험을 우선 검토"},
{name:"더파운더즈",category:"브랜드",roles:["해외영업","글로벌마케팅","브랜드마케팅","MD"],markets:["미국","일본","동남아","유럽"],keywords:["화장품","뷰티","해외영업","글로벌","브랜드","미국","일본","마케팅","MD"],industry:["화장품","뷰티","브랜드"],point:"브랜드 성장과 해외 채널 확장 경험을 우선 검토"},
{name:"비나우",category:"브랜드",roles:["해외영업","글로벌마케팅","브랜드마케팅","상품기획"],markets:["미국","일본","유럽"],keywords:["화장품","뷰티","해외영업","글로벌","브랜드","미국","일본","유럽"],industry:["화장품","뷰티","브랜드"],point:"브랜드 기반 글로벌 영업·마케팅 경험을 우선 검토"},
{name:"토리든",category:"브랜드",roles:["해외영업","글로벌마케팅","MD","상품기획"],markets:["미국","일본","유럽","동남아"],keywords:["화장품","스킨케어","해외영업","글로벌","미국","일본","유럽","MD"],industry:["화장품","뷰티","스킨케어"],point:"스킨케어 해외영업과 글로벌 채널 경험을 우선 검토"},
{name:"아모레퍼시픽",category:"종합 뷰티",roles:["해외영업","글로벌마케팅","브랜드마케팅","상품기획","SCM"],markets:["북미","미국","일본","중국","유럽"],keywords:["화장품","뷰티","해외영업","글로벌","브랜드","마케팅","SCM","미국","일본","중국"],industry:["화장품","뷰티","브랜드","글로벌"],point:"대형 뷰티기업의 글로벌 브랜드·시장 운영 경험을 우선 검토"},
{name:"LG생활건강",category:"종합 뷰티",roles:["해외영업","글로벌마케팅","브랜드마케팅","상품기획","SCM"],markets:["북미","미국","중국","일본","아시아"],keywords:["화장품","뷰티","해외영업","글로벌","브랜드","마케팅","SCM","미국","중국","일본"],industry:["화장품","뷰티","브랜드","글로벌"],point:"글로벌 브랜드 운영과 대형 조직 경험을 우선 검토"},
{name:"코스맥스",category:"ODM·제조",roles:["해외영업","생산기획","R&D","품질","SCM"],markets:["미국","중국","동남아","유럽"],keywords:["ODM","OEM","화장품","해외영업","SCM","생산","품질","R&D","미국","중국"],industry:["화장품","ODM","OEM","제조"],point:"화장품 OEM/ODM·글로벌 고객 대응 경험을 우선 검토"},
{name:"한국콜마",category:"ODM·제조",roles:["해외영업","R&D","생산","품질","SCM"],markets:["미국","중국","북미","유럽"],keywords:["ODM","OEM","화장품","해외영업","SCM","생산","품질","R&D","미국","중국"],industry:["화장품","ODM","OEM","제조"],point:"화장품 ODM·R&D·품질·글로벌 고객 경험을 우선 검토"},
{name:"코스메카코리아",category:"ODM·제조",roles:["해외영업","생산","품질","R&D","SCM"],markets:["미국","중국","유럽","동남아"],keywords:["ODM","OEM","화장품","해외영업","생산","품질","R&D","SCM","미국","유럽"],industry:["화장품","ODM","OEM","제조"],point:"ODM 제조와 해외 고객·생산 대응 경험을 우선 검토"},
{name:"씨앤씨인터내셔널",category:"ODM·색조",roles:["해외영업","생산","R&D","품질","상품기획"],markets:["미국","유럽","일본","아시아"],keywords:["ODM","화장품","색조","해외영업","생산","R&D","품질","미국","유럽","일본"],industry:["화장품","ODM","색조","제조"],point:"색조 ODM과 글로벌 고객 대응 경험을 우선 검토"},
{name:"실리콘투",category:"K-뷰티 유통",roles:["해외영업","글로벌영업","유통","MD","이커머스"],markets:["미국","유럽","아시아","중동"],keywords:["화장품","K-뷰티","해외영업","글로벌","유통","이커머스","미국","유럽","중동","MD"],industry:["화장품","K-뷰티","유통","이커머스"],point:"K-뷰티 글로벌 유통·수출·이커머스 경험을 우선 검토"},
{name:"CJ올리브영",category:"리테일·플랫폼",roles:["글로벌사업","해외영업","MD","이커머스","상품기획"],markets:["미국","일본","유럽","동남아"],keywords:["화장품","K-뷰티","글로벌","유통","이커머스","MD","상품기획","미국","일본"],industry:["화장품","K-뷰티","유통","이커머스"],point:"K-뷰티 리테일·플랫폼과 글로벌 사업 경험을 우선 검토"}
];

const sample=`[샘플 후보자]\n의료기기 해외영업 3년. 유럽·CIS·아시아·중동 15개국 담당, 바이어/디스트리뷰터 약 30개사 관리. LinkedIn으로 동남아 신규 디스트리뷰터 발굴. 최근 화장품 OEM/ODM 해외영업 경험. 미국 교육 및 체류 경험. 견적·수주·납기·샘플·규제·선적·통관 업무 수행.`;

const norm=(s:string)=>s.toLowerCase().replace(/[\s·,&/()\-]/g,"");
const has=(text:string,k:string)=>norm(text).includes(norm(k));
const unique=(a:string[])=>[...new Set(a)];

function analyze(text:string,c:Company):Result{
 const keywordHits=c.keywords.filter(k=>has(text,k));
 const industryHits=c.industry.filter(k=>has(text,k));
 const roleHits=c.roles.filter(k=>has(text,k));
 const marketHits=c.markets.filter(k=>has(text,k));
 const keyword=Math.min(30,Math.round(keywordHits.length/c.keywords.length*30));
 const industry=Math.min(25,industryHits.length*8);
 const role=Math.min(25,roleHits.length?9+roleHits.length*6:0);
 const market=Math.min(15,marketHits.length?6+marketHits.length*3:0);
 const recency=has(text,"최근")&&industryHits.length?5:0;
 const score=Math.max(15,Math.min(97,Math.round(keyword+industry+role+market+recency)));
 const matched=unique([...industryHits,...roleHits,...marketHits,...keywordHits]).slice(0,8);
 const missing=unique([...c.industry,...c.roles,...c.markets]).filter(k=>!has(text,k)).slice(0,6);
 return {c,score,matched,missing,role:roleHits[0]||c.roles[0],market:marketHits[0]||c.markets[0],breakdown:{industry,role,market,keyword,recency}};
}

async function extractDocx(file:File){
 const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
 return result.value.trim();
}

async function extractPdf(file:File){
 const data=new Uint8Array(await file.arrayBuffer());
 const pdf=await pdfjsLib.getDocument({data,disableWorker:true}).promise;
 const pages:string[]=[];
 for(let i=1;i<=pdf.numPages;i++){
  const page=await pdf.getPage(i);
  const content=await page.getTextContent();
  pages.push(content.items.map((item:any)=>"str" in item?item.str:"").join(" "));
 }
 return pages.join("\n\n").trim();
}

export default function ResumeUpload(){
 const[text,setText]=useState("");
 const[fileName,setFileName]=useState("");
 const[busy,setBusy]=useState(false);
 const[notice,setNotice]=useState("");
 const[expanded,setExpanded]=useState<string|null>(null);
 const[category,setCategory]=useState("전체");
 const results=useMemo(()=>companies.map(c=>analyze(text,c)).sort((a,b)=>b.score-a.score),[text]);
 const filtered=category==="전체"?results:results.filter(r=>r.c.category===category);
 const top=results[0];
 const categories=["전체",...unique(companies.map(c=>c.category))];
 const file=async(f:File)=>{
  setBusy(true);setFileName(f.name);setNotice("");
  try{
   const name=f.name.toLowerCase();
   if(name.endsWith(".txt")||name.endsWith(".md")) setText(await f.text());
   else if(name.endsWith(".docx")) setText(await extractDocx(f));
   else if(name.endsWith(".pdf")) setText(await extractPdf(f));
   else setNotice("지원 형식: PDF, DOCX, TXT, MD");
  }catch{setNotice("파일을 읽지 못했습니다. 이력서 내용을 붙여 넣어 주세요.");}
  finally{setBusy(false);}
 };
 const copy=(s:string)=>navigator.clipboard?.writeText(s);
 const recruiterText=(r:Result)=>`${r.c.name} 추천 후보자입니다. ${r.c.point}. ${r.role} 직무와 ${r.market} 시장 경험 측면에서 이력서와의 연결성이 높으며, 1차 적합도는 ${r.score}%입니다. 주요 매칭 역량은 ${r.matched.join(", ")}입니다. 다만 ${r.missing.join(", ")}은 실제 JD와 추가 확인이 필요합니다.`;
 const reportText=(r:Result)=>`[${r.c.name}]\n적합도: ${r.score}%\n추천 직무: ${r.role}\n추천 시장: ${r.market}\n매칭 근거: ${r.matched.join(", ")}\n보완 확인: ${r.missing.join(", ")}\n점수 구성: 산업 ${r.breakdown.industry} / 직무 ${r.breakdown.role} / 시장 ${r.breakdown.market} / 키워드 ${r.breakdown.keyword} / 최근경력 ${r.breakdown.recency}`;
 return <main className="page">
  <header className="hero"><div><div className="eyebrow">RESUME MATCH · V13</div><h1>이력서 → K-뷰티 기업·직무 추천</h1><p>이력서를 읽어 등록된 K-뷰티 기업별 적합도·추천 직무·시장·보완 포인트·헤드헌터 추천문안을 한 번에 계산합니다.</p></div></header>
  <section className="panel"><h2>1. 이력서 입력</h2><p className="sub">PDF·DOCX·TXT·MD 파일을 브라우저에서 직접 읽습니다. 파일 원문은 서버에 저장하지 않습니다.</p><label className="btn dark">이력서 파일 선택<input hidden type="file" accept=".pdf,.docx,.txt,.md" onChange={e=>e.target.files?.[0]&&file(e.target.files[0])}/></label>{fileName&&<span className="file"> {fileName}</span>}{busy&&<p>파일을 읽고 있습니다...</p>}{notice&&<div className="notice">{notice}</div>}<textarea className="resume" value={text} onChange={e=>setText(e.target.value)} placeholder="이력서 내용을 붙여 넣거나 파일을 선택하세요."/><div className="actions"><button className="btn light" onClick={()=>setText(sample)}>샘플 후보자 입력</button><button className="btn dark" onClick={()=>{setText("");setFileName("");setNotice("");setExpanded(null)}}>초기화</button></div></section>
  {text&&<>
   <section className="panel"><h2>2. 헤드헌터용 1차 추천</h2><div className="summary"><div><span>1위 기업</span><strong>{top.c.name}</strong><b>{top.score}%</b></div><div><span>추천 직무</span><strong>{top.role}</strong></div><div><span>추천 시장</span><strong>{top.market}</strong></div><div><span>추천 유형</span><strong>{top.score>=80?"강력 추천":top.score>=65?"검토 추천":"추가 검토"}</strong></div></div><p className="sub">등록된 기업 데이터에 대한 규칙 기반 1차 스크리닝입니다. 최종 추천은 실제 JD·후보자 경력 검증이 필요합니다.</p></section>
   <section className="panel"><h2>3. 기업별 적합도</h2><div className="filters">{categories.map(x=><button key={x} className={category===x?"filter active":"filter"} onClick={()=>setCategory(x)}>{x}</button>)}</div><div className="matchgrid">{filtered.map((r,i)=><article className="match" key={r.c.name}><div className="matchhead"><span className="rank">{i+1}</span><h3>{r.c.name}</h3><strong>{r.score}%</strong></div><p>{r.score>=80?"강력 추천":r.score>=65?"검토 추천":r.score>=50?"조건부 검토":"적합도 낮음"}</p><dl><dt>추천 직무</dt><dd>{r.role}</dd><dt>추천 시장</dt><dd>{r.market}</dd><dt>핵심 매칭</dt><dd>{r.matched.length?r.matched.join(" · "):"뚜렷한 매칭 근거 부족"}</dd></dl><button className="link" onClick={()=>setExpanded(expanded===r.c.name?null:r.c.name)}>{expanded===r.c.name?"상세 닫기":"상세 분석"}</button>{expanded===r.c.name&&<div className="detail"><b>추천 사유</b><p>{r.c.point}</p><b>점수 구성</b><p>산업 {r.breakdown.industry} · 직무 {r.breakdown.role} · 시장 {r.breakdown.market} · 키워드 {r.breakdown.keyword} · 최근경력 {r.breakdown.recency}</p><b>보완 확인 포인트</b><p>{r.missing.join(" · ")||"추가 확인 필요 항목 없음"}</p><div className="actions"><button className="btn light" onClick={()=>copy(recruiterText(r))}>헤드헌터 추천문안 복사</button><button className="btn light" onClick={()=>copy(reportText(r))}>분석 결과 복사</button></div></div>}</article>)}</div></section>
  </>}
  <section className="panel"><h2>4. 헤드헌터 업무 활용</h2><ol><li>후보자 PDF/DOCX를 선택합니다.</li><li>상위 기업과 추천 직무·시장을 확인합니다.</li><li>상세 분석에서 강점과 부족한 확인 포인트를 확인합니다.</li><li>실제 JD와 대조한 뒤 추천문안을 복사해 고객사 제출 자료에 활용합니다.</li></ol></section>
  <footer>2026 K-뷰티 산업 지형도 V13 · 등록 기업 15개 · 브라우저 기반 1차 매칭</footer>
 </main>;
}
