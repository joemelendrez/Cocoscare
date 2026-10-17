"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CategoryIcon } from "@/components/Doodles";
import { formatMinutes } from "@/lib/recipe";

const PAGE = 6;

// Every word typed has to show up in the title, the summary or an
// ingredient, so "chicken rice" finds dishes with both.
function matches(recipe, words) {
  const hay = [recipe.title, recipe.summary, ...recipe.ingredients.map((i) => i.item)].join(" ").toLowerCase();
  return words.every((w) => hay.includes(w));
}

// The Grocery List tool's recipe search: find one of Coco's recipes and
// add all its ingredients to the list in one tap.
export default function RecipeFinder({ recipes, added, onAdd }) {
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const found = recipes.filter((r) => matches(r, words));

  return (
    <section id="recipes" className="mt-14 scroll-mt-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl tracking-wide sm:text-4xl">Add from my recipes</h2>
          <p className="mt-1 font-medium text-ink/70">
            Search a dish or something in your fridge, then add its ingredients to your list.
          </p>
        </div>
        <label className="relative block sm:w-80">
          <span className="sr-only">Search recipes</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Try “chicken” or “muffins”"
            className="w-full rounded-full border-[2.5px] border-ink bg-paper py-2.5 pl-11 pr-4 font-medium outline-none placeholder:text-ink/40 focus:shadow-[3px_3px_0_var(--pink)]"
          />
          <svg viewBox="0 0 24 24" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="var(--ink)" strokeWidth="2.5" />
            <path d="m15.5 15.5 5 5" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </label>
      </div>

      {found.length === 0 ? (
        <p className="mt-6 rounded-2xl border-2 border-dashed border-ink/30 px-4 py-10 text-center font-medium text-ink/60">
          No recipes with &ldquo;{query}&rdquo; yet. Try another word.
        </p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {found.slice(0, shown).map((r) => {
            const isAdded = added.has(r.slug);
            return (
              <motion.li
                key={r.slug}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex overflow-hidden rounded-[1.75rem] border-[3px] border-ink bg-paper shadow-[5px_5px_0_var(--ink)] sm:flex-col"
              >
                <div className="dots-ink relative grid w-28 shrink-0 place-items-center border-r-[3px] border-ink bg-butter sm:aspect-[16/10] sm:w-auto sm:border-b-[3px] sm:border-r-0">
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Supabase storage URLs, sized by the uploader
                    <img src={r.image_url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-14 w-14 place-items-center rounded-full border-[3px] border-ink bg-paper sm:h-16 sm:w-16">
                      <CategoryIcon name="whisk" className="h-9 w-9 sm:h-10 sm:w-10" />
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <h3 className="font-display text-xl leading-tight tracking-wide">{r.title}</h3>
                  <p className="mt-1 text-sm font-semibold text-ink/60">
                    {r.ingredients.length} {r.ingredients.length === 1 ? "ingredient" : "ingredients"}
                    {r.minutes > 0 && ` · ${formatMinutes(r.minutes)}`}
                    {r.servings && ` · serves ${r.servings}`}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => onAdd(r)}
                      disabled={isAdded}
                      className={`rounded-full border-[2.5px] border-ink px-4 py-1.5 font-display tracking-wide ${isAdded ? "bg-paper text-ink/60" : "bg-mint shadow-[3px_3px_0_var(--ink)]"}`}
                    >
                      {isAdded ? "Added ✓" : "Add to my list"}
                    </button>
                    {r.href && (
                      <a href={r.href} className="font-display tracking-wide text-pink-deep hover:underline">
                        See recipe →
                      </a>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
      {found.length > shown && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShown((n) => n + PAGE)}
            className="rounded-full border-[2.5px] border-ink bg-butter px-5 py-2 font-display text-lg tracking-wide"
          >
            Show more recipes ({found.length - shown})
          </button>
        </div>
      )}
    </section>
  );
}
