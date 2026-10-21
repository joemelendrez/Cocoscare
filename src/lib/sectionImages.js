import { CATEGORIES } from "@/lib/content";
import { SECTION_ICONS } from "@/lib/sectionIcons";

// Section images for inside a post: one line icon on a round white sticker,
// on a flat brand color, with a few optional words under it. Cover and pin
// images stay real photos (they get more saves); these break up a long post.
// Drawn by /blog/section-image, picked in /admin/images.

export const IMAGE_COLORS = [
  { key: "butter", label: "Butter", bg: "#ffcb47", ink: "#161016" },
  { key: "periwinkle", label: "Periwinkle", bg: "#7d93e8", ink: "#161016" },
  { key: "mint", label: "Mint", bg: "#73dfbf", ink: "#161016" },
  { key: "pink", label: "Pink", bg: "#ff0f9a", ink: "#ffffff" },
  { key: "blush", label: "Blush", bg: "#ffd2ec", ink: "#161016" },
  { key: "ink", label: "Ink", bg: "#161016", ink: "#ffffff" },
];

export const IMAGE_FORMATS = {
  wide: { width: 1200, height: 675, label: "Wide" },
  square: { width: 1080, height: 1080, label: "Square" },
  tall: { width: 1000, height: 1500, label: "Tall" },
};

export const MAX_WORDS = 40;

export const imageColor = (key) => IMAGE_COLORS.find((c) => c.key === key) || IMAGE_COLORS[0];

// Each blog category starts on its own color and icon.
export const CATEGORY_DEFAULTS = Object.fromEntries(
  CATEGORIES.map((c) => [
    c.key,
    {
      color: c.color,
      icon: { recipes: "chef-hat", "mom-finds": "shopping-bag", outings: "map-pin", "nanny-tips": "heart" }[c.key],
    },
  ]),
);

export const cleanWords = (text) =>
  String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_WORDS);

// The URL of an image drawn by /blog/section-image.
export function sectionImageUrl({ color, icon, text, format } = {}) {
  const p = new URLSearchParams();
  p.set("c", imageColor(color).key);
  if (icon && SECTION_ICONS[icon]) p.set("i", icon);
  const words = cleanWords(text);
  if (words) p.set("t", words);
  if (format && format !== "wide" && IMAGE_FORMATS[format]) p.set("f", format);
  return `/blog/section-image?${p}`;
}
