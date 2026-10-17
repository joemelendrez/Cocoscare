"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

const SPRING = { type: "spring", stiffness: 420, damping: 34 };

// A button that opens a sticker-style picker in place of a native <select>:
// a bottom sheet on phones, a centered card on bigger screens. groups is
// [{ label, options: [{ value, label, hint? }] }].
export default function PickerSheet({ value, onChange, groups, title, label, className = "" }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const button = useRef(null);
  const titleId = useId();
  const current = groups.flatMap((g) => g.options).find((o) => o.value === value);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function close() {
    setOpen(false);
    button.current?.focus();
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${current?.label || "choose"}`}
        className={`flex items-center justify-between gap-2 text-left ${className}`}
      >
        <span className="truncate">{current?.label || "Choose"}</span>
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
          <path
            d="M6 9.5 12 15l6-5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <Sheet titleId={titleId} title={title} onClose={close}>
                {groups.map((g) => (
                  <div key={g.label} className="mt-4 first:mt-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink/55">{g.label}</p>
                    <ul className="mt-2 grid grid-cols-2 gap-2">
                      {g.options.map((o) => {
                        const on = o.value === value;
                        return (
                          <li key={o.value}>
                            <button
                              type="button"
                              onClick={() => {
                                onChange(o.value);
                                close();
                              }}
                              aria-pressed={on}
                              className={`flex w-full items-center justify-between gap-2 rounded-2xl border-[2.5px] border-ink px-3 py-2.5 text-left font-semibold transition-transform active:scale-95 ${
                                on
                                  ? "bg-pink text-paper shadow-[3px_3px_0_var(--shadow)]"
                                  : "bg-paper hover:bg-butter hover:text-[#161016]"
                              }`}
                            >
                              <span className="truncate capitalize">{o.label}</span>
                              {o.hint && (
                                <span className={`shrink-0 whitespace-nowrap text-sm ${on ? "text-paper/80" : "text-ink/50"}`}>
                                  {o.hint}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </Sheet>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

function Sheet({ titleId, title, onClose, children }) {
  const panel = useRef(null);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector("[aria-pressed='true']")?.focus() || panel.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const items = panel.current.querySelectorAll("button");
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-[#161016]/55 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-[2rem] border-[3px] border-b-0 border-ink bg-paper p-5 pb-8 outline-none sm:max-w-lg sm:rounded-[2rem] sm:border-b-[3px] sm:pb-5 sm:shadow-[6px_6px_0_var(--pink)]"
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={SPRING}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ink/20 sm:hidden" aria-hidden="true" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-display text-2xl tracking-wide">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-paper text-xl font-bold hover:bg-blush"
          >
            ×
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
