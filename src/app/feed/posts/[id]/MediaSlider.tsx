"use client";

import { useState } from "react";
import { FeedMedia } from "../../types";

function cldUrl(url: string, width: number): string {
  if (!url) return url;
  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}

export function MediaSlider({ media }: { media: FeedMedia[] }) {
  const [idx, setIdx] = useState(0);

  if (media.length === 0) return null;

  if (media.length === 1) {
    return (
      <img
        src={cldUrl(media[0].url, 1200)}
        alt=""
        className="w-full rounded-xl object-contain"
        style={{ maxHeight: "70vh" }}
      />
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div
        className="flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIdx(Math.round(el.scrollLeft / el.offsetWidth));
        }}
      >
        {media.map((m, i) => (
          <div key={i} className="snap-center flex-none w-full">
            <img
              src={cldUrl(m.url, 1200)}
              alt=""
              className="w-full object-contain"
              style={{ maxHeight: "70vh" }}
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
        {media.map((_, i) => (
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
