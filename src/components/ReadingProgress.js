"use client";

import { useEffect, useState } from "react";

// A pink bar across the top of the screen showing how far through the
// post (#article-content) the reader is.
export default function ReadingProgress({ targetId = "article-content" }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const update = () => {
      const top = target.getBoundingClientRect().top + window.scrollY;
      const start = top - window.innerHeight * 0.2;
      const end = top + target.offsetHeight - window.innerHeight * 0.8;
      const p = end <= start ? 1 : (window.scrollY - start) / (end - start);
      setProgress(Math.min(100, Math.max(0, p * 100)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  return (
    <div
      className="fixed inset-x-0 top-0 z-[55] h-1.5"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    >
      <div className="h-full rounded-r-full bg-pink transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
    </div>
  );
}
