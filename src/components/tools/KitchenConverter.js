"use client";

import { useState } from "react";
import PickerSheet from "@/components/tools/PickerSheet";
import { VOLUME, WEIGHT, cToF, convertAll, fToC, readAmount, scaleLine, showAmount } from "@/lib/kitchenUnits";

const CARD = "rounded-[2rem] border-[3px] border-ink bg-paper p-5 shadow-[6px_6px_0_var(--shadow)] sm:p-6";
const FIELD =
  "rounded-2xl border-[2.5px] border-ink bg-paper px-4 py-2.5 font-medium outline-none placeholder:text-ink/40 focus:shadow-[3px_3px_0_var(--pink)]";
const FACTORS = [
  [0.5, "½"],
  [1, "1×"],
  [1.5, "1½×"],
  [2, "2×"],
  [3, "3×"],
];
const UNIT_GROUPS = [
  { label: "Volume", options: VOLUME.map((u) => ({ value: u.key, label: u.label, hint: u.short })) },
  { label: "Weight", options: WEIGHT.map((u) => ({ value: u.key, label: u.label, hint: u.short })) },
];
const OVEN = [250, 300, 325, 350, 375, 400, 425, 450];
const EXAMPLE = "2 cups flour\n1 tsp baking soda\n½ cup butter\n3 bananas\n2 eggs\nPinch of salt";

function Converter() {
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState("cup");
  const n = readAmount(amount);
  const rows = n ? convertAll(n, unit) : [];
  return (
    <section className={CARD}>
      <h2 className="font-display text-2xl tracking-wide">Convert a measurement</h2>
      <p className="mt-1 text-sm font-medium text-ink/70">Cups to grams? Pick what the recipe says.</p>
      <div className="mt-4 flex gap-2">
        <label className="sr-only" htmlFor="conv-amount">
          Amount
        </label>
        <input
          id="conv-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1½"
          className={`${FIELD} w-24`}
        />
        <PickerSheet
          label="Unit"
          title="Pick a unit"
          value={unit}
          onChange={setUnit}
          groups={UNIT_GROUPS}
          className={`${FIELD} min-w-0 flex-1`}
        />
      </div>
      {rows.length ? (
        <ul className="mt-4 grid grid-cols-2 gap-2">
          {rows.map(({ unit: u, value }) => (
            <li key={u.key} className="rounded-2xl border-2 border-ink bg-butter/60 px-3 py-2">
              <span className="font-display text-2xl tracking-wide">{showAmount(value, u)}</span>{" "}
              <span className="text-sm font-semibold">{u.short}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm font-semibold text-ink/60">Type an amount like 1, 1½ or 0.25.</p>
      )}
      {VOLUME.some((u) => u.key === unit) && (
        <p className="mt-3 text-xs text-ink/55">
          Cups measure space, not weight, so a cup of flour (about 125 g) weighs less than a cup of sugar (about 200 g).
        </p>
      )}
    </section>
  );
}

function Scaler() {
  const [text, setText] = useState("");
  const [factor, setFactor] = useState(2);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [copied, setCopied] = useState(false);
  const servingsFactor = readAmount(from) && readAmount(to) ? readAmount(to) / readAmount(from) : null;
  const f = servingsFactor || factor;
  const out = text
    .split(/\r?\n/)
    .map((l) => scaleLine(l, f))
    .filter(Boolean);

  async function copy() {
    try {
      await navigator.clipboard.writeText(out.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <section className={`${CARD} lg:col-span-2`}>
      <h2 className="font-display text-2xl tracking-wide">Double (or halve) a recipe</h2>
      <p className="mt-1 text-sm font-medium text-ink/70">
        Paste the ingredients, pick how much you need, and every amount changes.
      </p>
      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="scale-text" className="sr-only">
            Ingredients
          </label>
          <textarea
            id="scale-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={EXAMPLE}
            className={`${FIELD} w-full resize-y leading-relaxed`}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {FACTORS.map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setFactor(v);
                  setFrom("");
                  setTo("");
                }}
                aria-pressed={!servingsFactor && factor === v}
                className={`rounded-full border-2 border-ink px-3 py-1 text-sm font-bold ${!servingsFactor && factor === v ? "bg-ink text-paper" : "hover:bg-butter"}`}
              >
                {label}
              </button>
            ))}
            {!text && (
              <button
                type="button"
                onClick={() => setText(EXAMPLE)}
                className="text-sm font-semibold text-pink-deep hover:underline"
              >
                Try an example
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span>Or: recipe serves</span>
            <input
              aria-label="Recipe serves"
              inputMode="numeric"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="4"
              className="w-14 rounded-xl border-2 border-ink bg-paper px-2 py-1 text-center outline-none"
            />
            <span>and I need</span>
            <input
              aria-label="Servings I need"
              inputMode="numeric"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="6"
              className="w-14 rounded-xl border-2 border-ink bg-paper px-2 py-1 text-center outline-none"
            />
          </div>
        </div>
        <div className="rounded-2xl border-2 border-ink bg-mint/40 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-lg tracking-wide">
              {servingsFactor ? `For ${readAmount(to)} servings` : `${FACTORS.find(([v]) => v === factor)?.[1] || ""} recipe`}
            </h3>
            {out.length > 0 && (
              <button type="button" onClick={copy} className="text-sm font-semibold text-pink-deep hover:underline">
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          {out.length ? (
            <ul className="mt-2 space-y-1 font-medium">
              {out.map((l, i) => (
                <li key={i}>• {l}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm font-medium text-ink/60">The new amounts show up here.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function Oven() {
  const [f, setF] = useState("350");
  const deg = readAmount(f);
  return (
    <section className={CARD}>
      <h2 className="font-display text-2xl tracking-wide">Oven temperature</h2>
      <p className="mt-1 text-sm font-medium text-ink/70">Fahrenheit to Celsius, for recipes from anywhere.</p>
      <div className="mt-4 flex items-center gap-3">
        <label htmlFor="oven-f" className="sr-only">
          Degrees Fahrenheit
        </label>
        <input id="oven-f" inputMode="numeric" value={f} onChange={(e) => setF(e.target.value)} className={`${FIELD} w-28`} />
        <span className="font-display text-xl">°F =</span>
        <span className="font-display text-3xl tracking-wide">{deg ? `${fToC(deg)}°C` : "–"}</span>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-1.5 text-sm font-semibold sm:grid-cols-4 lg:grid-cols-2">
        {OVEN.map((t) => (
          <li key={t} className="rounded-xl border-2 border-ink/20 px-2 py-1">
            {t}°F = {fToC(t)}°C
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink/55">
        Fan oven? Most recipes want about 20°C lower. {cToF(180)}°F is the classic 180°C.
      </p>
    </section>
  );
}

// The free Kitchen Converter: units, recipe scaling and oven temps.
export default function KitchenConverter() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Converter />
      <Oven />
      <Scaler />
    </div>
  );
}
