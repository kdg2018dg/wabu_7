"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface LightboxState {
  src: string;
  alt: string;
}

const LightboxContext = createContext<((state: LightboxState) => void) | null>(null);

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LightboxState | null>(null);

  const open = useCallback((s: LightboxState) => setState(s), []);
  const close = useCallback(() => setState(null), []);

  return (
    <LightboxContext.Provider value={open}>
      {children}
      {state && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={state.alt || "이미지 크게 보기"}
          onClick={close}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          style={{ animation: "lightbox-fade 0.15s ease" }}
        >
          <button
            onClick={close}
            aria-label="닫기"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl leading-none text-white"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.src}
            alt={state.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain"
          />
        </div>
      )}
      <style>{`@keyframes lightbox-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </LightboxContext.Provider>
  );
}

/** 이미지를 클릭하면 확대해서 볼 수 있게 해주는 훅. Lightbox.open(src, alt) 형태로 사용. */
export function useLightbox() {
  const open = useContext(LightboxContext);
  if (!open) throw new Error("useLightbox must be used within LightboxProvider");
  return { open: (src: string, alt: string = "") => open({ src, alt }) };
}

/** 흔히 쓰는 패턴을 감싼 클릭 가능한 이미지 컴포넌트 */
export function ClickableImage({
  src,
  alt = "",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const { open } = useLightbox();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onClick={() => open(src, alt)}
      className={`cursor-zoom-in ${className}`}
    />
  );
}
