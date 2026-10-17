// The Grocery List tool's saved list (this device only), shared so other
// tools like the meal planner can add to it.
export const GROCERY_KEY = "coco-grocery-list";

export function loadGroceryList() {
  try {
    return JSON.parse(localStorage.getItem(GROCERY_KEY) || "null") || null;
  } catch {
    return null;
  }
}

// Appends lines to the saved list; the Grocery List tool merges repeats.
export function addToGroceryList(lines) {
  const saved = loadGroceryList() || {};
  const text = (saved.text || "").replace(/\s+$/, "");
  const more = lines.filter(Boolean).join("\n");
  try {
    localStorage.setItem(GROCERY_KEY, JSON.stringify({ ...saved, text: text ? `${text}\n${more}` : more }));
    return true;
  } catch {
    return false;
  }
}
