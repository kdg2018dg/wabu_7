"use client";

import { useTransition } from "react";
import { deleteMyPendingSession } from "./actions";

export function DeletePendingButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        if (confirm("이 인증을 삭제할까요? 승인 대기 중인 인증만 삭제할 수 있어요."))
          startTransition(async () => {
            await deleteMyPendingSession(id);
          });
      }}
      className="shrink-0 text-xs font-semibold text-[var(--color-ink-soft)]"
    >
      삭제
    </button>
  );
}
