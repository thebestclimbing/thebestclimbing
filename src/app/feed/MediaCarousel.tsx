"use client";

import { useRef, useState } from "react";

function cldUrl(url: string, width: number): string {
  if (!url) return url;
  return url.replace("/upload/", `/upload/w_${width},c_fill,q_auto,f_auto/`);
}

export function MediaCarousel({
  urls,
  size = 600,
  onTap,
}: {
  urls: string[];
  size?: number;
  onTap?: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const pointerStartX = useRef<number | null>(null);

  if (urls.length === 0) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartX.current = e.clientX;
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStartX.current !== null) {
      const delta = Math.abs(e.clientX - pointerStartX.current);
      if (delta < 8) onTap?.();
    }
    pointerStartX.current = null;
  };

  if (urls.length === 1) {
    return (
      <div onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        <img
          src={cldUrl(urls[0], size)}
          alt=""
          className="w-full aspect-square object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="relative" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <div
        className="flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIdx(Math.round(el.scrollLeft / el.offsetWidth));
        }}
      >
        {urls.map((url, i) => (
          <div key={i} className="snap-center flex-none w-full aspect-square overflow-hidden">
            <img
              src={cldUrl(url, size)}
              alt=""
              className="w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
        {urls.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
