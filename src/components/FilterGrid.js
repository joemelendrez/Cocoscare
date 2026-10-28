"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { PickCard, PostCard } from "@/components/Cards";
import { Heart } from "@/components/Doodles";
import { CATEGORIES, SHOP_SECTIONS } from "@/lib/content";

function Chips({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap justify-center gap-2.5">
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.key)}
            className="relative rounded-full border-[2.5px] border-ink px-5 py-2 font-display text-lg tracking-wide transition-transform hover:-translate-y-0.5"
          >
            {active && (
              <motion.span
                layoutId={`chip-${label}`}
                className="absolute inset-[-2.5px] rounded-full border-[2.5px] border-ink bg-pink shadow-[3px_3px_0_var(--shadow)]"
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
              />
            )}
            <span className={`relative ${active ? "text-paper" : ""}`}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Grid({ items, render, className }) {
  return (
    <motion.div layout className={className}>
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            layout
            key={item.slug || item.name}
            initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 4 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="h-full"
          >
            {render(item)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

export function BlogGrid({ posts }) {
  const [cat, setCat] = useState("all");
  const options = [{ key: "all", label: "All" }, ...CATEGORIES.map((c) => ({ key: c.key, label: c.label }))];
  const items = cat === "all" ? posts : posts.filter((p) => p.category === cat);
  return (
    <>
      <Chips options={options} value={cat} onChange={setCat} label="Blog categories" />
      {!items.length && <p className="mt-12 text-center text-lg text-ink/60">Nothing here yet. Check back soon!</p>}
      <Grid
        items={items}
        render={(post) => <PostCard post={post} />}
        className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      />
    </>
  );
}

export function ShopGrid({ products }) {
  const [section, setSection] = useState("all");
  const items = section === "all" ? products : products.filter((p) => p.section === section);
  return (
    <>
      <Chips options={SHOP_SECTIONS} value={section} onChange={setSection} label="Shop sections" />
      {!items.length && <p className="mt-12 text-center text-lg text-ink/60">Nothing here yet. Check back soon!</p>}
      <Grid
        items={items}
        render={(pick) => <PickCard pick={pick} />}
        className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
      />
    </>
  );
}

const TIMES = [
  { key: "all", label: "Any time" },
  { key: "20", label: "20 min or less" },
  { key: "45", label: "45 min or less" },
];

function RecipeTile({ recipe }) {
  return (
    <Link href={recipe.href} className="sticker lift group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-paper">
      <div className="dots-ink relative grid aspect-[4/3] place-items-center overflow-hidden border-b-[3px] border-ink bg-butter">
        {recipe.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase storage URLs, sized by the uploader
          <img
            src={recipe.image_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="follow-theme grid h-20 w-20 place-items-center rounded-full border-[3px] border-ink bg-paper">
            <Heart className="h-10 w-10" />
          </span>
        )}
        {recipe.minutes > 0 && (
          <span className="follow-theme absolute left-4 top-4 rounded-full border-2 border-ink bg-paper px-3 py-0.5 text-sm font-semibold">
            {recipe.minutes} min
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl leading-tight tracking-wide">{recipe.title}</h3>
        {recipe.summary && <p className="mt-2 line-clamp-3 text-ink/70">{recipe.summary}</p>}
        <p className="mt-auto pt-4 text-sm font-semibold text-ink/60">
          Serves {recipe.servings} · {recipe.ingredients.length} ingredients
        </p>
      </div>
    </Link>
  );
}

// Every published recipe; each card opens the recipe inside its post.
export function RecipeGrid({ recipes }) {
  const [time, setTime] = useState("all");
  const [query, setQuery] = useState("");
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const items = recipes.filter((r) => {
    if (time !== "all" && !(r.minutes > 0 && r.minutes <= Number(time))) return false;
    if (!words.length) return true;
    const text = [r.title, r.summary, ...r.ingredients.map((i) => i.item)].join(" ").toLowerCase();
    return words.every((w) => text.includes(w));
  });
  return (
    <>
      <label className="mx-auto mb-6 block max-w-xl">
        <span className="sr-only">Search recipes</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or ingredient, like banana"
          className="w-full rounded-full border-[3px] border-ink bg-paper px-6 py-3 text-lg shadow-[4px_4px_0_var(--shadow)] outline-none focus:border-pink"
        />
      </label>
      <Chips options={TIMES} value={time} onChange={setTime} label="Recipe time" />
      {!items.length && (
        <p className="mt-12 text-center text-lg text-ink/60">
          {recipes.length ? "No recipes match that. Try another word." : "Recipes show up here once they're in a post. Check back soon!"}
        </p>
      )}
      <Grid
        items={items}
        render={(recipe) => <RecipeTile recipe={recipe} />}
        className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      />
    </>
  );
}
