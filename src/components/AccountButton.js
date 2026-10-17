"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useUser } from "@/lib/account";
import { supabaseConfigured } from "@/lib/supabase";

// Round "My account" button in the header; butter with a heart once signed in.
export default function AccountButton({ className = "" }) {
  const user = useUser();
  if (!supabaseConfigured) return null;
  return (
    <motion.span whileTap={{ scale: 0.86 }} className={`shrink-0 ${className}`}>
      <Link
        href="/account"
        aria-label={user ? "My account (signed in)" : "Sign in or join"}
        title={user ? "My account" : "Sign in"}
        className={`relative grid h-12 w-12 place-items-center rounded-full border-[2.5px] border-ink text-ink shadow-[3px_3px_0_var(--shadow)] ${
          user ? "bg-butter" : "bg-paper"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <circle cx="12" cy="8.5" r="3.8" fill={user ? "currentColor" : "none"} />
          <path d="M4.8 20c.8-3.6 3.6-5.6 7.2-5.6s6.4 2 7.2 5.6" />
        </svg>
        {user && (
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border-2 border-ink bg-pink text-[10px] text-paper">
            ♥
          </span>
        )}
      </Link>
    </motion.span>
  );
}
