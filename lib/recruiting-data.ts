export type Company = {
  name: string;
  category: string;
  roles: string[];
  markets: string[];
  keywords: string[];
  point: string;
};

export type Candidate = {
  id: string;
  name: string;
  company: string;
  role: string;
  years: number;
  skills: string[];
  markets: string[];
  target: string;
  note: string;
  resumeText?: string;
};

export const companies: Company[] = [
  { name: "브이티", category: "브랜드", roles: ["해외영업", "글로벌마케팅", "브랜드마케팅", "상품기획"], markets: ["미국", "유럽", "일본"], keywords: ["화장품", "해외영업", "수출", "distributor", "미국", "유럽", "일본", "글로벌"], point: "미주·유럽 해외영업과 글로벌 채널 확대 경험" },
  { name: "에이피알", category: "브랜드·D2C", roles: ["해외영업", "글로벌마케팅", "이커머스", "상품기획"], markets: ["미국", "일본", "중국"], keywords: ["화장품", "뷰티", "해외영업", "미국", "일본", "이커머스", "D2C", "글로벌"], point: "글로벌 D2C·이커머스와 미주·일본 경험" },
  { name: "달바글로벌", category: "브랜드", roles: ["글로벌영업", "브랜드마케팅", "이커머스", "MD"], markets: ["미국", "유럽", "일본"], keywords: ["화장품", "프리미엄", "해외영업", "미국", "유럽", "일본", "이커머스", "MD"], point: "프리미엄 뷰티 해외 유통·이커머스 경험" },
  { name: "구다이글로벌", category: "멀티브랜드·유통", roles: ["글로벌영업", "브랜드PM", "유통", "마케팅"], markets: ["북미", "일본", "유럽", "동남아"], keywords: ["화장품", "글로벌", "브랜드", "유통", "M&A", "미국", "일본", "마케팅"], point: "멀티브랜드·글로벌 유통과 시장 확장 경험" },
  { name: "더파운더즈", category: "브랜드", roles: ["해외영업", "글로벌마케팅", "브랜드마케팅", "MD"], markets: ["미국", "일본", "동남아", "유럽"], keywords: ["화장품", "뷰티", "해외영업", "글로벌", "브랜드", "미국", "일본", "마케팅", "MD"], point: "브랜드 성장과 해외 채널 확장 경험" },
  { name: "비나우", category: "브랜드", roles: ["해외영업", "글로벌마케팅", "브랜드마케팅", "상품기획"], markets: ["미국", "일본", "유럽"], keywords: ["화장품", "뷰티", "해외영업", "글로벌", "브랜드", "미국", "일본", "유럽"], point: "브랜드 기반 글로벌 영업·마케팅 경험" },
  { name: "토리든", category: "브랜드", roles: ["해외영업", "글로벌마케팅", "MD", "상품기획"], markets: ["미국", "일본", "유럽", "동남아"], keywords: ["화장품", "스킨케어", "해외영업", "글로벌", "미국", "일본", "유럽", "MD"], point: "스킨케어 해외영업과 글로벌 채널 경험" },
  { name: "아모레퍼시픽", category: "종합 뷰티", roles: ["해외영업", "글로벌마케팅", "브랜드마케팅", "상품기획", "SCM"], markets: ["북미", "미국", "일본", "중국", "유럽"], keywords: ["화장품", "뷰티", "해외영업", "글로벌", "브랜드", "마케팅", "SCM", "미국", "일본", "중국"], point: "대형 뷰티기업의 글로벌 브랜드·시장 운영 경험" },
  { name: "LG생활건강", category: "종합 뷰티", roles: ["해외영업", "글로벌마케팅", "브랜드마케팅", "상품기획", "SCM"], markets: ["북미", "미국", "중국", "일본", "아시아"], keywords: ["화장품", "뷰티", "해외영업", "글로벌", "브랜드", "마케팅", "SCM", "미국", "중국", "일본"], point: "글로벌 브랜드 운영과 대형 조직 경험" },
  { name: "코스맥스", category: "ODM·제조", roles: ["해외영업", "생산기획", "R&D", "품질", "SCM"], markets: ["미국", "중국", "동남아", "유럽"], keywords: ["ODM", "OEM", "화장품", "해외영업", "SCM", "생산", "품질", "R&D", "미국", "중국"], point: "화장품 OEM/ODM·글로벌 고객 대응 경험" },
  { name: "한국콜마", category: "ODM·제조", roles: ["해외영업", "R&D", "생산", "품질", "SCM"], markets: ["미국", "중국", "북미", "유럽"], keywords: ["ODM", "OEM", "화장품", "해외영업", "SCM", "생산", "품질", "R&D", "미국", "중국"], point: "화장품 ODM·R&D·품질·글로벌 고객 경험" },
  { name: "코스메카코리아", category: "ODM·제조", roles: ["해외영업", "생산", "품질", "R&D", "SCM"], markets: ["미국", "중국", "유럽", "동남아"], keywords: ["ODM", "OEM", "화장품", "해외영업", "생산", "품질", "R&D", "SCM", "미국", "유럽"], point: "ODM 제조와 해외 고객·생산 대응 경험" },
  { name: "씨앤씨인터내셔널", category: "ODM·색조", roles: ["해외영업", "생산", "R&D", "품질", "상품기획"], markets: ["미국", "유럽", "일본", "아시아"], keywords: ["ODM", "화장품", "색조", "해외영업", "생산", "R&D", "품질", "미국", "유럽", "일본"], point: "색조 ODM과 글로벌 고객 대응 경험" },
  { name: "실리콘투", category: "K-뷰티 유통", roles: ["해외영업", "글로벌영업", "유통", "MD", "이커머스"], markets: ["미국", "유럽", "아시아", "중동"], keywords: ["화장품", "K-뷰티", "해외영업", "글로벌", "유통", "이커머스", "미국", "유럽", "중동", "MD"], point: "K-뷰티 글로벌 유통·수출·이커머스 경험" },
  { name: "CJ올리브영", category: "리테일·플랫폼", roles: ["글로벌사업", "해외영업", "MD", "이커머스", "상품기획"], markets: ["미국", "일본", "유럽", "동남아"], keywords: ["화장품", "K-뷰티", "글로벌", "유통", "이커머스", "MD", "상품기획", "미국", "일본"], point: "K-뷰티 리테일·플랫폼과 글로벌 사업 경험" },
];

export const seedCandidates: Candidate[] = [
  { id: "sample-a", name: "후보자 A", company: "의료기기/뷰티 OEM", role: "해외영업", years: 3, skills: ["B2B 해외영업", "Distributor", "LinkedIn lead generation", "OEM/ODM"], markets: ["미국", "유럽", "CIS", "동남아", "중동"], target: "브이티·에이피알·달바글로벌", note: "미주·유럽 해외영업 포지션에 특히 적합" },
  { id: "sample-b", name: "후보자 B", company: "글로벌 소비재", role: "글로벌마케팅", years: 7, skills: ["브랜드마케팅", "D2C", "이커머스", "퍼포먼스마케팅"], markets: ["미국", "일본"], target: "에이피알·아모레퍼시픽·달바글로벌", note: "글로벌 브랜드 확장 경험" },
  { id: "sample-c", name: "후보자 C", company: "화장품 ODM", role: "생산기획/SCM", years: 12, skills: ["생산기획", "SCM", "SAP", "품질", "TPM"], markets: ["한국", "미국", "중국"], target: "코스맥스·한국콜마", note: "ODM 생산본부 및 SCM 리더급 소싱 후보" },
];

export const sampleResume = `[샘플 후보자]\n의료기기 해외영업 3년. 유럽·CIS·아시아·중동 15개국 담당, 바이어/디스트리뷰터 약 30개사 관리. LinkedIn으로 동남아 신규 디스트리뷰터 발굴. 최근 화장품 OEM/ODM 해외영업 경험. 미국 교육 및 체류 경험. 견적·수주·납기·샘플·규제·선적·통관 업무 수행.`;

export function companyByName(name: string) {
  return companies.find((company) => company.name === name) ?? companies[0];
}
