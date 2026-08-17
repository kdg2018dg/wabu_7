"use client";

import { useEffect } from "react";
import { Logo7 } from "@/components/Logo7";

export default function GlobalError({
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
    <html lang="ko">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-canvas,#f6f7fb)] px-6 text-center">
        <Logo7 size={30} />
        <div>
          <p className="text-lg font-bold">문제가 발생했어요</p>
          <p className="mt-1 text-sm text-[var(--color-ink-soft,#5c6072)]">
            일시적인 오류일 수 있어요. 잠시 후 다시 시도해주세요.
          </p>
        </div>
        <button
          onClick={reset}
          className="rounded-2xl bg-[var(--color-brand,#3d4bff)] px-5 py-3 text-sm font-bold text-white"
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
