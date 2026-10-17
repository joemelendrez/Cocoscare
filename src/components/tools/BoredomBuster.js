"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AGES, matchActivities } from "@/lib/activities";

const PLACES = [
  ["any", "Anywhere"],
  ["inside", "Inside"],
  ["outside", "Outside"],
];
const MESS = ["No mess", "A little mess", "Messy"];
const CARD_COLORS = ["bg-butter", "bg-mint", "bg-periwinkle", "bg-blush"];

function Pills({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(([key, text, sub]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={`rounded-full border-[2.5px] border-ink px-4 py-1.5 font-semibold ${value === key ? "bg-ink text-paper" : "bg-paper hover:bg-butter"}`}
        >
          {text}
          {sub && <span className="ml-1 text-xs opacity-70">{sub}</span>}
        </button>
      ))}
    </div>
  );
}

// The free Boredom Buster: pick an age and a place, get one easy idea at
// a time with what you need and how to do it.
export default function BoredomBuster() {
  const [age, setAge] = useState("toddler");
  const [where, setWhere] = useState("any");
  const [messy, setMessy] = useState(true);
  const [pick, setPick] = useState(null);
  const [seen, setSeen] = useState([]);
  const matches = matchActivities({ age, where, messy });

  function next() {
    const fresh = matches.filter((a) => !seen.includes(a.title) && a.title !== pick?.title);
    const pool = fresh.length ? fresh : matches.filter((a) => a.title !== pick?.title);
    const choice = pool[Math.floor(Math.random() * pool.length)] || matches[0] || null;
    setPick(choice);
    if (choice) setSeen((s) => (fresh.length ? [...s, choice.title] : [choice.title]));
  }

  const reset = (fn) => (v) => {
    fn(v);
    setPick(null);
    setSeen([]);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="rounded-[2rem] border-[3px] border-ink bg-paper p-5 shadow-[6px_6px_0_var(--shadow)] sm:p-6">
        <h2 className="font-display text-2xl tracking-wide">Who&rsquo;s bored?</h2>
        <div className="mt-3">
          <Pills label="Age" options={AGES.map((a) => [a.key, a.label, a.sub])} value={age} onChange={reset(setAge)} />
        </div>
        <h3 className="mt-5 font-display text-lg tracking-wide">Where?</h3>
        <div className="mt-2">
          <Pills label="Where" options={PLACES} value={where} onChange={reset(setWhere)} />
        </div>
        <label className="mt-5 flex cursor-pointer items-center gap-3 font-semibold">
          <input
            type="checkbox"
            checked={!messy}
            onChange={(e) => reset(setMessy)(!e.target.checked)}
            className="h-5 w-5 accent-[var(--pink)]"
          />
          I can&rsquo;t handle a mess today
        </label>
        <button
          type="button"
          onClick={next}
          disabled={!matches.length}
          className="mt-6 w-full rounded-full border-[3px] border-ink bg-pink px-6 py-3 font-display text-2xl tracking-wide text-paper shadow-[4px_4px_0_var(--shadow)] transition-transform active:translate-y-0.5 disabled:opacity-50"
        >
          {pick ? "Give me another 🎲" : "Give me an idea 🎲"}
        </button>
        <p className="mt-2 text-center text-xs font-semibold text-ink/55">{matches.length} ideas fit</p>
      </div>

      <div className="relative min-h-[18rem]">
        <AnimatePresence mode="wait" initial={false}>
          {pick ? (
            <motion.article
              key={pick.title}
              initial={{ opacity: 0, rotate: -3, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, rotate: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 3, y: -10 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`h-full rounded-[2rem] border-[3px] border-ink p-6 shadow-[6px_6px_0_var(--pink)] sm:p-8 ${CARD_COLORS[pick.title.length % CARD_COLORS.length]}`}
            >
              <span className="text-6xl" aria-hidden>
                {pick.emoji}
              </span>
              <h2 className="mt-3 font-display text-4xl leading-tight tracking-wide">{pick.title}</h2>
              <p className="mt-1 text-sm font-bold uppercase tracking-wider text-ink/60">
                {pick.where.length > 1 ? "Inside or out" : pick.where[0] === "inside" ? "Inside" : "Outside"} · {MESS[pick.mess]}
              </p>
              <h3 className="mt-5 font-display text-lg tracking-wide">You need</h3>
              <p className="font-medium">{pick.need}</p>
              <h3 className="mt-3 font-display text-lg tracking-wide">How</h3>
              <p className="font-medium">{pick.how}</p>
            </motion.article>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid h-full place-items-center rounded-[2rem] border-[3px] border-dashed border-ink/30 p-8 text-center"
            >
              <p className="font-display text-2xl tracking-wide text-ink/50">Tap the button for an idea ✨</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="text-xs text-ink/55 lg:col-span-2">
        Stay close for anything with water, and check that toys and supplies are right for your child&rsquo;s age.
      </p>
    </div>
  );
}
