"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import RecipeCard from "@/components/RecipeCard";
import { useRecord } from "@/components/admin/useRecord";
import { useAdmin } from "@/components/admin/AdminShell";
import {
  Button,
  Card,
  CopyCode,
  DeleteButton,
  Field,
  Notice,
  PhotoInput,
  RowTools,
  Segmented,
  TextArea,
  TextInput,
  moveItem,
} from "@/components/admin/AdminUI";
import { cardToken } from "@/lib/data";
import { formatAmount, guessTimerSeconds, parseAmount, parseIngredientLine, parseStepsText, slugify } from "@/lib/recipe";

const BLANK = {
  title: "",
  slug: "",
  summary: "",
  image_url: null,
  servings: 4,
  prep_minutes: null,
  cook_minutes: null,
  ingredients: [],
  steps: [],
  tips: "",
  status: "draft",
};

let keySeq = 0;
const key = () => `k${++keySeq}`;

const toIngredientRows = (list) =>
  list.map((i) => ({ key: key(), amountText: i.amount != null ? formatAmount(i.amount) : "", unit: i.unit || "", item: i.item || "" }));
const toStepRows = (list) =>
  list.map((s) => ({ key: key(), text: s.text || "", minutes: s.timer_seconds ? String(Math.round((s.timer_seconds / 60) * 100) / 100) : "" }));

function toRecipe(form) {
  return {
    title: form.title.trim(),
    slug: form.slug,
    summary: form.summary.trim() || null,
    image_url: form.image_url,
    servings: Math.min(100, Math.max(1, Number(form.servings) || 1)),
    prep_minutes: form.prep_minutes === "" || form.prep_minutes == null ? null : Math.max(0, Number(form.prep_minutes) || 0),
    cook_minutes: form.cook_minutes === "" || form.cook_minutes == null ? null : Math.max(0, Number(form.cook_minutes) || 0),
    ingredients: form.ingredients
      .filter((r) => r.item.trim())
      .map((r) => ({ amount: parseAmount(r.amountText), unit: r.unit.trim(), item: r.item.trim() })),
    steps: form.steps
      .filter((r) => r.text.trim())
      .map((r) => {
        const min = Number(r.minutes);
        return { text: r.text.trim(), timer_seconds: r.minutes !== "" && min > 0 ? Math.round(min * 60) : null };
      }),
    tips: form.tips.trim() || null,
    status: form.status,
  };
}

function PasteBox({ label, placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  if (!open) {
    return (
      <button type="button" className="text-sm font-semibold text-pink-deep hover:underline" onClick={() => setOpen(true)}>
        Paste a list instead
      </button>
    );
  }
  return (
    <div className="mt-3 space-y-2 rounded-2xl border-2 border-dashed border-ink/50 p-3">
      <TextArea rows={5} placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} aria-label={label} />
      <div className="flex gap-2">
        <Button
          className="py-1.5 text-sm"
          disabled={!text.trim()}
          onClick={() => {
            onAdd(text);
            setText("");
            setOpen(false);
          }}
        >
          Add these
        </Button>
        <Button variant="ghost" className="py-1.5 text-sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function RecipeForm({ initial, rec }) {
  const { supabase } = useAdmin();
  const [form, setForm] = useState(() => ({
    ...BLANK,
    ...initial,
    summary: initial.summary || "",
    tips: initial.tips || "",
    prep_minutes: initial.prep_minutes ?? "",
    cook_minutes: initial.cook_minutes ?? "",
    ingredients: toIngredientRows(initial.ingredients || []),
    steps: toStepRows(initial.steps || []),
  }));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setRow = (list, i, patch) => set({ [list]: form[list].map((r, j) => (j === i ? { ...r, ...patch } : r)) });

  const recipe = toRecipe(form);
  const badAmounts = form.ingredients.filter((r) => r.amountText.trim() && parseAmount(r.amountText) == null);
  const canSave = recipe.title && recipe.slug && !badAmounts.length;

  const save = async (status = form.status) => {
    const values = { ...toRecipe({ ...form, status }) };
    const saved = await rec.save(values, {
      message:
        status === "published"
          ? "Saved and live. Recipes show on the blog inside a post: use “Write a post with this recipe” to put it in one."
          : "Saved!",
      paths: ["/blog"],
    });
    if (saved) set({ status: saved.status });
    return saved;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/recipes" className="text-sm font-semibold text-ink/60 hover:underline">
            ← Recipes
          </Link>
          <h1 className="font-display text-4xl tracking-wide">{rec.isNew ? "New recipe" : form.title || "Recipe"}</h1>
          {!rec.isNew && (
            <Link href={`/admin/posts/new?recipe=${rec.record.id}`} className="mt-1 inline-block text-sm font-semibold text-pink-deep hover:underline">
              Write a post with this recipe →
            </Link>
          )}
        </div>
        <Segmented
          label="Status"
          value={form.status}
          onChange={(status) => set({ status })}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Live" },
          ]}
        />
      </div>

      <Card title="The basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Recipe name" className="sm:col-span-2">
            <TextInput
              value={form.title}
              placeholder="Banana oat muffins"
              onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
            />
          </Field>
          <Field label="Short description" className="sm:col-span-2" hint="One or two sentences. Shows on the recipe card and in Google.">
            <TextArea rows={2} value={form.summary} onChange={(e) => set({ summary: e.target.value })} placeholder="Soft, no-sugar muffins my toddler asks for every morning." />
          </Field>
          <Field label="Serves">
            <TextInput type="number" min="1" max="100" inputMode="numeric" value={form.servings} onChange={(e) => set({ servings: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prep (min)">
              <TextInput type="number" min="0" inputMode="numeric" value={form.prep_minutes} onChange={(e) => set({ prep_minutes: e.target.value })} />
            </Field>
            <Field label="Cook (min)">
              <TextInput type="number" min="0" inputMode="numeric" value={form.cook_minutes} onChange={(e) => set({ cook_minutes: e.target.value })} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <PhotoInput supabase={supabase} folder="recipes" value={form.image_url} onChange={(image_url) => set({ image_url })} label="Finished-dish photo" />
          </div>
        </div>
      </Card>

      <Card title="Ingredients" aside={<PasteBox label="Paste ingredients" placeholder={"2 ripe bananas\n1 cup oats\n½ tsp cinnamon"} onAdd={(text) => set({ ingredients: [...form.ingredients, ...toIngredientRows(text.split("\n").map(parseIngredientLine).filter(Boolean))] })} />}>
        <ul className="space-y-2">
          {form.ingredients.map((row, i) => {
            const bad = row.amountText.trim() && parseAmount(row.amountText) == null;
            return (
              <li key={row.key} className="flex flex-wrap items-center justify-end gap-2 border-b-2 border-ink/10 pb-2 sm:flex-nowrap sm:border-0 sm:pb-0">
                <span className="flex min-w-0 basis-full gap-2 sm:basis-auto sm:flex-1">
                <TextInput aria-label="Amount" placeholder="1 ½" value={row.amountText} onChange={(e) => setRow("ingredients", i, { amountText: e.target.value })} className={`w-16 shrink-0 px-3 sm:w-20 ${bad ? "border-pink-deep" : ""}`} />
                <TextInput aria-label="Unit" placeholder="cups" value={row.unit} onChange={(e) => setRow("ingredients", i, { unit: e.target.value })} className="w-20 shrink-0 px-3 sm:w-24" />
                <TextInput aria-label="Ingredient" placeholder="rolled oats" value={row.item} onChange={(e) => setRow("ingredients", i, { item: e.target.value })} className="min-w-0 flex-1" />
                </span>
                <RowTools
                  label="ingredient"
                  index={i}
                  count={form.ingredients.length}
                  onMove={(idx, dir) => set({ ingredients: moveItem(form.ingredients, idx, dir) })}
                  onRemove={(idx) => set({ ingredients: form.ingredients.filter((_, j) => j !== idx) })}
                />
              </li>
            );
          })}
        </ul>
        {badAmounts.length > 0 && <p className="mt-2 text-sm font-semibold text-pink-deep">Amounts should look like 2, 1/2, 1 1/2 or ½. Leave it blank for &ldquo;a pinch&rdquo;.</p>}
        <Button variant="ghost" className="mt-3" onClick={() => set({ ingredients: [...form.ingredients, { key: key(), amountText: "", unit: "", item: "" }] })}>
          + Add ingredient
        </Button>
      </Card>

      <Card title="Steps" aside={<PasteBox label="Paste steps" placeholder={"1. Mash the bananas\n2. Stir in the oats\n3. Bake 18 minutes"} onAdd={(text) => set({ steps: [...form.steps, ...toStepRows(parseStepsText(text))] })} />}>
        <ol className="space-y-3">
          {form.steps.map((row, i) => (
            <li key={row.key} className="rounded-[1.25rem] border-2 border-ink/30 p-3">
              <div className="flex items-start gap-2">
                <span className="mt-2 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-butter font-display">{i + 1}</span>
                <TextArea
                  aria-label={`Step ${i + 1}`}
                  rows={2}
                  value={row.text}
                  placeholder="What to do in this step"
                  onChange={(e) => {
                    const text = e.target.value;
                    // Suggest a timer from "bake 20 minutes" until she sets one herself.
                    const guess = !row.minutesTouched ? guessTimerSeconds(text) : null;
                    setRow("steps", i, { text, ...(guess && !row.minutesTouched ? { minutes: String(guess / 60) } : {}) });
                  }}
                  className="min-w-0 flex-1"
                />

              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-10">
              <label className="flex items-center gap-2 text-sm font-semibold">
                ⏱ Timer
                <TextInput
                  type="number"
                  min="0"
                  step="0.5"
                  inputMode="decimal"
                  placeholder="none"
                  value={row.minutes}
                  onChange={(e) => setRow("steps", i, { minutes: e.target.value, minutesTouched: true })}
                  className="w-24 py-1.5"
                />
                minutes
              </label>
              <span className="ml-auto">
                <RowTools
                  label="step"
                  index={i}
                  count={form.steps.length}
                  onMove={(idx, dir) => set({ steps: moveItem(form.steps, idx, dir) })}
                  onRemove={(idx) => set({ steps: form.steps.filter((_, j) => j !== idx) })}
                />
              </span>
              </div>
            </li>
          ))}
        </ol>
        <Button variant="ghost" className="mt-3" onClick={() => set({ steps: [...form.steps, { key: key(), text: "", minutes: "" }] })}>
          + Add step
        </Button>
      </Card>

      <Card title="Tips">
        <TextArea rows={3} value={form.tips} onChange={(e) => set({ tips: e.target.value })} placeholder="Swaps, storage, how long it keeps…" aria-label="Tips" />
        <Field label="Link name" className="mt-4" hint="Used in the web address. Lowercase letters, numbers and dashes.">
          <TextInput
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set({ slug: slugify(e.target.value) });
            }}
          />
        </Field>
      </Card>

      <Card title="Use it in a post">
        <p className="mb-3 text-ink/75">Paste this on its own line anywhere in a post and the full recipe card shows there, with timers and the servings scaler:</p>
        <CopyCode code={cardToken("recipe", rec.record.slug || form.slug || "link-name")} disabled={!rec.record.slug} />
        {!rec.record.slug && <p className="mt-2 text-sm text-ink/60">Save it first, then copy the code.</p>}
        <p className="mt-2 text-sm text-ink/60">Or use &ldquo;+ Recipe card&rdquo; in the post editor.</p>
      </Card>

      <div className="sticky bottom-3 z-30 space-y-3 rounded-[1.75rem] border-[3px] border-ink bg-paper p-3 shadow-[4px_4px_0_var(--shadow)]">
        <Notice notice={rec.notice} />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => save()} disabled={!canSave || rec.saving}>
            {rec.saving ? "Saving…" : "Save"}
          </Button>
          {!rec.isNew && <span className="ml-auto"><DeleteButton onDelete={() => rec.remove(["/blog"])} label="Delete recipe" /></span>}
        </div>
      </div>

      {recipe.title && (recipe.ingredients.length > 0 || recipe.steps.length > 0) && (
        <div>
          <h2 className="mb-3 font-display text-2xl tracking-wide">Preview</h2>
          <RecipeCard recipe={recipe} />
        </div>
      )}
    </div>
  );
}

export default function RecipeEditor() {
  const { id } = useParams();
  const rec = useRecord("recipes", id, BLANK, "/admin/recipes");
  if (rec.missing) return <Notice notice={{ type: "error", text: "That recipe doesn't exist (it may have been deleted)." }} />;
  if (!rec.record) return <p className="animate-pulse font-semibold text-ink/60">Loading…</p>;
  return <RecipeForm key={rec.record.id || "new"} initial={rec.record} rec={rec} />;
}
