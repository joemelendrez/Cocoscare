"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { COLOR, NAV, SITE } from "@/lib/content";
import { Bubble, Heart, Sparkle, Star } from "@/components/Doodles";

const JELLY = { type: "spring", stiffness: 420, damping: 18 };

function isActive(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// The site's menu: a floating sticker pill. On desktop the links are
// bubbles with a jelly blob that slides to the current page; on phones a
// pink bubble button bursts open into a full-screen pink menu of tilted
// sticker cards.
export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(null);
  const lastY = useRef(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const delta = y - lastY.current;
    lastY.current = y;
    setScrolled(y > 24);
    if (y < 120 || open) setHidden(false);
    else if (Math.abs(delta) > 6) setHidden(delta > 0);
  });

  // Close the phone menu whenever the page changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const blobKey = hovered ?? NAV.find((n) => isActive(pathname, n.href))?.href;
  const blobColor = NAV.find((n) => n.href === blobKey)?.color || "pink";

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 px-3 pt-3 sm:px-5 sm:pt-4 ${open ? "z-[70]" : "z-50"}`}
        animate={{ y: hidden ? -120 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <nav
          aria-label="Main"
          className={`sticker mx-auto flex max-w-6xl items-center justify-between rounded-full bg-paper pl-2 pr-2 transition-[padding] duration-300 ${
            scrolled ? "py-1.5" : "py-2.5"
          }`}
        >
          <Link href="/" className="group flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
            <motion.span
              className="relative block h-12 w-12 shrink-0 sm:h-14 sm:w-14"
              whileHover={{ rotate: [0, -12, 10, -6, 0], scale: 1.08 }}
              transition={{ duration: 0.6 }}
            >
              <Image src="/logo.webp" alt="" fill sizes="56px" className="object-contain" priority />
            </motion.span>
            <span className="font-display text-2xl leading-none tracking-wide sm:text-[1.7rem]">
              Coco<span className="text-pink">&rsquo;s</span> Care
            </span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex" onMouseLeave={() => setHovered(null)}>
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href} className="relative">
                  {blobKey === item.href && (
                    <motion.span
                      layoutId="nav-blob"
                      className={`absolute inset-0 rounded-full border-[2.5px] border-ink ${COLOR[blobColor].bg}`}
                      transition={JELLY}
                      animate={{ scaleX: [1, 1.12, 0.96, 1], scaleY: [1, 0.86, 1.04, 1] }}
                    />
                  )}
                  <Link
                    href={item.href}
                    onMouseEnter={() => setHovered(item.href)}
                    onFocus={() => setHovered(item.href)}
                    onBlur={() => setHovered(null)}
                    aria-current={active ? "page" : undefined}
                    className="relative block rounded-full px-5 py-2 font-display text-lg tracking-wide"
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="hidden rounded-full border-[2.5px] border-ink bg-ink px-5 py-2.5 font-display text-lg tracking-wide text-paper shadow-[4px_4px_0_var(--pink)] transition-transform hover:-translate-y-0.5 hover:rotate-[-2deg] lg:block"
            >
              Shop my faves
            </Link>
            <MenuButton open={open} onClick={() => setOpen((o) => !o)} />
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>{open && <PhoneMenu pathname={pathname} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function MenuButton({ open, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="phone-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      whileTap={{ scale: 0.86 }}
      className="relative grid h-12 w-12 place-items-center rounded-full border-[2.5px] border-ink bg-pink shadow-[3px_3px_0_var(--ink)] md:hidden"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        {[7, 12, 17].map((y, i) => (
          <motion.path
            key={y}
            d={`M5 ${y} Q8.5 ${y - 2} 12 ${y} T19 ${y}`}
            fill="none"
            stroke="var(--paper)"
            strokeWidth="2.6"
            strokeLinecap="round"
            style={{ originX: "50%", originY: "50%" }}
            animate={
              open
                ? i === 1
                  ? { opacity: 0, scaleX: 0 }
                  : { rotate: i === 0 ? 45 : -45, y: i === 0 ? 5 : -5 }
                : { opacity: 1, scaleX: 1, rotate: 0, y: 0 }
            }
            transition={JELLY}
          />
        ))}
      </svg>
    </motion.button>
  );
}

const FLOATERS = [
  { C: Bubble, cls: "left-[8%] h-10 w-10", delay: 0 },
  { C: Heart, cls: "left-[78%] h-9 w-9", delay: 0.6 },
  { C: Star, cls: "left-[40%] h-8 w-8", delay: 1.2 },
  { C: Bubble, cls: "left-[62%] h-6 w-6", delay: 1.8 },
  { C: Sparkle, cls: "left-[22%] h-7 w-7", delay: 2.4 },
  { C: Bubble, cls: "left-[88%] h-12 w-12", delay: 3 },
];

function PhoneMenu({ pathname, onClose }) {
  return (
    <motion.div
      id="phone-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="dots fixed inset-0 z-[60] overflow-hidden bg-pink md:hidden"
      initial={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
      animate={{ clipPath: "circle(150% at calc(100% - 44px) 44px)" }}
      exit={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
      transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
    >
      {FLOATERS.map(({ C, cls, delay }, i) => (
        <motion.div
          key={i}
          className={`absolute bottom-[-60px] ${cls}`}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: "-110vh", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 7, delay, repeat: Infinity, ease: "linear" }}
        >
          <C className="h-full w-full" />
        </motion.div>
      ))}

      <div className="relative flex h-full flex-col px-6 pb-10 pt-28">
        <p className="font-display text-xl tracking-wide text-paper/90">Where to, mama?</p>
        <ul className="mt-5 space-y-4">
          {NAV.map((item, i) => {
            const active = isActive(pathname, item.href);
            return (
              <motion.li
                key={item.href}
                initial={{ x: 80, opacity: 0, rotate: 8 }}
                animate={{ x: 0, opacity: 1, rotate: i % 2 ? 2 : -2 }}
                exit={{ x: 60, opacity: 0 }}
                transition={{ ...JELLY, delay: 0.15 + i * 0.07 }}
              >
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={`sticker lift flex items-center justify-between rounded-[2rem] px-6 py-4 ${item.color === "pink" ? "bg-paper" : COLOR[item.color].bg}`}
                >
                  <span className="font-display text-4xl tracking-wide">{item.label}</span>
                  <span className="grid h-10 w-10 place-items-center rounded-full border-[2.5px] border-ink bg-paper text-xl">
                    {active ? <Heart className="h-5 w-5" /> : "→"}
                  </span>
                </Link>
              </motion.li>
            );
          })}
        </ul>
        <motion.p
          className="mt-auto text-center font-display text-lg tracking-wide text-paper"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.5 } }}
        >
          {SITE.tagline}
        </motion.p>
      </div>
    </motion.div>
  );
}
