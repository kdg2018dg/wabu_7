"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-base font-bold">문제가 발생했어요</p>
      <p className="text-sm text-[var(--color-ink-soft)]">
        일시적인 오류일 수 있어요. 잠시 후 다시 시도해주세요.
      </p>
      <button onClick={reset} className="btn-primary px-5">
        다시 시도
      </button>
    </div>
  );
}
