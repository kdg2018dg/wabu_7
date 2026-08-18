"use client";

import { useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_WINDOW = 300; // ms

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [interacting, setInteracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const lastTap = useRef(0);
  const didPan = useRef(false);

  function maxPan(currentScale: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width ?? window.innerWidth;
    const h = rect?.height ?? window.innerHeight;
    return { x: ((currentScale - 1) * w) / 2, y: ((currentScale - 1) * h) / 2 };
  }

  function clampPos(p: { x: number; y: number }, currentScale: number) {
    const max = maxPan(currentScale);
    return { x: clamp(p.x, -max.x, max.x), y: clamp(p.y, -max.y, max.y) };
  }

  function toggleZoom() {
    if (scale > 1) {
      setScale(1);
      setPos({ x: 0, y: 0 });
    } else {
      setScale(DOUBLE_TAP_SCALE);
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    didPan.current = false;
    setInteracting(true);

    if (pointers.current.size === 1) {
      dragStart.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };

      const now = Date.now();
      if (now - lastTap.current < DOUBLE_TAP_WINDOW) {
        toggleZoom();
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      pinchStartDist.current = distance(pts[0], pts[1]);
      pinchStartScale.current = scale;
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = distance(pts[0], pts[1]);
      if (pinchStartDist.current > 0) {
        const next = clamp(pinchStartScale.current * (dist / pinchStartDist.current), MIN_SCALE, MAX_SCALE);
        setScale(next);
        setPos((p) => clampPos(p, next));
      }
      didPan.current = true;
    } else if (pointers.current.size === 1 && scale > 1 && dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didPan.current = true;
      setPos(clampPos({ x: dragStart.current.posX + dx, y: dragStart.current.posY + dy }, scale));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStartDist.current = 0;
    if (pointers.current.size === 0) {
      dragStart.current = null;
      setInteracting(false);
      if (scale <= 1.02) {
        setScale(1);
        setPos({ x: 0, y: 0 });
      }
    }
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const next = clamp(scale - e.deltaY * 0.0015, MIN_SCALE, MAX_SCALE);
    setScale(next);
    setPos((p) => clampPos(p, next));
    if (next <= 1.02) setPos({ x: 0, y: 0 });
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{ touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onDoubleClick={toggleZoom}
      onClick={(e) => {
        // 팬(드래그) 직후 발생하는 클릭은 무시하고, 배경 클릭(닫기)만 부모로 전달
        if (didPan.current) e.stopPropagation();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="max-h-[90vh] max-w-[92vw] select-none rounded-lg object-contain"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transition: interacting ? "none" : "transform 0.15s ease",
          cursor: scale > 1 ? "grab" : "zoom-in",
        }}
      />
    </div>
  );
}
