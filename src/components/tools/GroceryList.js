"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { parseGroceryList } from "@/lib/groceryList";
import { ingredientText } from "@/lib/recipe";
import { walmartUrl } from "@/lib/walmart";

const STORE_KEY = "coco-grocery-list";
const EXAMPLE = "Milk x2\nEggs\n2 lbs ground beef\nBananas\n3x yogurt cups\nBread\nShredded cheese";

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "null") || null;
  } catch {
    return null;
  }
}

// The free Grocery List tool: paste a list from notes or a text, then
// send all of it to Instacart, open each item in a Walmart search, or tick
// items off in the store. The list stays on this device.
export default function GroceryList({ instacart, walmartLink }) {
  const [text, setText] = useState("");
  const [got, setGot] = useState(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = load();
    const frame = requestAnimationFrame(() => {
      if (saved) {
        setText(saved.text || "");
        setGot(new Set(saved.got || []));
      }
      setLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ text, got: [...got] }));
    } catch {}
  }, [text, got, loaded]);

  const items = useMemo(() => parseGroceryList(text), [text]);
  const keyOf = (i) => ingredientText(i).toLowerCase();
  const left = items.filter((i) => !got.has(keyOf(i)));

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
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <div className="rounded-[2rem] border-[3px] border-ink bg-paper p-5 shadow-[6px_6px_0_var(--ink)] sm:p-6">
        <label htmlFor="grocery-text" className="font-display text-2xl tracking-wide">
          Paste your list
        </label>
        <p className="mt-1 text-sm font-medium text-ink/70">
          One item per line, straight from your notes app or a text. Amounts like &ldquo;2 lbs&rdquo; or &ldquo;x2&rdquo; are
          fine.
        </p>
        <textarea
          id="grocery-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={11}
          placeholder={EXAMPLE}
          className="mt-3 w-full resize-y rounded-2xl border-[2.5px] border-ink bg-paper px-4 py-3 text-base leading-relaxed text-ink outline-none placeholder:text-ink/35 focus:shadow-[3px_3px_0_var(--pink)]"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {!text && (
            <button
              type="button"
              onClick={() => setText(EXAMPLE)}
              className="rounded-full border-2 border-ink bg-butter px-3 py-1 text-sm font-semibold"
            >
              Try an example
            </button>
          )}
          {text && (
            <button
              type="button"
              onClick={() => {
                setText("");
                setGot(new Set());
              }}
              className="rounded-full border-2 border-ink bg-paper px-3 py-1 text-sm font-semibold hover:bg-blush"
            >
              Clear list
            </button>
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border-[3px] border-ink bg-paper p-5 shadow-[6px_6px_0_var(--pink)] sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl tracking-wide">Your list</h2>
          {items.length > 0 && (
            <span className="text-sm font-semibold text-ink/60">
              {left.length} of {items.length} left
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <p className="mt-6 rounded-2xl border-2 border-dashed border-ink/30 px-4 py-10 text-center font-medium text-ink/60">
            Your items show up here as you paste them.
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {instacart && (
                <button
                  type="button"
                  onClick={sendToInstacart}
                  disabled={sending || !left.length}
                  className="rounded-full border-[2.5px] border-ink bg-mint px-5 py-2 font-display text-lg tracking-wide shadow-[3px_3px_0_var(--ink)] disabled:opacity-60"
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

            <ul className="mt-4 divide-y-2 divide-ink/10">
              <AnimatePresence initial={false}>
                {items.map((item) => {
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
                        <span className="min-w-0 break-words font-medium">{ingredientText(item)}</span>
                      </button>
                      <a
                        href={walmartUrl(item.item, walmartLink)}
                        target="_blank"
                        rel={`noopener${walmartLink ? " sponsored" : ""}`}
                        className="shrink-0 rounded-full border-2 border-ink px-3 py-0.5 text-sm font-semibold hover:bg-butter"
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
            </ul>
            <p className="mt-3 text-xs text-ink/55">
              Tap an item to tick it off in the store. Your list stays on this device.
              {(instacart || walmartLink) && " We may earn a small commission when you shop through these links."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
