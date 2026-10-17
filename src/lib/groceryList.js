import { parseIngredientLine } from "@/lib/recipe";

export const MAX_ITEMS = 80;
export const MAX_ITEM_CHARS = 100;

// Turns a pasted grocery list into { amount, unit, item } rows. Takes one
// item per line (or a single comma-separated line), and drops what notes
// apps add: bullets, "1.", "[ ]", "☐", "- [x]". "Milk x2" and "2x milk"
// become an amount of 2. The same item twice becomes one row.
export function parseGroceryList(text = "") {
  const lines = String(text).split(/\r?\n/);
  const parts = lines.filter((l) => l.trim()).length === 1 ? lines.join(",").split(/\s*,\s*/) : lines;
  const seen = new Map();
  const out = [];
  for (const raw of parts) {
    let line = raw
      .replace(/^\s*(?:[-*•·◦▪]\s*)?(?:\[[ xX✓✔]?\]|[☐☑✅✓✔])?\s*/, "")
      .replace(/^\s*\d{1,3}[.)]\s+/, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!line) continue;
    let times = null;
    const suffix = line.match(/^(.*?)\s*(?:x|×)\s*(\d{1,3})$/i) || line.match(/^(.*?)\s*\((\d{1,3})\)$/);
    const prefix = line.match(/^(\d{1,3})\s*(?:x|×)\s+(.*)$/i);
    if (suffix) [line, times] = [suffix[1], Number(suffix[2])];
    else if (prefix) [times, line] = [Number(prefix[1]), prefix[2]];
    const row = parseIngredientLine(line.slice(0, MAX_ITEM_CHARS));
    if (!row?.item) continue;
    if (times) row.amount = (row.amount || 1) * times;
    const key = itemKey(row);
    const same = seen.get(key);
    if (same) {
      // The same thing twice (two recipes both want milk): one row, amounts added.
      if (row.amount != null) same.amount = (same.amount || 0) + row.amount;
      same.unit = unitFor(same.unit, same.amount);
      continue;
    }
    seen.set(key, row);
    out.push(row);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

const UNIT_KEYS = {
  c: "cup",
  tablespoon: "tbsp",
  tbs: "tbsp",
  teaspoon: "tsp",
  ounce: "oz",
  lbs: "lb",
  pound: "lb",
  gram: "g",
  pkg: "package",
};

function unitKey(unit = "") {
  const u = unit.toLowerCase().replace(/\.$/, "");
  const one = u.length > 3 && u.endsWith("s") ? u.slice(0, -1) : u;
  return UNIT_KEYS[one] || UNIT_KEYS[u] || one;
}

// "Eggs" and "egg", "2 cups milk" and "1 cup milk" are the same row.
export function itemKey(row) {
  const item = row.item
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/oes$/, "o")
    .replace(/ies$/, "y")
    .replace(/([^s])s$/, "$1");
  return `${unitKey(row.unit)}|${item}`;
}

// "1 cup" + "1 cup" reads "2 cups".
const PLURAL_S = new Set("cup clove can pound ounce slice stick package pint quart gallon liter gram".split(" "));
function unitFor(unit, amount) {
  if (!unit || amount == null) return unit;
  const single = unit.toLowerCase().endsWith("s") ? unit.slice(0, -1) : unit;
  if (!PLURAL_S.has(single.toLowerCase())) return unit;
  return amount > 1 ? `${single}s` : single;
}
