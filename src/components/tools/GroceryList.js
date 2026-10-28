"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SyncNote from "@/components/SyncNote";
import RecipeFinder from "@/components/tools/RecipeFinder";
import { groupByAisle } from "@/lib/groceryAisles";
import { MAX_ITEM_CHARS, itemKey, parseGroceryList } from "@/lib/groceryList";
import { GROCERY_KEY, loadGroceryList } from "@/lib/groceryStore";
import { useSyncedSave } from "@/lib/account";
import { ingredientText } from "@/lib/recipe";
import { browserSupabase } from "@/lib/supabase";
import { walmartUrl } from "@/lib/walmart";

const USUALS_KEY = "coco-grocery-usuals";

// One-tap chips for the things most families buy every week.
const STAPLES = [
  { label: "Fridge", items: ["Milk", "Eggs", "Butter", "Shredded cheese", "Yogurt", "String cheese"] },
  {
    label: "Fruits & veggies",
    items: ["Bananas", "Apples", "Strawberries", "Grapes", "Carrots", "Broccoli", "Avocados", "Onions"],
  },
  { label: "Meat", items: ["Chicken breast", "Ground beef", "Deli turkey", "Bacon"] },
  { label: "Pantry", items: ["Bread", "Rice", "Pasta", "Cereal", "Oatmeal", "Peanut butter", "Tortillas"] },
  {
    label: "Snacks & kids",
    items: ["Goldfish crackers", "Applesauce pouches", "Granola bars", "Juice boxes", "Diapers", "Wipes"],
  },
  { label: "Home", items: ["Paper towels", "Toilet paper", "Dish soap", "Trash bags"] },
];

function loadUsuals() {
  try {
    const list = JSON.parse(localStorage.getItem(USUALS_KEY) || "[]");
    return Array.isArray(list) ? list.filter((i) => typeof i === "string").slice(0, 60) : [];
  } catch {
    return [];
  }
}

function Chips({ items, onList, onAdd }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {items.map((name) => {
        const has = onList(name);
        return (
          <button
            key={name}
            type="button"
            onClick={() => onAdd(name)}
            disabled={has}
            className={`rounded-full border-2 border-ink px-3 py-0.5 text-sm font-semibold transition-transform active:scale-95 ${has ? "bg-mint/60 text-ink/60" : "bg-paper hover:-translate-y-0.5 hover:bg-butter"}`}
          >
            {has ? `✓ ${name}` : `+ ${name}`}
          </button>
        );
      })}
    </div>
  );
}

const EXAMPLE = "Milk x2\nEggs\n2 lbs ground beef\nBananas\n3x yogurt cups\nBread\nShredded cheese";

// Shrinks a photo to at most 1600px on its long side (a phone photo is
// several MB) and returns it as base64 JPEG.
async function shrinkPhoto(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}

// Signed-in site admins (Joseph, Coco) get "Scan a photo"; the scan route
// checks the same thing, since each scan is a paid AI call.
function useAdminToken() {
  const [token, setToken] = useState(null);
  useEffect(() => {
    const supabase = browserSupabase();
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session) return;
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (alive && isAdmin === true) setToken(session.access_token);
    });
    return () => {
      alive = false;
    };
  }, []);
  return token;
}

// The free Grocery List tool: paste a list from notes or a text, or add a
// recipe's ingredients, then send all of it to Instacart, open each item
// in a Walmart search, or tick items off in the store, grouped by aisle.
// The list stays on this device, and syncs to the reader's account.
export default function GroceryList({ instacart, walmartLink, recipes = [] }) {
  const [text, setText] = useState("");
  const [got, setGot] = useState(() => new Set());
  const [added, setAdded] = useState(() => new Set());
  const [byAisle, setByAisle] = useState(true);
  const [mode, setMode] = useState("build");
  const [entry, setEntry] = useState("");
  const [editing, setEditing] = useState(null);
  const [usuals, setUsuals] = useState([]);
  const [savedUsuals, setSavedUsuals] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const adminToken = useAdminToken();
  const photoRef = useRef(null);
  const [scan, setScan] = useState({ busy: false, error: "" });
  const [stapleTab, setStapleTab] = useState(STAPLES[0].label);
  const staple = STAPLES.find((g) => g.label === stapleTab) || STAPLES[0];
  const [show, setShow] = useState("all");
  const [aisleFilter, setAisleFilter] = useState(null);
  const [folded, setFolded] = useState({});

  useEffect(() => {
    const saved = loadGroceryList();
    const frame = requestAnimationFrame(() => {
      if (saved) {
        setText(saved.text || "");
        setGot(new Set(saved.got || []));
        setAdded(new Set(saved.added || []));
        if (saved.byAisle === false) setByAisle(false);
        if (saved.mode === "paste") setMode("paste");
        if (["left", "got"].includes(saved.show)) setShow(saved.show);
      }
      setUsuals(loadUsuals());
      setLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const saved = useMemo(
    () => ({ text, got: [...got], added: [...added], byAisle, mode, show }),
    [text, got, added, byAisle, mode, show],
  );
  const sync = useSyncedSave(GROCERY_KEY, "grocery", saved, {
    loaded,
    apply: (v) => {
      setText(v.text || "");
      setGot(new Set(v.got || []));
      setAdded(new Set(v.added || []));
      setByAisle(v.byAisle !== false);
      setMode(v.mode === "paste" ? "paste" : "build");
      setShow(["left", "got"].includes(v.show) ? v.show : "all");
    },
  });

  const items = useMemo(() => parseGroceryList(text), [text]);
  const keyOf = (i) => ingredientText(i).toLowerCase();
  const left = items.filter((i) => !got.has(keyOf(i)));
  const groups = useMemo(() => (byAisle ? groupByAisle(items) : [{ aisle: null, items }]), [items, byAisle]);

  // A picked aisle that's since been emptied falls back to every aisle.
  const aisle = byAisle && groups.some((g) => g.aisle?.key === aisleFilter) ? aisleFilter : null;

  // What the list shows: one aisle or all of them, filtered to what's left
  // or what's ticked, with ticked items sinking to the bottom of each aisle.
  const shown = groups
    .filter((g) => !aisle || g.aisle?.key === aisle)
    .map((g) => {
      const todo = g.items.filter((i) => !got.has(keyOf(i)));
      const done = g.items.filter((i) => got.has(keyOf(i)));
      const list = show === "left" ? todo : show === "got" ? done : [...todo, ...done];
      return { ...g, items: list, todo: todo.length };
    })
    .filter((g) => g.items.length);

  // An aisle folds itself away once everything in it is ticked, unless the
  // reader opened or closed it by hand.
  const isGroupFolded = (g) => folded[g.aisle.key] ?? (show === "all" && g.todo === 0);

  function toggle(i) {
    const k = keyOf(i);
    setGot((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function remove(item) {
    const target = keyOf(item);
    setText(
      items
        .filter((i) => keyOf(i) !== target)
        .map((i) => ingredientText(i))
        .join("\n"),
    );
  }

  // Adds one typed or tapped item; the same item again just adds to its amount.
  function addLine(line) {
    const clean = line.replace(/\s+/g, " ").trim().slice(0, MAX_ITEM_CHARS);
    if (!clean) return;
    setText((t) => (t.trim() ? `${t.replace(/\s+$/, "")}\n${clean}` : clean));
  }

  // Quick-add chips show ✓ for things already on the list.
  const onListKeys = useMemo(() => new Set(items.map((i) => itemKey(i).split("|")[1])), [items]);
  const onList = (name) => onListKeys.has(itemKey({ item: name, unit: "" }).split("|")[1]);

  function saveEdit(item, value) {
    setEditing(null);
    const target = keyOf(item);
    const next = value.replace(/\s+/g, " ").trim().slice(0, MAX_ITEM_CHARS);
    if (next === ingredientText(item)) return;
    setText(
      items
        .map((i) => (keyOf(i) === target ? next : ingredientText(i)))
        .filter(Boolean)
        .join("\n"),
    );
  }

  function saveUsuals() {
    const list = items.map((i) => i.item);
    setUsuals(list);
    try {
      localStorage.setItem(USUALS_KEY, JSON.stringify(list));
    } catch {}
    setSavedUsuals(true);
    setTimeout(() => setSavedUsuals(false), 2000);
  }

  function addUsuals() {
    usuals.filter((u) => !onList(u)).forEach(addLine);
  }

  function clearTicked() {
    setText(left.map((i) => ingredientText(i)).join("\n"));
    setGot(new Set());
  }

  function clearAll() {
    setText("");
    setGot(new Set());
    setAdded(new Set());
  }

  function addRecipe(recipe) {
    const lines = recipe.ingredients.map((i) => ingredientText(i)).join("\n");
    setText((t) => (t.trim() ? `${t.replace(/\s+$/, "")}\n${lines}` : lines));
    setAdded((prev) => new Set(prev).add(recipe.slug));
  }

  async function scanPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || scan.busy) return;
    setScan({ busy: true, error: "" });
    try {
      const data = await shrinkPhoto(file);
      const res = await fetch("/api/shop/scan-list", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ type: "image/jpeg", data }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.text) throw new Error(out.error || "Couldn't read that photo. Try again.");
      setText((t) => (t.trim() ? `${t.replace(/\s+$/, "")}\n${out.text}` : out.text));
      setScan({ busy: false, error: "" });
    } catch (err) {
      setScan({ busy: false, error: err.message || "Couldn't read that photo. Try again." });
    }
  }

  async function copyList() {
    try {
      await navigator.clipboard.writeText((left.length ? left : items).map((i) => `• ${ingredientText(i)}`).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function sendToInstacart() {
    if (sending) return;
    setSending(true);
    setError("");
    // Opened now, while the tap still counts, so popup blockers allow it.
    const tab = window.open("", "_blank");
    try {
      const res = await fetch("/api/shop/instacart-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: left.map((i) => ingredientText(i)).join("\n") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Instacart didn't answer. Try again in a minute.");
      if (tab) tab.location.href = data.url;
      else window.location.href = data.url;
    } catch (err) {
      tab?.close();
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="min-w-0 rounded-[2rem] border-[3px] border-ink bg-paper p-5 shadow-[6px_6px_0_var(--shadow)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl tracking-wide">
              {mode === "build" ? "Make your list" : "Paste your list"}
            </h2>
            <div
              className="inline-flex rounded-full border-2 border-ink p-0.5 text-sm font-semibold"
              role="group"
              aria-label="How to add"
            >
              {[
                ["build", "Type it"],
                ["paste", "Paste it"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  aria-pressed={mode === value}
                  className={`rounded-full px-3 py-0.5 ${mode === value ? "bg-ink text-paper" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {mode === "build" ? (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addLine(entry);
                  setEntry("");
                }}
                className="mt-4 flex gap-2"
              >
                <label htmlFor="grocery-add" className="sr-only">
                  Add an item
                </label>
                <input
                  id="grocery-add"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  list="grocery-staples"
                  autoComplete="off"
                  maxLength={MAX_ITEM_CHARS}
                  placeholder="Add an item, like “2 lbs apples”"
                  className="min-w-0 flex-1 rounded-full border-[2.5px] border-ink bg-paper px-4 py-2.5 font-medium outline-none placeholder:text-ink/40 focus:shadow-[3px_3px_0_var(--pink)]"
                />
                <datalist id="grocery-staples">
                  {STAPLES.flatMap((g) => g.items).map((i) => (
                    <option key={i} value={i} />
                  ))}
                </datalist>
                <button
                  type="submit"
                  disabled={!entry.trim()}
                  className="shrink-0 rounded-full border-[2.5px] border-ink bg-pink px-5 font-display text-lg tracking-wide text-paper shadow-[3px_3px_0_var(--shadow)] disabled:opacity-50"
                >
                  Add
                </button>
              </form>

              {usuals.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg tracking-wide">My usuals</h3>
                    <button
                      type="button"
                      onClick={addUsuals}
                      className="text-sm font-semibold text-pink-deep hover:underline"
                    >
                      Add them all
                    </button>
                  </div>
                  <Chips items={usuals} onList={onList} onAdd={addLine} />
                </div>
              )}

              <div className="mt-5">
                <h3 className="font-display text-lg tracking-wide">Quick add</h3>
                <div
                  className="-mx-1 mt-1.5 flex gap-1.5 overflow-x-auto px-1 pb-1"
                  role="tablist"
                  aria-label="Quick add groups"
                >
                  {STAPLES.map((g) => {
                    const on = g.label === staple.label;
                    const count = g.items.filter(onList).length;
                    return (
                      <button
                        key={g.label}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setStapleTab(g.label)}
                        className={`shrink-0 rounded-full border-2 border-ink px-3 py-0.5 text-sm font-semibold ${on ? "bg-ink text-paper" : "bg-paper hover:bg-butter"}`}
                      >
                        {g.label}
                        {count > 0 && <span className={on ? "text-paper/70" : "text-ink/50"}> · {count}</span>}
                      </button>
                    );
                  })}
                </div>
                <div role="tabpanel" aria-label={staple.label}>
                  <Chips items={staple.items} onList={onList} onAdd={addLine} />
                </div>
              </div>
            </>
          ) : (
            <>
              <label htmlFor="grocery-text" className="mt-1 block text-sm font-medium text-ink/70">
                One item per line, straight from your notes app or a text. Amounts like &ldquo;2 lbs&rdquo; or
                &ldquo;x2&rdquo; are fine.
              </label>
              <textarea
                id="grocery-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={11}
                placeholder={EXAMPLE}
                className="mt-3 w-full resize-y rounded-2xl border-[2.5px] border-ink bg-paper px-4 py-3 text-base leading-relaxed text-ink outline-none placeholder:text-ink/35 focus:shadow-[3px_3px_0_var(--pink)]"
              />
            </>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {adminToken && (
              <>
                <input ref={photoRef} type="file" accept="image/*" onChange={scanPhoto} className="hidden" />
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  disabled={scan.busy}
                  className="rounded-full border-2 border-ink bg-mint px-3 py-1 text-sm font-semibold disabled:opacity-60"
                >
                  {scan.busy ? "Reading your list…" : "📷 Scan a photo"}
                </button>
              </>
            )}
            {recipes.length > 0 && (
              <a href="#recipes" className="rounded-full border-2 border-ink bg-blush px-3 py-1 text-sm font-semibold">
                Add a recipe&rsquo;s ingredients ↓
              </a>
            )}
            {!text && mode === "paste" && (
              <button
                type="button"
                onClick={() => setText(EXAMPLE)}
                className="rounded-full border-2 border-ink bg-butter px-3 py-1 text-sm font-semibold"
              >
                Try an example
              </button>
            )}
            {items.length > 0 && (
              <button
                type="button"
                onClick={saveUsuals}
                className="rounded-full border-2 border-ink bg-butter px-3 py-1 text-sm font-semibold"
              >
                {savedUsuals ? "Saved as my usuals ✓" : "Save as my usuals"}
              </button>
            )}
            {text && (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-full border-2 border-ink bg-paper px-3 py-1 text-sm font-semibold hover:bg-blush"
              >
                Clear list
              </button>
            )}
          </div>
          {scan.error && <p className="mt-2 text-sm font-semibold text-pink-deep">{scan.error}</p>}
        </div>

        <div className="min-w-0 rounded-[2rem] border-[3px] border-ink bg-paper p-5 shadow-[6px_6px_0_var(--pink)] sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl tracking-wide">Your list</h2>
            {items.length > 0 && (
              <span className="text-sm font-semibold text-ink/60">
                {left.length ? `${left.length} of ${items.length} left` : "All done! 🎉"}
              </span>
            )}
          </div>
          {items.length > 0 && (
            <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-paper" aria-hidden>
              <motion.div
                className="h-full bg-mint"
                initial={false}
                animate={{ width: `${((items.length - left.length) / items.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
              />
            </div>
          )}

          {items.length === 0 ? (
            <p className="mt-6 rounded-2xl border-2 border-dashed border-ink/30 px-4 py-10 text-center font-medium text-ink/60">
              Your items show up here as you add them.
            </p>
          ) : (
            <>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {instacart && (
                  <button
                    type="button"
                    onClick={sendToInstacart}
                    disabled={sending || !left.length}
                    className="rounded-full border-[2.5px] border-ink bg-mint px-5 py-2 font-display text-lg tracking-wide shadow-[3px_3px_0_var(--shadow)] disabled:opacity-60"
                  >
                    {sending ? "Building your cart…" : "Send to Instacart"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyList}
                  className="rounded-full border-[2.5px] border-ink bg-butter px-5 py-2 font-display text-lg tracking-wide"
                >
                  {copied ? "Copied!" : "Copy list"}
                </button>
              </div>
              {instacart && (
                <p className="mt-2 text-xs font-medium text-ink/60">
                  Instacart fills a cart at a store near you, like Walmart, Costco, Kroger or Aldi.
                </p>
              )}
              {error && <p className="mt-2 text-sm font-semibold text-pink-deep">{error}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div
                  className="inline-flex rounded-full border-2 border-ink p-0.5 text-sm font-semibold"
                  role="group"
                  aria-label="Show"
                >
                  {[
                    ["all", "All", items.length],
                    ["left", "To get", left.length],
                    ["got", "Got it", items.length - left.length],
                  ].map(([value, label, count]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setShow(value)}
                      aria-pressed={show === value}
                      className={`rounded-full px-3 py-0.5 ${show === value ? "bg-ink text-paper" : ""}`}
                    >
                      {label} <span className={show === value ? "text-paper/70" : "text-ink/50"}>{count}</span>
                    </button>
                  ))}
                </div>
                <label className="sr-only" htmlFor="grocery-order">
                  Order
                </label>
                <select
                  id="grocery-order"
                  value={byAisle ? "aisle" : "typed"}
                  onChange={(e) => {
                    setByAisle(e.target.value === "aisle");
                    setAisleFilter(null);
                  }}
                  className="rounded-full border-2 border-ink bg-paper px-3 py-1 text-sm font-semibold"
                >
                  <option value="aisle">By aisle</option>
                  <option value="typed">As typed</option>
                </select>
                {got.size > 0 && left.length < items.length && (
                  <button
                    type="button"
                    onClick={clearTicked}
                    className="rounded-full border-2 border-ink px-3 py-0.5 text-sm font-semibold hover:bg-blush"
                  >
                    Clear ticked ({items.length - left.length})
                  </button>
                )}
              </div>

              {byAisle && groups.length > 1 && (
                <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Aisle">
                  {[{ aisle: null, items }, ...groups].map((g) => {
                    const key = g.aisle?.key || null;
                    const on = aisle === key;
                    const todo = g.items.filter((i) => !got.has(keyOf(i))).length;
                    return (
                      <button
                        key={key || "all"}
                        type="button"
                        onClick={() => setAisleFilter(key)}
                        aria-pressed={on}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink px-3 py-0.5 text-sm font-semibold ${on ? "bg-ink text-paper" : "bg-paper hover:bg-butter"}`}
                      >
                        {g.aisle && (
                          <span
                            className={`h-2.5 w-2.5 rounded-full border-2 border-ink ${g.aisle.color}`}
                            aria-hidden
                          />
                        )}
                        {g.aisle ? g.aisle.label : "Every aisle"}
                        <span className={on ? "text-paper/70" : "text-ink/50"}>{todo || "✓"}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {shown.length === 0 && (
                <p className="mt-4 rounded-2xl border-2 border-dashed border-ink/30 px-4 py-6 text-center font-medium text-ink/60">
                  {show === "got" ? "Nothing ticked off yet." : "All done here! 🎉"}
                </p>
              )}

              <div className="mt-3 space-y-3">
                {shown.map((group) => {
                  const key = group.aisle?.key || "all";
                  const isFolded = group.aisle && isGroupFolded(group);
                  return (
                    <section key={key}>
                      {group.aisle && (
                        <h3>
                          <button
                            type="button"
                            onClick={() => setFolded((f) => ({ ...f, [key]: !isFolded }))}
                            aria-expanded={!isFolded}
                            className="flex w-full items-center gap-2 rounded-xl py-1 text-left font-display text-lg tracking-wide hover:bg-butter/40"
                          >
                            <span
                              className={`h-3 w-3 shrink-0 rounded-full border-2 border-ink ${group.aisle.color}`}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">{group.aisle.label}</span>
                            <span className="font-sans text-xs font-semibold text-ink/50">
                              {group.todo ? `${group.todo} to get` : "All got ✓"}
                            </span>
                            <motion.span
                              aria-hidden
                              animate={{ rotate: isFolded ? -90 : 0 }}
                              className="grid h-6 w-6 shrink-0 place-items-center font-sans text-sm text-ink/60"
                            >
                              ▾
                            </motion.span>
                          </button>
                        </h3>
                      )}
                      <AnimatePresence initial={false}>
                        {!isFolded && (
                          <motion.ul
                            key="items"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="divide-y-2 divide-ink/10 overflow-hidden"
                          >
                            <AnimatePresence initial={false}>
                              {group.items.map((item) => {
                                const k = keyOf(item);
                                const done = got.has(k);
                                return (
                                  <motion.li
                                    key={k}
                                    layout
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 py-2"
                                  >
                                    {editing === k ? (
                                      <input
                                        autoFocus
                                        defaultValue={ingredientText(item)}
                                        aria-label={`Edit ${item.item}`}
                                        maxLength={MAX_ITEM_CHARS}
                                        onBlur={(e) => saveEdit(item, e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") e.currentTarget.blur();
                                          if (e.key === "Escape") setEditing(null);
                                        }}
                                        className="min-w-0 flex-1 rounded-xl border-[2.5px] border-ink bg-paper px-3 py-1 font-medium outline-none focus:shadow-[3px_3px_0_var(--pink)]"
                                      />
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => toggle(item)}
                                          aria-pressed={done}
                                          className={`flex min-w-0 flex-1 items-center gap-3 text-left ${done ? "text-ink/45 line-through" : ""}`}
                                        >
                                          <span
                                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-[2.5px] border-ink ${done ? "bg-mint" : "bg-paper"}`}
                                          >
                                            {done && <span className="text-sm font-bold">✓</span>}
                                          </span>
                                          <span className="min-w-0 break-words font-medium">
                                            {ingredientText(item)}
                                          </span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditing(k)}
                                          aria-label={`Edit ${item.item}`}
                                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink/50 hover:bg-butter hover:text-ink"
                                        >
                                          ✎
                                        </button>
                                      </>
                                    )}
                                    <a
                                      href={walmartUrl(item.item, walmartLink)}
                                      target="_blank"
                                      rel={`noopener${walmartLink ? " sponsored" : ""}`}
                                      className="shrink-0 rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-semibold hover:bg-butter sm:px-3 sm:text-sm"
                                    >
                                      Walmart ↗
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => remove(item)}
                                      aria-label={`Remove ${item.item}`}
                                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-lg text-ink/50 hover:bg-blush hover:text-ink"
                                    >
                                      ×
                                    </button>
                                  </motion.li>
                                );
                              })}
                            </AnimatePresence>
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </section>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-ink/55">
                Tap an item to tick it off in the store. <SyncNote sync={sync} />
                {(instacart || walmartLink) && " We may earn a small commission when you shop through these links."}
              </p>
            </>
          )}
        </div>
      </div>
      {recipes.length > 0 && <RecipeFinder recipes={recipes} added={added} onAdd={addRecipe} />}
    </>
  );
}
