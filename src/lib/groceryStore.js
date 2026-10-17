// The Grocery List tool's saved list (this device only), shared so other
// tools like the meal planner can add to it.
import { pullSynced, pushSynced } from "@/lib/account";

export const GROCERY_KEY = "coco-grocery-list";

export function loadGroceryList() {
  try {
    return JSON.parse(localStorage.getItem(GROCERY_KEY) || "null") || null;
  } catch {
    return null;
  }
}

// Appends lines to the saved list; the Grocery List tool merges repeats.
// Signed in, the lines go onto the account's copy too, adding to whatever
// another device saved last.
export function addToGroceryList(lines) {
  const saved = loadGroceryList() || {};
  const more = lines.filter(Boolean).join("\n");
  const append = (list) => {
    const text = (list.text || "").replace(/\s+$/, "");
    const next = { ...list, text: text ? `${text}\n${more}` : more };
    delete next.savedAt;
    return next;
  };
  try {
    const next = append(saved);
    const savedAt = Date.now();
    localStorage.setItem(GROCERY_KEY, JSON.stringify({ ...next, savedAt }));
    pullSynced("grocery").then((cloud) => {
      const base = cloud?.value && (cloud.savedAt || 0) > (saved.savedAt || 0) ? append(cloud.value) : next;
      if (base !== next) localStorage.setItem(GROCERY_KEY, JSON.stringify({ ...base, savedAt }));
      pushSynced("grocery", base, savedAt);
    });
    return true;
  } catch {
    return false;
  }
}
