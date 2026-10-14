// Pure helpers shared by the recipe card, the recipe builder and the
// recipe's structured data.

export function slugify(text = "") {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const FRACTIONS = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
];

// 1.5 → "1½", 0.333 → "⅓", 2.4 → "2.4". Amounts a cook can measure.
export function formatAmount(n) {
  if (n == null || !Number.isFinite(n) || n <= 0) return "";
  const whole = Math.floor(n + 1e-9);
  const rest = n - whole;
  if (rest < 0.04) return String(whole);
  const match = FRACTIONS.find(([v]) => Math.abs(v - rest) < 0.04);
  if (match) return `${whole || ""}${match[1]}`;
  if (rest > 0.96) return String(whole + 1);
  return String(Math.round(n * 100) / 100);
}

// "1 1/2", "1½", "0.5", "1/3" → number; anything else → null.
export function parseAmount(text) {
  if (text == null) return null;
  const s = String(text).trim();
  if (!s) return null;
  const unicode = FRACTIONS.find(([, glyph]) => s.endsWith(glyph));
  if (unicode) {
    const head = s.slice(0, -unicode[1].length).trim();
    const whole = head ? Number(head) : 0;
    return Number.isFinite(whole) ? whole + unicode[0] : null;
  }
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[2]) ? Number(frac[1]) / Number(frac[2]) : null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export function formatMinutes(min) {
  if (!min) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

const iso = (min) => (min ? `PT${Math.floor(min / 60) ? `${Math.floor(min / 60)}H` : ""}${min % 60 ? `${min % 60}M` : ""}` : undefined);

export function ingredientText(ing, scale = 1) {
  const amount = ing.amount != null ? formatAmount(ing.amount * scale) : "";
  return [amount, ing.unit, ing.item].filter(Boolean).join(" ");
}

// schema.org Recipe: what Google's recipe results and Pinterest's rich
// pins read.
export function recipeSchema(recipe, { url, author, published } = {}) {
  const total = (recipe.prep_minutes || 0) + (recipe.cook_minutes || 0);
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.summary || undefined,
    image: recipe.image_url ? [recipe.image_url] : undefined,
    author: author ? { "@type": "Person", name: author } : undefined,
    datePublished: published || undefined,
    url,
    recipeYield: `${recipe.servings} servings`,
    prepTime: iso(recipe.prep_minutes),
    cookTime: iso(recipe.cook_minutes),
    totalTime: iso(total),
    recipeIngredient: (recipe.ingredients || []).map((i) => ingredientText(i)),
    recipeInstructions: (recipe.steps || []).map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: s.text,
    })),
  };
}

const UNITS = new Set(
  "cup cups c tbsp tablespoon tablespoons tsp teaspoon teaspoons oz ounce ounces lb lbs pound pounds g gram grams kg ml l liter liters quart quarts pint pints pinch dash can cans clove cloves stick sticks slice slices package packages pkg bunch handful".split(
    " ",
  ),
);

// "2 1/2 cups flour" → { amount: 2.5, unit: "cups", item: "flour" }.
// Lets Coco paste a list from her notes instead of filling rows.
export function parseIngredientLine(line) {
  const text = line.replace(/^\s*[-*•]\s*/, "").trim();
  if (!text) return null;
  const m = text.match(/^((?:\d+\s+)?\d+\/\d+|\d*[¼½¾⅓⅔⅛⅜⅝⅞]|\d+(?:\.\d+)?)\s+(.*)$/);
  if (!m) return { amount: null, unit: "", item: text };
  const amount = parseAmount(m[1]);
  const [first, ...rest] = m[2].split(/\s+/);
  if (UNITS.has(first.toLowerCase().replace(/\.$/, "")) && rest.length) {
    return { amount, unit: first, item: rest.join(" ") };
  }
  return { amount, unit: "", item: m[2] };
}

// Splits pasted steps on blank lines or "1." / "Step 1:" numbering. A step
// that mentions a time ("bake 20 minutes") gets that as its timer.
export function parseStepsText(text) {
  const parts = text
    .split(/\n\s*\n|\n(?=\s*(?:\d+[.)]|step\s*\d+:?)\s)/i)
    .map((p) => p.replace(/^\s*(?:\d+[.)]|step\s*\d+:?)\s*/i, "").replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  const lines = parts.length > 1 ? parts : text.split("\n").map((l) => l.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "").trim()).filter(Boolean);
  return lines.map((t) => ({ text: t, timer_seconds: guessTimerSeconds(t) }));
}

export function guessTimerSeconds(text) {
  const m = text.match(/(\d+)(?:\s*(?:-|to)\s*(\d+))?\s*(minutes?|mins?|hours?|hrs?)\b/i);
  if (!m) return null;
  const n = Number(m[1]); // "18-20 minutes" starts an 18 min timer: check early
  return /^h/i.test(m[3]) ? n * 3600 : n * 60;
}
