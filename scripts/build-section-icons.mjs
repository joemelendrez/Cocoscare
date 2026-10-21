// Writes src/lib/sectionIcons.js: the line icons /blog/section-image can
// draw, taken from Lucide (lucide.dev, ISC license). lucide-react isn't a
// dependency here, so point the script at a copy of it:
//   npm i --prefix /tmp/lucide lucide-react
//   node scripts/build-section-icons.mjs /tmp/lucide/node_modules/lucide-react
// To add an icon, add its Lucide name to a group and run it again.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";

const GROUPS = [
  {
    label: "Kitchen",
    names: [
      "chef-hat",
      "cooking-pot",
      "utensils",
      "utensils-crossed",
      "soup",
      "salad",
      "sandwich",
      "pizza",
      "croissant",
      "cookie",
      "cake-slice",
      "cake",
      "dessert",
      "ice-cream-cone",
      "popsicle",
      "apple",
      "banana",
      "cherry",
      "grape",
      "citrus",
      "carrot",
      "egg",
      "egg-fried",
      "wheat",
      "milk",
      "coffee",
      "cup-soda",
      "glass-water",
      "refrigerator",
      "microwave",
      "timer",
      "alarm-clock",
      "flame",
      "snowflake",
      "shopping-basket",
      "shopping-cart",
      "list-checks",
      "scale",
    ],
  },
  {
    label: "Baby and kids",
    names: [
      "baby",
      "milk-off",
      "bed",
      "bed-double",
      "moon",
      "moon-star",
      "sun",
      "cloud-sun",
      "shirt",
      "puzzle",
      "blocks",
      "toy-brick",
      "gamepad-2",
      "palette",
      "paintbrush",
      "pencil",
      "book-open",
      "library",
      "music",
      "drum",
      "smile",
      "laugh",
      "frown",
      "angry",
      "bath",
      "droplets",
      "thermometer",
      "pill",
      "stethoscope",
      "bandage",
      "shield-check",
      "graduation-cap",
      "backpack",
      "school",
    ],
  },
  {
    label: "Out and about",
    names: [
      "map-pin",
      "map",
      "car",
      "bus",
      "train-front",
      "plane",
      "tent",
      "trees",
      "tree-pine",
      "flower",
      "flower-2",
      "leaf",
      "sprout",
      "mountain",
      "waves",
      "umbrella",
      "cloud-rain",
      "sun-snow",
      "bike",
      "footprints",
      "ticket",
      "ferris-wheel",
      "fish",
      "bird",
      "rabbit",
      "squirrel",
      "dog",
      "cat",
      "camera",
    ],
  },
  {
    label: "Home and finds",
    names: [
      "house",
      "sofa",
      "lamp",
      "washing-machine",
      "shopping-bag",
      "gift",
      "package",
      "tag",
      "wallet",
      "piggy-bank",
      "sparkles",
      "star",
      "heart",
      "heart-handshake",
      "thumbs-up",
      "badge-check",
      "calendar",
      "calendar-check",
      "clock",
      "list-todo",
      "clipboard-list",
      "notebook-pen",
      "lightbulb",
      "phone",
      "mail",
      "message-circle",
      "users",
      "party-popper",
      "balloon",
    ],
  },
  {
    label: "Shapes and symbols",
    names: [
      "quote",
      "circle-help",
      "info",
      "check",
      "circle-check",
      "plus",
      "arrow-right",
      "hash",
      "circle",
      "square",
      "triangle",
    ],
  },
];

const root = resolve(process.argv[2] || "node_modules/lucide-react");
const dir = join(root, "dist/esm/icons");
if (!existsSync(dir)) {
  console.error(`No Lucide icons at ${dir}. See the comment at the top of this file.`);
  process.exit(1);
}
const icons = {};
const groups = [];
const missing = [];
const attr = (k, v) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${String(v).replace(/"/g, "&quot;")}"`;

// An old name kept as an alias only re-exports the icon it now points at.
async function iconNode(file) {
  const mod = await import(pathToFileURL(file).href);
  const node = mod.__iconNode || mod.__iconData?.node;
  if (node) return node;
  const target = readFileSync(file, "utf8").match(/from '\.\/([a-z0-9-]+\.m?js)'/)?.[1];
  return target ? iconNode(join(dir, target)) : null;
}

for (const g of GROUPS) {
  const names = [];
  for (const name of g.names) {
    // Newer lucide-react ships .mjs files, older ones .js.
    const file = [".mjs", ".js"].map((ext) => join(dir, `${name}${ext}`)).find(existsSync);
    if (!file) {
      missing.push(name);
      continue;
    }
    if (!icons[name]) {
      const node = await iconNode(file);
      if (!node) {
        missing.push(name);
        continue;
      }
      icons[name] = node
        .map(
          ([tag, attrs]) =>
            `<${tag} ${Object.entries(attrs)
              .filter(([k]) => k !== "key")
              .map(([k, v]) => attr(k, v))
              .join(" ")} />`,
        )
        .join("");
    }
    if (!names.includes(name)) names.push(name);
  }
  groups.push({ label: g.label, names });
}

const out = `// Line icons for section images, from Lucide (lucide.dev, ISC license).
// Each value is the inside of a 24x24 SVG drawn with a stroke, no fill.
// Generated by scripts/build-section-icons.mjs; edit the groups there.
export const SECTION_ICONS = ${JSON.stringify(icons, null, 2)};

export const SECTION_ICON_GROUPS = ${JSON.stringify(groups, null, 2)};
`;
writeFileSync(join(process.cwd(), "src/lib/sectionIcons.js"), out);
console.log(`Wrote ${Object.keys(icons).length} icons.${missing.length ? ` Missing: ${missing.join(", ")}` : ""}`);
