// Sorts grocery items into store sections, so the list reads in the order
// you walk the store. A plain word match: anything it doesn't know goes
// under "Everything else".

export const AISLES = [
  {
    key: "produce",
    label: "Fruits & veggies",
    color: "bg-mint",
    words:
      "apple, banana, berry, berries, strawberry, strawberries, blueberry, blueberries, raspberry, raspberries, grape, orange, lemon, lime, avocado, tomato, potato, potatoe, onion, garlic, carrot, celery, lettuce, spinach, kale, broccoli, cauliflower, cucumber, bell pepper, jalapeno, zucchini, squash, mushroom, corn, pea, green bean, sprout, cilantro, parsley, basil, mint, ginger, peach, pear, plum, mango, pineapple, melon, watermelon, cantaloupe, kiwi, cherry, cherries, salad, greens, scallion, green onion, shallot, leek, beet, radish, asparagus, cabbage, sweet potato, yam, fruit, veggie, vegetable, herb",
  },
  {
    key: "meat",
    label: "Meat & fish",
    color: "bg-blush",
    words:
      "beef, chicken, pork, turkey, ham, bacon, sausage, steak, meat, lamb, salmon, tuna, shrimp, fish, tilapia, cod, hot dog, meatball, deli, pepperoni, chicken breast, chicken thigh",
  },
  {
    key: "dairy",
    label: "Dairy & eggs",
    color: "bg-periwinkle",
    words:
      "milk, egg, cheese, cheddar, mozzarella, parmesan, butter, yogurt, yoghurt, cream, sour cream, half and half, creamer, cottage cheese, ricotta, string cheese",
  },
  {
    key: "bakery",
    label: "Bread & bakery",
    color: "bg-butter",
    words: "bread, bun, bagel, tortilla, wrap, roll, muffin, croissant, pita, naan, english muffin, loaf",
  },
  {
    key: "frozen",
    label: "Frozen",
    color: "bg-periwinkle",
    words: "ice cream, popsicle, waffle, nugget, pizza, fries, frozen fruit",
  },
  {
    key: "pantry",
    label: "Pantry",
    color: "bg-butter",
    words:
      "flour, sugar, salt, oil, olive oil, vinegar, rice, pasta, noodle, spaghetti, macaroni, oat, oatmeal, cereal, granola, peanut butter, almond butter, jam, jelly, honey, syrup, sauce, tomato sauce, pasta sauce, soy sauce, ketchup, mustard, mayo, mayonnaise, broth, stock, soup, bean, black bean, lentil, chickpea, spice, cinnamon, paprika, cumin, oregano, pepper, black pepper, vanilla, baking soda, baking powder, yeast, chocolate chip, cocoa, nut, almond, walnut, pecan, seed, raisin, quinoa, breadcrumb, pancake mix, cake mix, mix, salsa, dressing, cornstarch, applesauce, tuna can, canned",
  },
  {
    key: "snacks",
    label: "Snacks & drinks",
    color: "bg-pink",
    words:
      "cracker, goldfish, pretzel, popcorn, snack, granola bar, bar, cookie, juice, water, coffee, tea, soda, sparkling water, pouch, puff, fruit snack, chip",
  },
  {
    key: "baby",
    label: "Baby & home",
    color: "bg-mint",
    words:
      "diaper, wipe, formula, baby food, paper towel, toilet paper, tissue, napkin, detergent, soap, dish soap, sponge, trash bag, foil, plastic wrap, zip bag, shampoo, toothpaste, lotion, sunscreen, baby wipe",
  },
];

const OTHER = { key: "other", label: "Everything else", color: "bg-paper" };

const PHRASES = AISLES.flatMap((a) => a.words.split(/,\s*/).map((w) => ({ w, a })));
const words = (text) => ` ${text.toLowerCase().replace(/[^a-z]+/g, " ")} `;

// The word nearest the end decides ("chicken broth" is pantry, "baby
// carrots" is produce); anything frozen is frozen.
export function aisleFor(item = "") {
  const text = words(item);
  if (text.includes(" frozen ")) return AISLES.find((a) => a.key === "frozen");
  let best = null;
  for (const { w, a } of PHRASES) {
    const m = new RegExp(` ${w}(?:s|es)? `).exec(text);
    if (!m) continue;
    const end = m.index + m[0].length;
    if (!best || end > best.end || (end === best.end && w.length > best.w.length)) best = { end, w, a };
  }
  return best ? best.a : OTHER;
}

// [{ aisle, items }], in store order, empty sections left out.
export function groupByAisle(items) {
  const groups = [...AISLES, OTHER].map((aisle) => ({ aisle, items: [] }));
  for (const item of items) groups.find((g) => g.aisle.key === aisleFor(item.item).key).items.push(item);
  return groups.filter((g) => g.items.length);
}
