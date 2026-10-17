"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { toggleSave, useSaves, useUser } from "@/lib/account";
import { supabaseConfigured } from "@/lib/supabase";

// Heart button that saves a recipe or post to the reader's account.
// item: { kind: "recipe" | "post", ref, title, href?, image_url? }. Signed
// out, it explains and links to /account instead.
export default function SaveButton({ item, small = false, className = "" }) {
  const user = useUser();
  const saves = useSaves();
  const [hint, setHint] = useState("");
  if (!supabaseConfigured) return null;
  const saved = Boolean(saves?.has(`${item.kind}:${item.ref}`));

  async function click() {
    if (!user) {
      setHint("signin");
      return;
    }
    const href = item.href || `${window.location.pathname}${window.location.hash}`;
    const res = await toggleSave({ ...item, href });
    setHint(res.error ? res.error : res.saved ? "saved" : "");
    if (res.saved) setTimeout(() => setHint((h) => (h === "saved" ? "" : h)), 2500);
  }

  const next = typeof window === "undefined" ? "/" : window.location.pathname;

  return (
    <span className="relative inline-flex">
      <motion.button
        type="button"
        onClick={click}
        whileTap={{ scale: 0.85 }}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${item.title} from my saves` : `Save ${item.title}`}
        className={`inline-flex items-center rounded-full border-ink ${
          small
            ? "gap-1 border-2 px-3 py-1 text-sm font-semibold"
            : "gap-2 border-[2.5px] px-4 py-1.5 font-display tracking-wide shadow-[3px_3px_0_var(--shadow)]"
        } ${saved ? (small ? "bg-butter text-ink" : "bg-pink text-paper") : "bg-paper text-ink"} ${className}`}
      >
        <motion.svg
          viewBox="0 0 24 24"
          className={small ? "h-4 w-4" : "h-5 w-5"}
          aria-hidden="true"
          animate={saved ? { scale: [1, 1.35, 1] } : { scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <path
            d="M12 20.5s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z"
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </motion.svg>
        {saved ? "Saved" : "Save"}
      </motion.button>
      <AnimatePresence>
        {hint && (
          <motion.span
            role="status"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="follow-theme absolute left-1/2 top-full z-20 mt-2 w-60 -translate-x-1/2 rounded-2xl border-[2.5px] border-ink bg-paper p-3 text-left text-sm font-semibold text-ink shadow-[3px_3px_0_var(--shadow)]"
          >
            {hint === "signin" ? (
              <>
                Sign in to save recipes and posts to your account.{" "}
                <Link href={`/account?next=${encodeURIComponent(next)}`} className="text-pink-deep underline">
                  Sign in →
                </Link>
                <button type="button" onClick={() => setHint("")} className="ml-2 text-ink/60 underline">
                  Not now
                </button>
              </>
            ) : hint === "saved" ? (
              <>
                Saved! Find it under{" "}
                <Link href="/account" className="text-pink-deep underline">
                  My account
                </Link>
                .
              </>
            ) : (
              hint
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
