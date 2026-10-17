"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CategoryIcon } from "@/components/Doodles";
import ThemeToggle from "@/components/ThemeToggle";
import { COLOR } from "@/lib/content";

const JELLY = { type: "spring", stiffness: 420, damping: 22 };
const STROKE = { fill: "none", stroke: "var(--ink)", strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" };

export const ADMIN_NAV = [
  { href: "/admin", label: "Posts", short: "Posts", color: "pink", icon: "pencil" },
  { href: "/admin/recipes", label: "Recipes", short: "Recipes", color: "butter", icon: "whisk" },
  { href: "/admin/products", label: "Shop picks", short: "Shop", color: "periwinkle", icon: "bag" },
];

export function navActive(pathname, href) {
  return href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/posts") : pathname.startsWith(href);
}

function NavIcon({ name, className }) {
  if (name !== "pencil") return <CategoryIcon name={name} className={className} />;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M9 31l2-8L27 7l6 6-16 16Z" {...STROKE} fill="var(--paper)" />
      <path d="M23 11l6 6M9 31l8-2" {...STROKE} />
    </svg>
  );
}

function Tile({ item, className = "h-10 w-10" }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl border-[2.5px] border-ink ${COLOR[item.color].bg} ${className}`}
    >
      <NavIcon name={item.icon} className="h-7 w-7" />
    </span>
  );
}

function SmallIcon({ d }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
const EXTERNAL = "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5";
const SIGN_OUT = "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10";

function Brand() {
  return (
    <Link href="/admin" className="group flex items-center gap-2.5" aria-label="Admin home">
      <motion.span
        className="relative block h-12 w-12 shrink-0"
        whileHover={{ rotate: [0, -12, 10, -6, 0], scale: 1.08 }}
        transition={{ duration: 0.6 }}
      >
        <Image src="/logo.webp" alt="" fill sizes="48px" className="object-contain" />
      </motion.span>
      <span className="leading-none">
        <span className="block whitespace-nowrap font-display text-xl tracking-wide">
          Coco<span className="text-pink">&rsquo;s</span> Kitchen
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-ink/60">Admin</span>
      </span>
    </Link>
  );
}

// Desktop: a floating sticker sidebar on the left, like the site's header
// turned on its side. Phones: a top bar and an app-style bottom tab bar.
export default function AdminNav({ pathname, email, onSignOut }) {
  const [more, setMore] = useState(false);
  const activeHref = ADMIN_NAV.find((n) => navActive(pathname, n.href))?.href;

  return (
    <>
      <aside className="sticker fixed inset-y-4 left-4 z-40 hidden w-64 flex-col rounded-[2rem] bg-paper p-4 lg:flex">
        <div className="px-1 pt-1">
          <Brand />
        </div>
        <p className="mt-7 px-2 text-xs font-semibold uppercase tracking-widest text-ink/50">Write</p>
        <nav aria-label="Admin" className="mt-2 space-y-1.5">
          {ADMIN_NAV.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-[1.25rem] px-2 py-2 font-display text-xl tracking-wide transition-transform ${
                  active ? "" : "hover:translate-x-1 hover:bg-blush"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="admin-side-blob"
                    className="absolute inset-0 -rotate-1 rounded-[1.25rem] border-[2.5px] border-ink bg-pink-soft shadow-[3px_3px_0_var(--shadow)]"
                    transition={JELLY}
                  />
                )}
                <span className="relative">
                  <Tile item={item} />
                </span>
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 border-t-2 border-dashed border-ink/25 pt-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-full border-[2.5px] border-ink bg-ink px-4 py-2 font-display tracking-wide text-paper shadow-[3px_3px_0_var(--pink)] transition-transform hover:-translate-y-0.5"
          >
            View site <SmallIcon d={EXTERNAL} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-10 w-10" />
            <button
              type="button"
              onClick={onSignOut}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border-[2.5px] border-ink px-3 py-2 text-sm font-semibold hover:bg-blush"
            >
              <SmallIcon d={SIGN_OUT} /> Sign out
            </button>
          </div>
          {email && <p className="truncate px-1 text-xs text-ink/60">{email}</p>}
        </div>
      </aside>

      {/* Phones and tablets */}
      <header className="sticky top-0 z-40 px-3 pt-3 lg:hidden">
        <div className="sticker flex items-center justify-between rounded-full bg-paper py-1.5 pl-2 pr-2">
          <Brand />
          <ThemeToggle className="h-10 w-10" />
        </div>
      </header>

      <nav
        aria-label="Admin"
        className="sticker fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-full bg-paper p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden"
      >
        {ADMIN_NAV.map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-col items-center gap-0.5 rounded-full py-1.5 text-xs font-semibold"
            >
              {active && (
                <motion.span
                  layoutId="admin-tab-blob"
                  className="absolute inset-0 rounded-full border-[2.5px] border-ink bg-pink-soft"
                  transition={JELLY}
                />
              )}
              <motion.span className="relative" animate={{ y: active ? -1 : 0, scale: active ? 1.08 : 1 }} transition={JELLY}>
                <NavIcon name={item.icon} className="h-7 w-7" />
              </motion.span>
              <span className="relative">{item.short}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMore(true)}
          aria-expanded={more}
          className="relative flex flex-col items-center gap-0.5 rounded-full py-1.5 text-xs font-semibold"
        >
          <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden="true">
            {[11, 20, 29].map((x) => (
              <circle key={x} cx={x} cy="20" r="3.5" fill="var(--paper)" {...STROKE} strokeWidth="2.5" />
            ))}
          </svg>
          More
        </button>
      </nav>

      <AnimatePresence>
        {more && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button type="button" aria-label="Close" className="absolute inset-0 bg-black/50" onClick={() => setMore(false)} />
            <motion.div
              role="dialog"
              aria-label="More"
              className="sticker absolute inset-x-3 bottom-3 rounded-[2rem] bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              exit={{ y: "110%" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/20" />
              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between rounded-[1.5rem] border-[2.5px] border-ink bg-ink px-5 py-3.5 font-display text-xl tracking-wide text-paper"
              >
                View site <SmallIcon d={EXTERNAL} />
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                className="mt-3 flex w-full items-center justify-between rounded-[1.5rem] border-[2.5px] border-ink px-5 py-3.5 font-display text-xl tracking-wide"
              >
                Sign out <SmallIcon d={SIGN_OUT} />
              </button>
              {email && <p className="mt-4 truncate text-center text-sm text-ink/60">Signed in as {email}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
