"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";

const DISMISS_KEY = "timetable-onboarding-dismissed";

export function TimetableOnboardingHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(DISMISS_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 로컬스토리지 초기 동기화는 예외적으로 필요
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <Card className="mb-3 flex items-start gap-3 p-3" style={{ background: "var(--color-brand-soft)", borderColor: "transparent" }}>
      <span className="text-lg leading-none">💡</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[var(--color-brand)]">이 시간표는 우리 반 기본 시간표예요</p>
        <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
          선택과목이나 이동수업 등으로 시간표가 다르다면, 칸을 눌러 나만의 시간표로 바꿔보세요.
          바꾼 칸은 보라색으로 표시되고 언제든 기본으로 되돌릴 수 있어요.
        </p>
      </div>
      <button
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, "1");
          setVisible(false);
        }}
        className="shrink-0 text-xs font-bold text-[var(--color-brand)]"
      >
        닫기
      </button>
    </Card>
  );
}
