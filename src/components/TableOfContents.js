"use client";

import { useEffect, useRef, useState } from "react";
import { Cookie, Heart } from "@/components/Doodles";
import { jumpTo } from "@/lib/jumpTo";

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
  const navRef = useRef(null);

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

  // A long list scrolls inside the card, so follow along: keep the current
  // section near the top of the card as you read down the post. Only the
  // card's own list moves, never the page.
  useEffect(() => {
    const nav = navRef.current;
    if (!live || !nav || nav.scrollHeight <= nav.clientHeight) return;
    const link = nav.querySelector('[aria-current="location"]') || nav.querySelector(`a[href="#${CSS.escape(active)}"]`);
    if (!link) return;
    const top = link.getBoundingClientRect().top - nav.getBoundingClientRect().top + nav.scrollTop;
    nav.scrollTo({ top: Math.max(0, top - nav.clientHeight / 3), behavior: "smooth" });
  }, [active, live]);

  const go = (e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    jumpTo(el);
  };

  if (headings.length < 2) return null;

  // Recipes get their own group under the sections, so the count only
  // covers what's numbered ("3 of 7" with numbers 1 to 7).
  const rows = headings.filter((h) => h.kind !== "recipe");
  const recipes = headings.filter((h) => h.kind === "recipe");
  const mains = rows.filter((r) => r.level === 2);
  const numbered = mains.filter((r) => !r.kind).length;
  // A small heading lights up its section too, so you always see where you are.
  const current = live ? headings.find((h) => h.id === active) : null;
  const currentSection = current?.section ?? null;
  const inRecipe = current?.kind === "recipe";
  const countLabel = [
    numbered && `${numbered} section${numbered === 1 ? "" : "s"}`,
    recipes.length && `${recipes.length} recipe${recipes.length === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const links = (onPick) =>
    rows.map((h) => {
      // Close the phone menu first: closing it moves the page up, so
      // measuring before that would land past the heading.
      const pick = (e) => {
        onPick?.(e);
        go(e, h.id);
      };
      if (h.level === 3) {
        // On the sidebar a section's subheadings fold away until you're in it.
        if (live && h.section !== currentSection) return null;
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

  const recipeGroup = (onPick) =>
    recipes.length > 0 && (
      <details open={inRecipe || undefined} className="group/recipes mt-3 rounded-2xl border-[2.5px] border-ink bg-butter/25">
        <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3 py-2 font-display tracking-wide [&::-webkit-details-marker]:hidden">
          <Cookie className="h-6 w-6 shrink-0" />
          <span className="flex-1">Recipes</span>
          <span className="rounded-full border-2 border-ink bg-paper px-2 py-0.5 font-sans text-xs font-bold tabular-nums tracking-normal">
            {recipes.length}
          </span>
          <span aria-hidden="true" className="text-sm transition-transform group-open/recipes:rotate-180">
            ▾
          </span>
        </summary>
        <ul className="space-y-1 px-2 pb-2">
          {recipes.map((h) => {
            const on = live && active === h.id;
            return (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={(e) => {
                    onPick?.(e);
                    go(e, h.id);
                  }}
                  aria-current={on ? "location" : undefined}
                  className={`block rounded-xl border-2 px-3 py-1.5 font-display leading-tight tracking-wide transition-all ${
                    on ? "border-ink bg-paper shadow-[2px_2px_0_var(--ink)]" : "border-transparent hover:bg-paper"
                  }`}
                >
                  {h.text}
                </a>
              </li>
            );
          })}
        </ul>
      </details>
    );

  const closeMenu = (e) => e.currentTarget.closest("details.toc-menu")?.removeAttribute("open");

  if (!live)
    return (
      <details className="toc-menu sticker group mb-10 rounded-[1.5rem] bg-paper lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2.5 font-display text-lg tracking-wide">
            <Heart className="h-6 w-6" /> In this post
            <span className="rounded-full border-2 border-ink bg-butter px-2 py-0.5 font-sans text-xs font-bold tracking-normal">
              {countLabel}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-pink-soft text-xl leading-none transition-transform group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <ul className="border-t-2 border-dashed border-ink/25 px-3 pb-4 pt-3">{links(closeMenu)}</ul>
        <div className="px-3 pb-4">{recipeGroup(closeMenu)}</div>
      </details>
    );

  const section = mains.find((r) => r.id === currentSection);
  const where = inRecipe ? "Recipe" : section?.kind === "faq" ? "FAQ" : numbered ? `${section?.number || 1} of ${numbered}` : "";
  const order = headings.findIndex((h) => h.id === active);
  return (
    <nav
      ref={navRef}
      aria-label="In this post"
      className="sticky top-28 hidden max-h-[calc(100vh-9rem)] overflow-y-auto pb-2 pr-2 lg:block"
    >
      <div className="sticker rounded-[1.5rem] bg-paper p-4">
        <div className="flex items-center justify-between gap-2 px-1 pb-3">
          <p className="flex items-center gap-2 whitespace-nowrap font-display text-lg tracking-wide">
            <Heart className="h-6 w-6" /> In this post
          </p>
          <span className="rounded-full border-2 border-ink bg-butter px-2 py-0.5 text-xs font-bold tabular-nums">{where}</span>
        </div>
        <div className="mx-1 mb-4 h-2.5 overflow-hidden rounded-full border-2 border-ink bg-paper" aria-hidden="true">
          <div
            className="h-full bg-pink transition-[width] duration-300"
            style={{ width: `${((order + 1) / headings.length) * 100}%` }}
          />
        </div>
        <ul className="text-sm">{links()}</ul>
        {recipeGroup()}
      </div>
    </nav>
  );
}
