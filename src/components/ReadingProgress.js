"use client";

import { useEffect } from "react";
import { setReadingProgress, useReadingState } from "@/lib/readingProgress";

// How far through the post (#article-content) the reader is. While the
// header shows, the Header draws it along the bottom of its pill; once the
// header tucks away on scroll down, this pink bar runs across the top of
// the screen instead.
export default function ReadingProgress({ targetId = "article-content" }) {
  const { progress, headerHidden } = useReadingState();

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = target.getBoundingClientRect().top + window.scrollY;
      const start = top - window.innerHeight * 0.2;
      const end = top + target.offsetHeight - window.innerHeight * 0.8;
      const p = end <= start ? 1 : (window.scrollY - start) / (end - start);
      setReadingProgress(Math.round(Math.min(100, Math.max(0, p * 100)) * 10) / 10);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      setReadingProgress(null);
    };
  }, [targetId]);

  const value = progress ?? 0;
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 z-[55] h-1.5 transition-opacity duration-300 ${
        headerHidden && value > 0 && value < 100 ? "opacity-100" : "opacity-0"
      }`}
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
    >
      <div className="h-full origin-left rounded-r-full bg-pink" style={{ transform: `scaleX(${value / 100})` }} />
    </div>
  );
}
