"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";

// Light/dark switch. The theme lives on <html data-theme>, set before the
// page paints by THEME_SCRIPT (saved choice, else the phone's setting), so
// there's no white flash; this only flips it and remembers the choice.
export const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

const subscribe = (cb) => {
  window.addEventListener("themechange", cb);
  return () => window.removeEventListener("themechange", cb);
};
const read = () => document.documentElement.dataset.theme === "dark";

export default function ThemeToggle({ className = "" }) {
  const dark = useSyncExternalStore(subscribe, read, () => false);
  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    window.dispatchEvent(new Event("themechange"));
  };
  return (
    <motion.button
      type="button"
      onClick={flip}
      whileTap={{ scale: 0.86, rotate: -20 }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-paper shadow-[3px_3px_0_var(--ink)] ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        {dark ? (
          // Moon
          <path
            d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
            fill="var(--butter)"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        ) : (
          // Sun
          <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.5" fill="var(--butter)" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line key={a} x1="12" y1="2.5" x2="12" y2="4.5" transform={`rotate(${a} 12 12)`} />
            ))}
          </g>
        )}
      </svg>
    </motion.button>
  );
}
