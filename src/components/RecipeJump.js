"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "@/components/Doodles";

// The hero's "Jump to a recipe" when a post has two or more recipe cards:
// one button that opens a sticker menu of every recipe, instead of a row
// of buttons that wraps onto several lines.
export default function RecipeJump({ jumps, shadow }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const away = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={box} className="relative mt-6 inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`lift inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-ink px-6 py-3 font-display text-lg tracking-wide text-paper ${shadow}`}
      >
        Jump to a recipe ({jumps.length})
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="inline-block">
          ▾
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="menu"
            initial={{ opacity: 0, x: "-50%", y: -8, scale: 0.96 }}
            animate={{ opacity: 1, x: "-50%", y: 0, scale: 1 }}
            exit={{ opacity: 0, x: "-50%", y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="follow-theme sticker absolute left-1/2 z-30 mt-3 max-h-80 w-[min(20rem,calc(100vw-2.5rem))] overflow-y-auto rounded-[1.5rem] bg-paper p-2"
          >
            {jumps.map((j) => (
              <li key={j.id} role="none">
                <a
                  role="menuitem"
                  href={`#${j.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-[1rem] px-3 py-2.5 font-display text-lg leading-tight tracking-wide text-ink hover:bg-blush"
                >
                  <Cookie className="h-7 w-7 shrink-0" />
                  {j.title}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
