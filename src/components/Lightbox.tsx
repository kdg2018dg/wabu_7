"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { ZoomableImage } from "./ZoomableImage";

interface LightboxState {
  src: string;
  alt: string;
}

const LightboxContext = createContext<((state: LightboxState) => void) | null>(null);

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LightboxState | null>(null);
  const [downloading, setDownloading] = useState(false);

  const open = useCallback((s: LightboxState) => setState(s), []);
  const close = useCallback(() => setState(null), []);

  async function download() {
    if (!state) return;
    setDownloading(true);
    try {
      const res = await fetch(state.src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (state.alt || "image").replace(/[^\w가-힣.-]+/g, "_") + ".jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // 다운로드 실패 시 그냥 무시 — 사용자는 새 탭에서 여는 것으로 대체 가능
    } finally {
      setDownloading(false);
    }
  }

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
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                download();
              }}
              disabled={downloading}
              aria-label="다운로드"
              className="flex h-10 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <DownloadIcon />
              {downloading ? "저장 중..." : "다운로드"}
            </button>
            <button
              onClick={close}
              aria-label="닫기"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl leading-none text-white"
            >
              ×
            </button>
          </div>
          <ZoomableImage src={state.src} alt={state.alt} />
          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-white/60">
            더블탭하거나 손가락으로 벌려서 확대해보세요
          </p>
        </div>
      )}
      <style>{`@keyframes lightbox-fade { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </LightboxContext.Provider>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 4v11m0 0 4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 18v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
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
