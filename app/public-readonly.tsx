"use client";

import { useMemo } from "react";

const MUTATING_TEXT = /기업 추가|저장|수정|편집|삭제|자동 조사|드래그하여|순서 변경|선택 초기화|인수|메모/i;

export default function PublicReadonly({children,readonly}:{children:React.ReactNode;readonly:boolean}){
  const className = useMemo(() => readonly ? "public-readonly" : "", [readonly]);

  if (!readonly) {
    return <div style={{minHeight:"calc(100vh - 54px)"}}>{children}</div>;
  }

  const blockMutation = (event: React.SyntheticEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const button = target.closest("button");
    const draggable = target.closest("[draggable=\"true\"]");
    const text = button?.textContent?.trim() || "";
    if (button && MUTATING_TEXT.test(text)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (draggable && (event.type === "dragstart" || event.type === "drop")) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div style={{minHeight:"calc(100vh - 54px)"}} className={className}
      onClickCapture={blockMutation}
      onDragStartCapture={blockMutation}
      onDropCapture={blockMutation}
    >
      {children}
    </div>
  );
}
