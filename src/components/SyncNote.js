"use client";

import Link from "next/link";
import { supabaseConfigured } from "@/lib/supabase";

// The small "where is this saved" line under the grocery list and meal plan.
export default function SyncNote({ sync, what = "list", className = "" }) {
  if (!supabaseConfigured || sync.user === undefined) return <span className={className}>Your {what} stays on this device.</span>;
  if (sync.user)
    return (
      <span className={className}>
        {sync.synced ? "✓ Synced to your account, so it's on every device you sign in on." : "Syncing to your account…"}
      </span>
    );
  const next = typeof window === "undefined" ? "/account" : `/account?next=${encodeURIComponent(window.location.pathname)}`;
  return (
    <span className={className}>
      Your {what} stays on this device.{" "}
      <Link href={next} className="font-semibold text-pink-deep underline">
        Sign in
      </Link>{" "}
      to keep it on every device.
    </span>
  );
}
