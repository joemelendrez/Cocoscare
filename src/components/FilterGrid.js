"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PickCard, PostCard } from "@/components/Cards";
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
                className="absolute inset-[-2.5px] rounded-full border-[2.5px] border-ink bg-pink shadow-[3px_3px_0_var(--ink)]"
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
