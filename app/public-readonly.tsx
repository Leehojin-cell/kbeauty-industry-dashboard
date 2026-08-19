"use client";

export default function PublicReadonly({children,readonly}:{children:React.ReactNode;readonly:boolean}){
  return <div style={{minHeight:"calc(100vh - 54px)"}}><div style={{pointerEvents:readonly?"none":"auto"}}>{children}</div></div>;
}
