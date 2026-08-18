"use client";

import { useMemo, useState } from "react";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

type Company={name:string;roles:string[];markets:string[];keywords:string[];industry:string[];point:string};
type Result={c:Company;score:number;matched:string[];missing:string[];role:string;market:string};

const companies:Company[]=[
{name:"브이티",roles:["해외영업","글로벌마케팅","브랜드마케팅","상품기획"],markets:["미국","유럽","일본"],keywords:["화장품","해외영업","수출","distributor","미국","유럽","일본","글로벌"],industry:["화장품","뷰티","브랜드","글로벌"],point:"미주·유럽 해외영업과 글로벌 채널 확대 경험이 있는 후보자"},
{name:"에이피알",roles:["해외영업","글로벌마케팅","이커머스","상품기획"],markets:["미국","일본","중국"],keywords:["화장품","뷰티","해외영업","미국","일본","이커머스","D2C","글로벌"],industry:["화장품","뷰티","이커머스","D2C"],point:"글로벌 D2C와 미주·일본 시장 경험이 강한 후보자"},
{name:"달바글로벌",roles:["글로벌영업","브랜드마케팅","이커머스","MD"],markets:["미국","유럽","일본"],keywords:["화장품","프리미엄","해외영업","미국","유럽","일본","이커머스","MD"],industry:["화장품","뷰티","프리미엄","이커머스"],point:"프리미엄 뷰티의 해외 유통·D2C 경험이 있는 후보자"},
{name:"구다이글로벌",roles:["글로벌영업","브랜드PM","유통","마케팅"],markets:["북미","일본","유럽","동남아"],keywords:["화장품","글로벌","브랜드","유통","M&A","미국","일본","마케팅"],industry:["화장품","뷰티","브랜드","유통"],point:"멀티브랜드·글로벌 유통 경험이 있는 후보자"},
{name:"코스맥스",roles:["해외영업","생산기획","R&D","품질","SCM"],markets:["미국","중국","동남아"],keywords:["ODM","OEM","화장품","해외영업","SCM","생산","품질","R&D"],industry:["화장품","ODM","OEM","제조"],point:"화장품 OEM/ODM과 글로벌 고객 대응 경험이 있는 후보자"},
{name:"한국콜마",roles:["해외영업","R&D","생산","품질","SCM"],markets:["미국","중국","북미"],keywords:["ODM","OEM","화장품","해외영업","SCM","생산","품질","R&D"],industry:["화장품","ODM","OEM","제조"],point:"화장품 ODM·R&D·품질·글로벌 고객 경험이 있는 후보자"}
];

const sample=`[샘플 후보자]\n의료기기 해외영업 3년. 유럽·CIS·아시아·중동 15개국 담당, 바이어/디스트리뷰터 약 30개사 관리. LinkedIn으로 동남아 신규 디스트리뷰터 발굴. 최근 화장품 OEM/ODM 해외영업 경험. 미국 교육 및 체류 경험. 견적·수주·납기·샘플·규제·선적·통관 업무 수행.`;

const norm=(s:string)=>s.toLowerCase().replace(/[\s·,&/()\-]/g,"");
const has=(text:string,k:string)=>norm(text).includes(norm(k));

function analyze(text:string,c:Company):Result{
 const keywordHits=c.keywords.filter(k=>has(text,k));
 const industryHits=c.industry.filter(k=>has(text,k));
 const roleHits=c.roles.filter(k=>has(text,k));
 const marketHits=c.markets.filter(k=>has(text,k));
 const keywordScore=Math.min(32,Math.round(keywordHits.length/c.keywords.length*32));
 const industryScore=Math.min(20,industryHits.length*7);
 const roleScore=roleHits.length?Math.min(24,10+roleHits.length*7):0;
 const marketScore=marketHits.length?Math.min(14,7+marketHits.length*3):0;
 const recencyBonus=has(text,"최근")&&industryHits.length?3:0;
 const raw=keywordScore+industryScore+roleScore+marketScore+recencyBonus;
 const score=Math.max(18,Math.min(97,Math.round(raw)));
 const matched=[...new Set([...industryHits,...roleHits,...marketHits])];
 const missing=[...new Set([...c.keywords,...c.roles,...c.markets])].filter(k=>!has(text,k)).slice(0,5);
 return {c,score,matched,missing,role:roleHits[0]||c.roles[0],market:marketHits[0]||c.markets[0]};
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
  const text=content.items.map((item:any)=>"str" in item?item.str:"").join(" ");
  pages.push(text);
 }
 return pages.join("\n\n").trim();
}

export default function ResumeUpload(){
 const[text,setText]=useState("");
 const[fileName,setFileName]=useState("");
 const[busy,setBusy]=useState(false);
 const[notice,setNotice]=useState("");
 const[expanded,setExpanded]=useState<string|null>(null);
 const results=useMemo(()=>companies.map(c=>analyze(text,c)).sort((a,b)=>b.score-a.score),[text]);
 const top=results[0];
 const file=async(f:File)=>{
  setBusy(true);setFileName(f.name);setNotice("");
  try{
   const name=f.name.toLowerCase();
   if(name.endsWith(".txt")||name.endsWith(".md")) setText(await f.text());
   else if(name.endsWith(".docx")) setText(await extractDocx(f));
   else if(name.endsWith(".pdf")) setText(await extractPdf(f));
   else setNotice("지원 형식: PDF, DOCX, TXT, MD");
  }catch(e){setNotice("파일을 읽지 못했습니다. 이력서 내용을 입력창에 붙여 넣어 주세요.");}
  finally{setBusy(false);}
 };
 const copy=(s:string)=>navigator.clipboard?.writeText(s);
 const recruiterText=(r:Result)=>`${r.c.name} 추천 후보자입니다. ${r.c.point}. 주요 매칭 직무는 ${r.c.roles.join(", ")}이며, 매칭 시장은 ${r.c.markets.join(", ")}입니다. 이력서 기준 1차 적합도는 ${r.score}%입니다. 실제 추천 전에는 해당 포지션 JD와 후보자의 최근 경력을 최종 대조하는 것을 권장합니다.`;
 return <main className="page">
  <header className="hero"><div><div className="eyebrow">RESUME MATCH · V12</div><h1>이력서 파일 → K-뷰티 기업 추천</h1><p>파일에서 이력서를 읽고 산업·직무·시장·핵심역량을 분리해 기업 적합도를 계산합니다.</p></div></header>
  <section className="panel"><h2>1. 이력서 파일 업로드</h2><p className="sub">PDF·DOCX·TXT·MD를 바로 읽습니다. 입력한 이력서는 서버에 저장하지 않고 브라우저에서만 분석합니다.</p><label className="btn dark">파일 선택<input hidden type="file" accept=".pdf,.docx,.txt,.md" onChange={e=>e.target.files?.[0]&&file(e.target.files[0])}/></label>{fileName&&<span className="file"> {fileName}</span>}{busy&&<p>파일을 분석하는 중입니다...</p>}{notice&&<div className="notice">{notice}</div>}<textarea className="resume" value={text} onChange={e=>setText(e.target.value)} placeholder="이력서 내용을 붙여 넣거나 파일을 선택하세요."/><div className="actions"><button className="btn light" onClick={()=>setText(sample)}>샘플 후보자 입력</button><button className="btn dark" onClick={()=>{setText("");setFileName("");setNotice("")}}>초기화</button></div></section>
  {text&&<>
   <section className="panel"><h2>2. 1차 매칭 요약</h2><div className="summary"><div><span>1위 추천</span><strong>{top.c.name}</strong><b>{top.score}%</b></div><div><span>추천 직무</span><strong>{top.role}</strong></div><div><span>추천 시장</span><strong>{top.market}</strong></div></div><p className="sub">점수는 규칙 기반 1차 스크리닝 결과이며, 실제 채용 의사결정의 최종 점수가 아닙니다.</p></section>
   <section className="panel"><h2>3. K-뷰티 기업별 적합도</h2><div className="matchgrid">{results.map((r,i)=><article className="match" key={r.c.name}><div className="matchhead"><span className="rank">{i+1}</span><h3>{r.c.name}</h3><strong>{r.score}%</strong></div><p>{r.score>=80?"강력 추천":r.score>=65?"검토 추천":r.score>=50?"조건부 검토":"적합도 낮음"}</p><dl><dt>핵심 매칭</dt><dd>{r.matched.length?r.matched.join(" · "):"뚜렷한 매칭 근거 부족"}</dd><dt>추천 직무</dt><dd>{r.c.roles.join(" · ")}</dd><dt>추천 시장</dt><dd>{r.c.markets.join(" · ")}</dd></dl><button className="link" onClick={()=>setExpanded(expanded===r.c.name?null:r.c.name)}>{expanded===r.c.name?"상세 닫기":"상세 분석"}</button>{expanded===r.c.name&&<div className="detail"><b>추천 사유</b><p>{r.c.point}</p><b>보완 확인 포인트</b><p>{r.missing.join(" · ")||"추가 확인 필요 항목 없음"}</p><button className="btn light" onClick={()=>copy(recruiterText(r))}>헤드헌터 추천 문안 복사</button></div>}</article>)}</div></section>
  </>}
  <section className="panel"><h2>4. 헤드헌터 활용법</h2><ol><li>후보자의 PDF 또는 DOCX를 선택합니다.</li><li>상위 추천 기업과 적합도를 확인합니다.</li><li>상세 분석에서 매칭 근거와 보완 확인 포인트를 봅니다.</li><li>실제 JD와 후보자 경력을 대조한 뒤 추천 문안을 복사합니다.</li></ol></section>
  <footer>2026 K-뷰티 산업 지형도 V12 · 파일 기반 1차 매칭 · 개인정보는 브라우저에서만 처리</footer>
 </main>;
}