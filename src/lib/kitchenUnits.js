import { formatAmount, parseAmount, parseIngredientLine } from "@/lib/recipe";

// Kitchen units in a common base: millilitres for volume, grams for weight.
export const VOLUME = [
  { key: "tsp", label: "teaspoons", short: "tsp", base: 4.92892 },
  { key: "tbsp", label: "tablespoons", short: "tbsp", base: 14.7868 },
  { key: "floz", label: "fluid ounces", short: "fl oz", base: 29.5735 },
  { key: "cup", label: "cups", short: "cup", base: 236.588 },
  { key: "pint", label: "pints", short: "pint", base: 473.176 },
  { key: "quart", label: "quarts", short: "qt", base: 946.353 },
  { key: "gallon", label: "gallons", short: "gal", base: 3785.41 },
  { key: "ml", label: "millilitres", short: "ml", base: 1, metric: true },
  { key: "l", label: "litres", short: "L", base: 1000, metric: true },
];

export const WEIGHT = [
  { key: "oz", label: "ounces", short: "oz", base: 28.3495 },
  { key: "lb", label: "pounds", short: "lb", base: 453.592 },
  { key: "g", label: "grams", short: "g", base: 1, metric: true },
  { key: "kg", label: "kilograms", short: "kg", base: 1000, metric: true },
];

export const ALL_UNITS = [...VOLUME, ...WEIGHT];

// Metric rounds to whole numbers (or 2 places for litres and kilos); US
// units read like a cook would measure them ("1½").
export function showAmount(n, unit) {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (unit.metric) return unit.base >= 1000 ? String(Math.round(n * 100) / 100) : String(Math.round(n));
  if (n >= 100) return String(Math.round(n));
  return formatAmount(n) || String(Math.round(n * 100) / 100);
}

// Every other unit of the same kind, with a sensible amount (dropping
// ones that would read "0" or a silly 300 teaspoons).
export function convertAll(amount, fromKey) {
  const from = ALL_UNITS.find((u) => u.key === fromKey);
  if (!from || !(amount > 0)) return [];
  const family = VOLUME.includes(from) ? VOLUME : WEIGHT;
  const base = amount * from.base;
  return family
    .filter((u) => u.key !== fromKey)
    .map((u) => ({ unit: u, value: base / u.base }))
    .filter(({ value }) => value >= 0.1 && value < 1000);
}

export function readAmount(text) {
  const t = String(text).trim();
  if (!t) return null;
  const n = parseAmount(t);
  if (n != null) return n;
  const f = Number(t);
  return Number.isFinite(f) ? f : null;
}

// "2 cups flour" × 1.5 → "3 cups flour". Lines without an amount (and
// headings like "For the sauce:") stay as they are.
export function scaleLine(line, factor) {
  const text = line.trim();
  if (!text) return "";
  const row = parseIngredientLine(text);
  if (!row || row.amount == null) return text;
  const next = row.amount * factor;
  const many = next > 1;
  // "2 cups" halved reads "1 cup", "1 egg" doubled reads "2 eggs".
  const unit = row.unit && countWord(row.unit, many);
  let item = row.item;
  const words = item.split(" ");
  if (!row.unit && many !== row.amount > 1 && words.length <= 3 && !/[,(]/.test(item)) {
    item = [...words.slice(0, -1), countWord(words.at(-1), many)].join(" ");
  }
  return [formatAmount(next), unit, item].filter(Boolean).join(" ");
}

const SHORT_UNITS = /^(tsps?|tbsps?|oz|lbs?|qt|gal|pt|ml|kg|pinch|dash)$/i;

// Plural or singular for words that count ("cup", "egg"); short units
// like "tsp" and "oz" don't change.
function countWord(word, many) {
  if (word.length <= 2 || /[^a-z]/i.test(word) || SHORT_UNITS.test(word)) return word;
  if (many) {
    if (/s$/i.test(word)) return word;
    if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + "ies";
    return /(tomato|potato)$/i.test(word) ? word + "es" : word + "s";
  }
  if (/ies$/i.test(word)) return word.slice(0, -3) + "y";
  if (/oes$/i.test(word)) return word.slice(0, -2);
  if (/[^s]s$/i.test(word)) return word.slice(0, -1);
  return word;
}

export const fToC = (f) => Math.round(((f - 32) * 5) / 9);
export const cToF = (c) => Math.round((c * 9) / 5 + 32);
