import { createHash } from "node:crypto";
import { ingredientText } from "@/lib/recipe";

// Instacart Developer Platform: turns a recipe into a shoppable Instacart
// page (the reader picks a store near them, like Walmart, Costco or Kroger,
// and the ingredients are already matched). Docs:
// https://docs.instacart.com/developer_platform_api/api/products/create_recipe_page
export const instacartConfigured = Boolean(process.env.INSTACART_API_KEY);
const BASE = (process.env.INSTACART_API_URL || "https://connect.instacart.com").replace(/\/$/, "");

// Instacart only matches quantities in its own units, and an unknown unit
// breaks the match, so anything not on this map goes without a measurement.
const UNIT_MAP = {
  cup: "cup",
  cups: "cup",
  c: "cup",
  tbsp: "tablespoon",
  tablespoon: "tablespoon",
  tablespoons: "tablespoon",
  tsp: "teaspoon",
  teaspoon: "teaspoon",
  teaspoons: "teaspoon",
  oz: "ounce",
  ounce: "ounce",
  ounces: "ounce",
  lb: "pound",
  lbs: "pound",
  pound: "pound",
  pounds: "pound",
  g: "gram",
  gram: "gram",
  grams: "gram",
  kg: "kilogram",
  ml: "milliliter",
  l: "liter",
  liter: "liter",
  liters: "liter",
  pint: "pint",
  pints: "pint",
  quart: "quart",
  quarts: "quart",
  can: "can",
  cans: "can",
  clove: "clove",
  cloves: "clove",
  slice: "slice",
  slices: "slice",
  package: "package",
  packages: "package",
  pkg: "package",
  bunch: "bunch",
};

function ingredientsFor(recipe) {
  return (recipe.ingredients || [])
    .filter((i) => i?.item)
    .map((i) => {
      const raw = String(i.unit || "")
        .toLowerCase()
        .replace(/\.$/, "");
      const unit = raw ? UNIT_MAP[raw] : "each";
      const qty = Number(i.amount);
      const line = { name: i.item, display_text: ingredientText(i) };
      if (qty > 0 && unit) line.measurements = [{ quantity: qty, unit }];
      return line;
    });
}

// Instacart asks partners to reuse a page until the recipe changes, so
// links are kept per recipe version (a hash of what goes into the page).
const cache = new Map();

export async function instacartRecipeLink(recipe, { postUrl, author }) {
  const ingredients = ingredientsFor(recipe);
  if (!ingredients.length) return { error: "no ingredients" };
  const total = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0);
  const body = {
    title: recipe.title,
    image_url: recipe.image_url || undefined,
    author: author || undefined,
    servings: recipe.servings || undefined,
    cooking_time: total || undefined,
    external_reference_id: String(recipe.id),
    expires_in: 365,
    instructions: (recipe.steps || []).map((s) => s.text).filter(Boolean),
    ingredients,
    landing_page_configuration: { partner_linkback_url: postUrl, enable_pantry_items: true },
  };
  const key = createHash("sha256").update(JSON.stringify(body)).digest("hex");
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return { url: hit.url };

  const res = await fetch(`${BASE}/idp/v1/products/recipe`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.INSTACART_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.products_link_url) return { error: data?.error?.message || `Instacart ${res.status}` };
  // Comfortably inside the page's 365-day life.
  cache.set(key, { url: data.products_link_url, expires: Date.now() + 30 * 24 * 3600 * 1000 });
  return { url: data.products_link_url };
}
