"use client";

import { useState } from "react";
import { Heart } from "@/components/Doodles";
import { COLOR } from "@/lib/content";

// A fave's photos: the big one on top, tap a thumbnail to swap it in.
export default function FaveGallery({ photos, name, color = "pink" }) {
  const [current, setCurrent] = useState(0);
  const bg = COLOR[color] ? COLOR[color].bg : COLOR.pink.bg;
  const shown = photos[current] || photos[0];
  return (
    <div>
      <div className={`sticker dots-ink relative grid aspect-square place-items-center overflow-hidden rounded-[2rem] ${bg}`}>
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase storage or Unsplash URLs
          <img src={shown} alt={current ? `${name}, photo ${current + 1}` : name} className="absolute inset-0 h-full w-full bg-paper object-contain" />
        ) : (
          <Heart className="h-24 w-24" fill="var(--paper)" />
        )}
      </div>
      {photos.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3" role="group" aria-label="Photos">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === current}
              onClick={() => setCurrent(i)}
              className={`relative h-20 w-20 overflow-hidden rounded-2xl border-[2.5px] border-ink bg-paper transition-transform hover:-translate-y-0.5 ${
                i === current ? "shadow-[3px_3px_0_var(--pink)]" : "opacity-80"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- thumbnails of the same photos */}
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
