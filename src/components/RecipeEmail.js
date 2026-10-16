"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "@/components/Doodles";

// The recipe card's "Email me this" form: sends the card to the reader
// (/api/email-recipe) and, with the box ticked, adds them to the list.
// `listOpen` is whether the Mailchimp list is set up; without it there's
// no box to tick.
export default function RecipeEmail({ slug, recipeId, anchor, listOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [join, setJoin] = useState(true);
  const [state, setState] = useState({ status: "idle", error: "" });

  async function submit(e) {
    e.preventDefault();
    if (state.status === "sending") return;
    setState({ status: "sending", error: "" });
    try {
      const res = await fetch("/api/email-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, slug, recipeId, anchor, subscribe: listOpen && join, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't send it just now. Try again soon.");
      setState({ status: "done", error: "", subscribed: data.subscribed });
    } catch (err) {
      setState({ status: "idle", error: err.message });
    }
  }

  const fieldId = `recipe-email-${recipeId}`;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="no-print overflow-hidden"
    >
      <div className="mt-4 rounded-[1.5rem] border-[2.5px] border-ink bg-paper p-4 text-ink sm:max-w-xl">
        <AnimatePresence mode="wait" initial={false}>
          {state.status === "done" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3"
            >
              <Heart className="h-9 w-9 shrink-0 animate-wiggle" />
              <div className="flex-1">
                <p className="font-display text-xl tracking-wide">Sent! Check your inbox.</p>
                <p className="text-sm font-medium text-ink/70">
                  {state.subscribed ? "You're on the list for new recipes too." : "It can take a minute to show up."}
                </p>
              </div>
              <button type="button" onClick={onClose} className="font-semibold text-ink/60 underline-offset-2 hover:underline">
                Close
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} exit={{ opacity: 0 }}>
              <label htmlFor={fieldId} className="font-display text-lg tracking-wide">
                Send this recipe to your inbox
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id={fieldId}
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-1 rounded-full border-[2.5px] border-ink bg-paper px-4 py-2 text-ink outline-none focus:shadow-[3px_3px_0_var(--pink)]"
                />
                {/* Hidden from people; bots fill it in, and the server then ignores the request. */}
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
                  className="shrink-0 rounded-full border-[2.5px] border-ink bg-ink px-5 py-2 font-display tracking-wide text-paper shadow-[3px_3px_0_var(--pink)] disabled:opacity-60"
                >
                  {state.status === "sending" ? "Sending…" : "Send it"}
                </button>
              </div>
              {listOpen && (
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={join}
                    onChange={(e) => setJoin(e.target.checked)}
                    className="h-4 w-4 accent-[var(--pink)]"
                  />
                  Send me Coco&rsquo;s new recipes too
                </label>
              )}
              {state.error && <p className="mt-2 text-sm font-semibold text-pink-deep">{state.error}</p>}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
