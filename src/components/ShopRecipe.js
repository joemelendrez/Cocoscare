"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ingredientText } from "@/lib/recipe";
import { walmartUrl } from "@/lib/walmart";

// The recipe card's "Shop ingredients" panel: Instacart (one link, the
// whole recipe in the cart at a store near the reader), Walmart one item
// at a time, and a plain list to copy into any grocery app.
export default function ShopRecipe({ slug, recipeId, anchor, ingredients, scale, instacart, walmartLink }) {
  const [copied, setCopied] = useState(false);
  const lines = ingredients.filter((i) => i?.item);

  async function copyList() {
    const text = lines.map((i) => `• ${ingredientText(i, scale)}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const instacartHref = `/api/shop/instacart?${new URLSearchParams({ slug, recipe: recipeId, anchor: anchor || "recipe" })}`;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="no-print overflow-hidden"
    >
      <div className="mt-4 rounded-[1.5rem] border-[2.5px] border-ink bg-paper p-4 text-ink sm:max-w-xl">
        {instacart && (
          <>
            <a
              href={instacartHref}
              target="_blank"
              rel="noopener sponsored"
              className="flex items-center justify-between gap-3 rounded-2xl border-[2.5px] border-ink bg-mint px-4 py-3 shadow-[3px_3px_0_var(--ink)]"
            >
              <span>
                <span className="block font-display text-lg tracking-wide">Get it delivered with Instacart</span>
                <span className="block text-sm font-medium text-ink/70">
                  Every ingredient in your cart. Pick Walmart, Costco, Kroger or a store near you.
                </span>
              </span>
              <span aria-hidden className="font-display text-2xl">
                →
              </span>
            </a>
            <p className="mt-4 font-display text-lg tracking-wide">Or shop Walmart, item by item</p>
          </>
        )}
        {!instacart && <p className="font-display text-lg tracking-wide">Shop it at Walmart</p>}
        <ul className="mt-2 divide-y-2 divide-ink/10">
          {lines.map((ing, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-1.5">
              <span className="min-w-0 text-sm font-medium">{ingredientText(ing, scale)}</span>
              <a
                href={walmartUrl(ing.item, walmartLink)}
                target="_blank"
                rel={`noopener${walmartLink ? " sponsored" : ""}`}
                className="shrink-0 rounded-full border-2 border-ink px-3 py-0.5 text-sm font-semibold hover:bg-butter"
              >
                Walmart ↗
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copyList}
            className="rounded-full border-[2.5px] border-ink bg-butter px-4 py-1.5 font-display tracking-wide"
          >
            {copied ? "Copied!" : "Copy shopping list"}
          </button>
          <span className="text-xs font-medium text-ink/60">Paste it into any grocery app or your notes.</span>
        </div>
        {(instacart || walmartLink) && (
          <p className="mt-3 text-xs text-ink/55">We may earn a small commission when you shop through these links.</p>
        )}
      </div>
    </motion.div>
  );
}
