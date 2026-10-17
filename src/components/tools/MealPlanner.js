"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { addToGroceryList } from "@/lib/groceryStore";
import { ingredientText } from "@/lib/recipe";

const STORE_KEY = "coco-meal-plan";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
];
const COLORS = ["bg-pink text-paper", "bg-butter", "bg-mint", "bg-periwinkle", "bg-blush", "bg-butter", "bg-mint"];

// Easy nights that need no recipe, for "Fill my week".
const EASY_NIGHTS = [
  "Taco night",
  "Breakfast for dinner",
  "Leftovers",
  "Homemade pizza",
  "Pasta and salad",
  "Soup and grilled cheese",
];

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    return saved && typeof saved === "object" ? saved : null;
  } catch {
    return null;
  }
}

// One meal: a recipe of Coco's ({ slug }) or whatever was typed ({ text }).
function Slot({ value, recipes, onChange, label, showLabel }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const recipe = value?.slug ? recipes.find((r) => r.slug === value.slug) : null;
  const q = query.trim().toLowerCase();
  const found = recipes
    .filter((r) => !q || [r.title, ...r.ingredients.map((i) => i.item)].join(" ").toLowerCase().includes(q))
    .slice(0, 6);

  function pick(next) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  if (value && !open) {
    return (
      <div className="flex items-start gap-2 rounded-2xl border-2 border-ink bg-paper px-3 py-2">
        <span className="min-w-0 flex-1">
          {showLabel && <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-ink/50">{label}</span>}
          <span className="line-clamp-2 font-semibold leading-snug">
            {recipe && <span aria-hidden>🍽️ </span>}
            {recipe?.href ? (
              <a href={recipe.href} className="hover:text-pink-deep hover:underline">
                {recipe.title}
              </a>
            ) : (
              recipe?.title || value.text
            )}
          </span>
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Clear ${label}`}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink/50 hover:bg-blush hover:text-ink"
        >
          ×
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-ink/40 px-3 py-2 text-left text-sm font-semibold text-ink/55 hover:border-ink hover:text-ink"
      >
        + {label}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-ink bg-paper p-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) pick({ text: query.trim().slice(0, 80) });
        }}
        className="flex gap-1.5"
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          aria-label={`${label}: type a meal or search recipes`}
          placeholder={recipes.length ? "Type a meal or search recipes" : "Type a meal"}
          className="min-w-0 flex-1 rounded-xl border-2 border-ink bg-paper px-3 py-1.5 text-sm font-medium outline-none focus:shadow-[2px_2px_0_var(--pink)]"
        />
        <button type="button" onClick={() => setOpen(false)} className="px-2 text-sm font-semibold text-ink/60">
          Cancel
        </button>
      </form>
      <ul className="mt-1.5 space-y-1">
        {query.trim() && (
          <li>
            <button
              type="button"
              onClick={() => pick({ text: query.trim().slice(0, 80) })}
              className="w-full rounded-xl px-2 py-1 text-left text-sm font-semibold hover:bg-butter"
            >
              Use &ldquo;{query.trim()}&rdquo;
            </button>
          </li>
        )}
        {found.map((r) => (
          <li key={r.slug}>
            <button
              type="button"
              onClick={() => pick({ slug: r.slug })}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1 text-left text-sm font-semibold hover:bg-mint"
            >
              <span aria-hidden>🍽️</span>
              <span className="min-w-0 flex-1 truncate">{r.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The free Meal Planner: a week of meals (Coco's recipes or anything
// typed), then every recipe's ingredients go to the Grocery List in one
// tap. The plan stays on this device.
export default function MealPlanner({ recipes = [] }) {
  const [plan, setPlan] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sent, setSent] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = load();
    const frame = requestAnimationFrame(() => {
      if (saved) {
        setPlan(saved.plan || {});
        setShowAll(Boolean(saved.showAll));
      }
      setLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ plan, showAll }));
    } catch {}
  }, [plan, showAll, loaded]);

  const meals = showAll ? MEALS : MEALS.filter((m) => m.key === "dinner");
  const slotKey = (day, meal) => `${day}:${meal}`;
  const setSlot = (key, value) => {
    setSent(0);
    setPlan((p) => {
      const next = { ...p };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  };

  const planned = Object.entries(plan).filter(([k]) => meals.some((m) => k.endsWith(`:${m.key}`)));
  const chosen = planned.map(([, v]) => (v.slug ? recipes.find((r) => r.slug === v.slug) : null)).filter(Boolean);

  // Empty dinners get a recipe nobody's had yet this week, or an easy night.
  function fillWeek() {
    const used = new Set(chosen.map((r) => r.slug));
    const pool = [...recipes.filter((r) => !used.has(r.slug))].sort(() => Math.random() - 0.5);
    const easy = [...EASY_NIGHTS].sort(() => Math.random() - 0.5);
    setPlan((p) => {
      const next = { ...p };
      for (const day of DAYS) {
        const key = slotKey(day, "dinner");
        if (next[key]) continue;
        const r = pool.shift();
        next[key] = r ? { slug: r.slug } : { text: easy.shift() || "Leftovers" };
      }
      return next;
    });
    setSent(0);
  }

  function sendToList() {
    const lines = chosen.flatMap((r) => r.ingredients.map((i) => ingredientText(i)));
    if (addToGroceryList(lines)) setSent(lines.length);
  }

  async function copyPlan() {
    const text = DAYS.map((day) => {
      const parts = meals
        .map((m) => {
          const v = plan[slotKey(day, m.key)];
          const name = v?.slug ? recipes.find((r) => r.slug === v.slug)?.title : v?.text;
          return name ? `${showAll ? `${m.label}: ` : ""}${name}` : null;
        })
        .filter(Boolean);
      return parts.length ? `${day}: ${parts.join(", ")}` : null;
    })
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text || "No meals planned yet");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const ingredientCount = chosen.reduce((n, r) => n + r.ingredients.length, 0);

  return (
    <div>
      <div className="no-print flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={fillWeek}
          className="rounded-full border-[2.5px] border-ink bg-butter px-5 py-2 font-display text-lg tracking-wide shadow-[3px_3px_0_var(--ink)]"
        >
          🎲 Fill my week
        </button>
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-pressed={showAll}
          className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold hover:bg-blush"
        >
          {showAll ? "Dinners only" : "Add breakfast & lunch"}
        </button>
        <button
          type="button"
          onClick={copyPlan}
          className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold hover:bg-mint"
        >
          {copied ? "Copied!" : "Copy plan"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold hover:bg-periwinkle"
        >
          Print
        </button>
        {planned.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setPlan({});
              setSent(0);
            }}
            className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold hover:bg-blush"
          >
            Start over
          </button>
        )}
      </div>

      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DAYS.map((day, d) => (
          <li
            key={day}
            className="flex flex-col overflow-hidden rounded-[1.5rem] border-[3px] border-ink bg-paper shadow-[4px_4px_0_var(--ink)] print:shadow-none"
          >
            <h2 className={`border-b-[3px] border-ink px-4 py-2 font-display text-xl tracking-wide ${COLORS[d]}`}>{day}</h2>
            <div className="flex flex-1 flex-col gap-2 p-3">
              {meals.map((m) => {
                const key = slotKey(day, m.key);
                return (
                  <Slot
                    key={key}
                    label={m.label}
                    showLabel={showAll}
                    value={plan[key]}
                    recipes={recipes}
                    onChange={(v) => setSlot(key, v)}
                  />
                );
              })}
            </div>
          </li>
        ))}
        <li className="no-print flex flex-col justify-between rounded-[1.5rem] border-[3px] border-ink bg-mint p-5 shadow-[4px_4px_0_var(--pink)]">
          <div>
            <h2 className="font-display text-2xl tracking-wide">Shop the week</h2>
            <p className="mt-1 text-sm font-medium">
              {chosen.length
                ? `${chosen.length} ${chosen.length === 1 ? "recipe" : "recipes"} planned, ${ingredientCount} ingredients.`
                : "Pick a few of my recipes and their ingredients go on your grocery list in one tap."}
            </p>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <p className="text-sm font-bold">Added {sent} items ✓</p>
                <Link
                  href="/tools/grocery-list"
                  className="mt-2 inline-block rounded-full border-[2.5px] border-ink bg-paper px-4 py-2 font-display tracking-wide shadow-[3px_3px_0_var(--ink)]"
                >
                  Open my grocery list →
                </Link>
              </motion.div>
            ) : (
              <motion.button
                key="send"
                type="button"
                onClick={sendToList}
                disabled={!chosen.length}
                className="mt-4 rounded-full border-[2.5px] border-ink bg-paper px-5 py-2 font-display text-lg tracking-wide shadow-[3px_3px_0_var(--ink)] disabled:opacity-50"
              >
                Add to my grocery list
              </motion.button>
            )}
          </AnimatePresence>
        </li>
      </ol>
      <p className="no-print mt-4 text-xs text-ink/55">Your plan stays on this device.</p>
    </div>
  );
}
