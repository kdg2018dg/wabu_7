"use client";

import { useState, useTransition } from "react";
import { clearTestData } from "./actions";

const CONFIRM_WORD = "삭제";

export function ClearTestDataForm() {
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs text-[var(--color-ink-soft)]">
        공부 인증, 캘린더 일정(공휴일 제외), 공지사항, 물품 신청, 교시 메모를 전부 삭제합니다.
        학생 계정과 시간표는 지워지지 않습니다. 되돌릴 수 없으니 실제 서비스 시작 직전에만
        사용하세요.
      </p>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        확인을 위해 &quot;{CONFIRM_WORD}&quot;를 입력하세요
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="input !min-h-10 text-sm"
          placeholder={CONFIRM_WORD}
        />
      </label>
      {error && <p className="text-xs font-medium text-[var(--color-rose)]">{error}</p>}
      {done && <p className="text-xs font-medium text-[var(--color-mint)]">테스트 데이터를 삭제했어요.</p>}
      <button
        disabled={pending || confirmText !== CONFIRM_WORD}
        onClick={() =>
          startTransition(async () => {
            const res = await clearTestData();
            if (res.error) setError(res.error);
            else {
              setError(null);
              setDone(true);
              setConfirmText("");
            }
          })
        }
        className="btn-primary !min-h-10 text-sm"
        style={{ background: "var(--color-rose)" }}
      >
        {pending ? "삭제 중..." : "테스트 데이터 전체 삭제"}
      </button>
    </div>
  );
}
