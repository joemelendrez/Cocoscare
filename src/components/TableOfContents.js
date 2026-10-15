"use client";

import { useEffect, useState } from "react";

const indent = (level) => (level === 3 ? "pl-7 text-[15px]" : "pl-3");

// "In this post". variant="sidebar": a sticky card beside the post on wide
// screens that highlights the section you're reading. variant="mobile": a
// tap-to-open list at the top of the post below lg. Headings come from
// withHeadingIds().
export default function TableOfContents({ headings, variant = "sidebar" }) {
  const [active, setActive] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    if (variant === "mobile") return;
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean);
    if (!els.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-110px 0px -65% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings, variant]);

  const go = (e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 112,
      behavior: "smooth",
    });
    history.replaceState(null, "", `#${id}`);
  };

  if (headings.length < 2) return null;

  const links = (onPick) =>
    headings.map((h) => (
      <li key={h.id}>
        <a
          href={`#${h.id}`}
          onClick={(e) => {
            go(e, h.id);
            onPick?.(e);
          }}
          className={`block rounded-xl py-1.5 pr-2 leading-snug transition-colors ${indent(h.level)} ${
            variant !== "mobile" && active === h.id ? "bg-pink-soft font-semibold text-ink" : "text-ink/70 hover:bg-pink-soft/50 hover:text-ink"
          }`}
        >
          {h.text}
        </a>
      </li>
    ));

  if (variant === "mobile")
    return (
      <details className="sticker group mb-10 rounded-[1.5rem] bg-paper lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5 font-display text-lg tracking-wide [&::-webkit-details-marker]:hidden">
          In this post
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-pink-soft text-xl leading-none transition-transform group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <ul className="space-y-0.5 border-t-2 border-dashed border-ink/25 px-3 pb-4 pt-3">
          {links((e) => e.currentTarget.closest("details")?.removeAttribute("open"))}
        </ul>
      </details>
    );

  return (
    <nav aria-label="In this post" className="sticky top-28 hidden max-h-[calc(100vh-9rem)] overflow-y-auto lg:block">
      <div className="sticker rounded-[1.5rem] bg-paper p-4">
        <p className="px-3 pb-2 font-display text-lg tracking-wide">In this post</p>
        <ul className="space-y-0.5 text-sm">{links()}</ul>
      </div>
    </nav>
  );
}
