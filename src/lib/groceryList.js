import { parseIngredientLine } from "@/lib/recipe";

export const MAX_ITEMS = 80;
export const MAX_ITEM_CHARS = 100;

// Turns a pasted grocery list into { amount, unit, item } rows. Takes one
// item per line (or a single comma-separated line), and drops what notes
// apps add: bullets, "1.", "[ ]", "☐", "- [x]". "Milk x2" and "2x milk"
// become an amount of 2.
export function parseGroceryList(text = "") {
  const lines = String(text).split(/\r?\n/);
  const parts = lines.filter((l) => l.trim()).length === 1 ? lines.join(",").split(/\s*,\s*/) : lines;
  const seen = new Set();
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
    const key = `${row.amount}|${row.unit}|${row.item.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}
