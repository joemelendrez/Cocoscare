"use client";
// One sideways-scrolling row, shared by every chip bar and card strip so
// they all behave the same: the edges fade only where there's more to see,
// the selected item slides into view, items snap, mouse screens get ‹ ›
// buttons on hover (touch screens swipe), and card strips can show dots.
// Chip filters use PillTrack (./PillTrack.js), built on this. Arrow styles
// live in globals.css (.scroll-row-arrow). Same component as Habit Nova's
// src/components/ScrollRow.js.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const SLACK = 1;

export const ACTIVE_SELECTOR = '[aria-selected="true"],[aria-pressed="true"],[aria-current="page"],[aria-current="step"],[data-active="true"]';

export function scrollEdges({ scrollLeft = 0, scrollWidth = 0, clientWidth = 0 }) {
  const max = Math.max(0, scrollWidth - clientWidth);
  if (max <= SLACK) return { left: false, right: false, overflow: false };
  return { left: scrollLeft > SLACK, right: scrollLeft < max - SLACK, overflow: true };
}

export function edgeMask({ left, right }, fade = 36) {
  if (!left && !right) return undefined;
  const a = left ? `transparent 0, #000 ${fade}px` : "#000 0";
  const b = right ? `#000 calc(100% - ${fade}px), transparent 100%` : "#000 100%";
  return `linear-gradient(90deg, ${a}, ${b})`;
}

export function scrollToShow({ itemLeft, itemWidth, scrollLeft, clientWidth, scrollWidth, margin = 24 }) {
  const max = Math.max(0, scrollWidth - clientWidth);
  if (max === 0) return null;
  if (itemLeft >= scrollLeft + margin && itemLeft + itemWidth <= scrollLeft + clientWidth - margin) return null;
  return Math.round(Math.min(max, Math.max(0, itemLeft - (clientWidth - itemWidth) / 2)));
}

export function pageDots({ scrollLeft = 0, scrollWidth = 0, clientWidth = 0 }) {
  if (clientWidth <= 0 || scrollWidth <= clientWidth + SLACK) return { pages: 1, page: 0 };
  const pages = Math.min(8, Math.ceil(scrollWidth / clientWidth - 0.05));
  const max = scrollWidth - clientWidth;
  return { pages, page: Math.round((Math.min(max, Math.max(0, scrollLeft)) / max) * (pages - 1)) };
}

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function Chevron({ dir }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir < 0 ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

const ScrollRow = forwardRef(function ScrollRow({
  children,
  as: Row = "div",
  className = "",
  rowClassName = "gap-2",
  rowProps,
  arrows = true,
  arrowClassName = "",
  snap = false, // false | "chips" | "cards"
  dots = false,
  dotClassName = "bg-current",
  activeKey,
  activeSelector = ACTIVE_SELECTOR,
  fade = 36,
}, ref) {
  const rowRef = useRef(null);
  const frame = useRef(0);
  const first = useRef(true);
  const [edges, setEdges] = useState({ left: false, right: false, overflow: false });
  const [dot, setDot] = useState({ pages: 1, page: 0 });

  useImperativeHandle(ref, () => rowRef.current, []);

  const measure = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const m = { scrollLeft: el.scrollLeft, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
    const e = scrollEdges(m);
    setEdges((p) => (p.left === e.left && p.right === e.right && p.overflow === e.overflow ? p : e));
    if (dots) {
      const d = pageDots(m);
      setDot((p) => (p.pages === d.pages && p.page === d.page ? p : d));
    }
  }, [dots]);

  useIsoLayoutEffect(() => {
    measure();
    const el = rowRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    for (const child of el.children) ro.observe(child);
    return () => { ro.disconnect(); if (frame.current) cancelAnimationFrame(frame.current); frame.current = 0; };
  });

  useIsoLayoutEffect(() => {
    const el = rowRef.current;
    const item = el?.querySelector(activeSelector);
    if (!el || !item) return;
    const rb = el.getBoundingClientRect();
    const ib = item.getBoundingClientRect();
    const target = scrollToShow({ itemLeft: ib.left - rb.left + el.scrollLeft, itemWidth: ib.width, scrollLeft: el.scrollLeft, clientWidth: el.clientWidth, scrollWidth: el.scrollWidth });
    const instant = first.current;
    first.current = false;
    if (target != null) el.scrollTo({ left: target, behavior: instant || reduceMotion() ? "auto" : "smooth" });
  }, [activeKey, activeSelector]);

  const onScroll = () => {
    if (!frame.current) frame.current = requestAnimationFrame(() => { frame.current = 0; measure(); });
  };
  const nudge = (dir) => {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(120, Math.round(el.clientWidth * 0.75)), behavior: reduceMotion() ? "auto" : "smooth" });
  };

  const mask = edgeMask(edges, fade);
  const snapClass = snap === "cards" ? "scroll-row-snap-cards" : snap ? "scroll-row-snap-chips" : "";

  return (
    <div className={`scroll-row relative min-w-0 ${className}`}>
      <Row
        ref={rowRef}
        onScroll={onScroll}
        className={`flex overflow-x-auto scroll-row-track ${snapClass} ${rowClassName}`}
        style={{ WebkitMaskImage: mask, maskImage: mask, overscrollBehaviorX: "contain" }}
        {...rowProps}
      >
        {children}
      </Row>
      {arrows && edges.overflow && (
        <>
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(-1)} className={`scroll-row-arrow left-1 ${arrowClassName}`} data-show={edges.left ? "" : undefined}><Chevron dir={-1} /></button>
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(1)} className={`scroll-row-arrow right-1 ${arrowClassName}`} data-show={edges.right ? "" : undefined}><Chevron dir={1} /></button>
        </>
      )}
      {dots && dot.pages > 1 && (
        <div className="mt-2 flex justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: dot.pages }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${dotClassName}`} style={{ width: i === dot.page ? 16 : 6, opacity: i === dot.page ? 1 : 0.3 }} />
          ))}
        </div>
      )}
    </div>
  );
});

export default ScrollRow;
