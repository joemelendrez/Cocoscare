"use client";

import { useEffect, useState } from "react";
import { Cookie, Heart } from "@/components/Doodles";

const BADGE_COLORS = ["bg-pink-soft", "bg-butter", "bg-periwinkle", "bg-mint"];

// The round sticker in front of a main section: its number, or a heart for
// the FAQ and a cookie for the recipe card.
function Badge({ heading, number, on }) {
  const base =
    "grid h-8 w-8 shrink-0 place-items-center rounded-full border-[2.5px] border-ink font-display text-base leading-none transition-transform";
  if (heading.kind === "recipe") return <Cookie className={`h-8 w-8 shrink-0 transition-transform ${on ? "rotate-12" : ""}`} />;
  if (heading.kind === "faq")
    return (
      <span className={`${base} ${on ? "-rotate-6 bg-ink" : "bg-paper"}`}>
        <Heart className="h-4 w-4" />
      </span>
    );
  return (
    <span
      className={`${base} ${on ? "-rotate-6 bg-ink text-paper" : `${BADGE_COLORS[(number - 1) % BADGE_COLORS.length]} text-ink`}`}
    >
      {number}
    </span>
  );
}

// "In this post". variant="sidebar": a sticky card beside the post on wide
// screens that highlights the section you're reading, with how far along
// you are. variant="mobile": a tap-to-open list at the top of the post
// below lg. Main sections get a numbered sticker and the display font;
// smaller headings sit under them on a dashed line. Headings come from
// withHeadingIds().
export default function TableOfContents({ headings, variant = "sidebar" }) {
  const live = variant !== "mobile";
  const [active, setActive] = useState(headings[0]?.id ?? "");

  // The section you're in is the last heading that has scrolled up past
  // the floating header.
  useEffect(() => {
    if (!live) return;
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean);
    if (!els.length) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const passed = els.filter((el) => el.getBoundingClientRect().top < 140);
      setActive((passed.at(-1) || els[0]).id);
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
    };
  }, [headings, live]);

  const go = (e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 112, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  if (headings.length < 2) return null;

  const rows = headings;
  // A small heading lights up its section too, so you always see where you are.
  const activeIndex = rows.findIndex((r) => r.id === active);
  const currentSection = live ? rows[activeIndex]?.section : null;
  const parts = rows.filter((r) => r.level === 2).length;

  const links = (onPick) =>
    rows.map((h) => {
      const pick = (e) => {
        go(e, h.id);
        onPick?.(e);
      };
      if (h.level === 3) {
        const on = live && active === h.id;
        return (
          <li key={h.id} className="ml-[1.45rem] border-l-[2.5px] border-dashed border-ink/25 pl-4">
            <a
              href={`#${h.id}`}
              onClick={pick}
              className={`flex items-start gap-2 py-1 pr-2 text-[0.92em] leading-snug transition-colors ${
                on ? "font-semibold text-pink-deep" : "text-ink/65 hover:text-ink"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-[0.45em] h-1.5 w-1.5 shrink-0 rounded-full ${on ? "bg-pink" : "bg-ink/30"}`}
              />
              {h.text}
            </a>
          </li>
        );
      }
      const on = currentSection === h.id;
      return (
        <li key={h.id} className="pt-1.5 first:pt-0">
          <a
            href={`#${h.id}`}
            onClick={pick}
            aria-current={on ? "location" : undefined}
            className={`flex items-center gap-3 rounded-2xl border-[2.5px] py-1.5 pl-1.5 pr-3 leading-tight transition-all ${
              on
                ? "border-ink bg-pink-soft shadow-[3px_3px_0_var(--ink)]"
                : "border-transparent hover:border-ink/20 hover:bg-blush"
            }`}
          >
            <Badge heading={h} number={h.number} on={on} />
            <span className="min-w-0">
              {h.kind === "recipe" && (
                <span className="block text-[0.7rem] font-bold uppercase tracking-widest text-pink-deep">Recipe</span>
              )}
              <span className="font-display tracking-wide">{h.text}</span>
            </span>
          </a>
        </li>
      );
    });

  if (!live)
    return (
      <details className="sticker group mb-10 rounded-[1.5rem] bg-paper lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2.5 font-display text-lg tracking-wide">
            <Heart className="h-6 w-6" /> In this post
            <span className="rounded-full border-2 border-ink bg-butter px-2 py-0.5 font-sans text-xs font-bold tracking-normal">
              {parts} parts
            </span>
          </span>
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-pink-soft text-xl leading-none transition-transform group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <ul className="border-t-2 border-dashed border-ink/25 px-3 pb-4 pt-3">
          {links((e) => e.currentTarget.closest("details")?.removeAttribute("open"))}
        </ul>
      </details>
    );

  const part = rows.filter((r) => r.level === 2).findIndex((r) => r.id === currentSection) + 1;
  return (
    <nav aria-label="In this post" className="sticky top-28 hidden max-h-[calc(100vh-9rem)] overflow-y-auto pb-2 pr-2 lg:block">
      <div className="sticker rounded-[1.5rem] bg-paper p-4">
        <div className="flex items-center justify-between gap-2 px-1 pb-3">
          <p className="flex items-center gap-2 font-display text-lg tracking-wide">
            <Heart className="h-6 w-6" /> In this post
          </p>
          <span className="rounded-full border-2 border-ink bg-butter px-2 py-0.5 text-xs font-bold tabular-nums">
            {part || 1} of {parts}
          </span>
        </div>
        <div className="mx-1 mb-4 h-2.5 overflow-hidden rounded-full border-2 border-ink bg-paper" aria-hidden="true">
          <div
            className="h-full bg-pink transition-[width] duration-300"
            style={{ width: `${((activeIndex + 1) / rows.length) * 100}%` }}
          />
        </div>
        <ul className="text-sm">{links()}</ul>
      </div>
    </nav>
  );
}
