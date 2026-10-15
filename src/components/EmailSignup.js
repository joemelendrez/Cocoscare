"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "@/components/Doodles";

// "Get new posts by email": a sticker card that adds the address to the
// Mailchimp list through /api/subscribe. `source` tags where it came from
// (a post's category, or "home"). Only rendered once Mailchimp is set up.
export default function EmailSignup({ source, title = "Get my new recipes and finds by email", blurb }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState({ status: "idle", error: "" });

  async function submit(e) {
    e.preventDefault();
    if (state.status === "sending") return;
    setState({ status: "sending", error: "" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't sign you up just now. Try again soon.");
      setState({ status: "done", error: "" });
    } catch (err) {
      setState({ status: "idle", error: err.message });
    }
  }

  return (
    <div className="sticker rounded-[2rem] bg-butter p-6 text-ink sm:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {state.status === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4"
          >
            <Heart className="h-12 w-12 shrink-0 animate-wiggle" />
            <div>
              <p className="font-display text-2xl tracking-wide">You&rsquo;re on the list!</p>
              <p className="mt-1 font-medium">New posts will land in your inbox. No spam, just the good stuff.</p>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} exit={{ opacity: 0, scale: 0.95 }}>
            <p className="font-display text-2xl leading-tight tracking-wide sm:text-3xl">{title}</p>
            <p className="mt-2 font-medium">
              {blurb || "Easy toddler recipes, mom finds that are worth it, and outings the kids actually enjoy."}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor={`signup-${source}`}>
                Email address
              </label>
              <input
                id={`signup-${source}`}
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 rounded-full border-[3px] border-ink bg-paper px-5 py-3 text-lg text-ink outline-none focus:shadow-[3px_3px_0_var(--pink)]"
              />
              {/* Hidden from people; bots fill it in, and the server then ignores the signup. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />
              <button
                type="submit"
                disabled={state.status === "sending"}
                className="lift shrink-0 rounded-full border-[3px] border-ink bg-ink px-6 py-3 font-display text-lg tracking-wide text-paper shadow-[4px_4px_0_var(--pink)] disabled:opacity-60"
              >
                {state.status === "sending" ? "Signing you up…" : "Sign me up"}
              </button>
            </div>
            {state.error && <p className="mt-3 font-semibold text-pink-deep">{state.error}</p>}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
