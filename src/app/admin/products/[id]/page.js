"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { PickCard, ProductEmbed } from "@/components/Cards";
import { useRecord } from "@/components/admin/useRecord";
import { useAdmin } from "@/components/admin/AdminShell";
import { Button, Card, CopyCode, DeleteButton, Field, Notice, PhotoInput, Segmented, Select, TextArea, TextInput } from "@/components/admin/AdminUI";
import { SHOP_SECTIONS } from "@/lib/content";
import { cardToken } from "@/lib/data";
import { slugify } from "@/lib/recipe";

const BLANK = {
  name: "",
  slug: "",
  note: "",
  image_url: null,
  url: "",
  price_label: "",
  section: "baby",
  color: "pink",
  featured: false,
  sort: 0,
  status: "draft",
};

const COLORS = [
  { value: "pink", label: "Pink", cls: "bg-pink" },
  { value: "butter", label: "Butter", cls: "bg-butter" },
  { value: "periwinkle", label: "Periwinkle", cls: "bg-periwinkle" },
  { value: "mint", label: "Mint", cls: "bg-mint" },
];

const PATHS = ["/", "/shop", "/blog"];

function isHttps(url) {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function ProductForm({ initial, rec }) {
  const { supabase } = useAdmin();
  const [form, setForm] = useState(() => ({ ...BLANK, ...initial, note: initial.note || "", url: initial.url || "", price_label: initial.price_label || "" }));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const url = form.url.trim();
  const badUrl = url && !isHttps(url);
  const canSave = form.name.trim() && form.slug && !badUrl;
  const values = {
    name: form.name.trim(),
    slug: form.slug,
    note: form.note.trim() || null,
    image_url: form.image_url,
    url: url || null,
    price_label: form.price_label.trim() || null,
    section: form.section,
    color: form.color,
    featured: form.featured,
    sort: Number(form.sort) || 0,
    status: form.status,
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/products" className="text-sm font-semibold text-ink/60 hover:underline">
            ← Shop
          </Link>
          <h1 className="font-display text-4xl tracking-wide">{rec.isNew ? "New pick" : form.name || "Pick"}</h1>
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

      <Card title="The product">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" className="sm:col-span-2">
            <TextInput
              value={form.name}
              placeholder="Silicone suction plates"
              onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
            />
          </Field>
          <Field label="Why you love it" className="sm:col-span-2" hint="One or two sentences in your own words.">
            <TextArea rows={2} value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="The only plates that survived my toddler's throwing phase." />
          </Field>
          <Field label="Shop link" className="sm:col-span-2" hint="Your Amazon or affiliate link. Must start with https://">
            <TextInput type="url" inputMode="url" value={form.url} placeholder="https://amzn.to/…" onChange={(e) => set({ url: e.target.value })} className={badUrl ? "border-pink-deep" : ""} />
          </Field>
          {badUrl && <p className="-mt-2 text-sm font-semibold text-pink-deep sm:col-span-2">That link needs to start with https://</p>}
          <Field label="Price (optional)" hint="Like $24 or Under $30.">
            <TextInput value={form.price_label} onChange={(e) => set({ price_label: e.target.value })} />
          </Field>
          <Field label="Shop section">
            <Select value={form.section} onChange={(e) => set({ section: e.target.value })} options={SHOP_SECTIONS.filter((s) => s.key !== "all").map((s) => ({ value: s.key, label: s.label }))} />
          </Field>
          <div className="sm:col-span-2">
            <PhotoInput supabase={supabase} folder="products" value={form.image_url} onChange={(image_url) => set({ image_url })} label="Product photo" />
          </div>
        </div>
      </Card>

      <Card title="How it looks">
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block font-display tracking-wide">Card color</span>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={form.color === c.value}
                  onClick={() => set({ color: c.value })}
                  className={`flex items-center gap-2 rounded-full border-[2.5px] border-ink px-3 py-1.5 text-sm font-semibold ${form.color === c.value ? "bg-ink text-paper" : "bg-paper"}`}
                >
                  <span className={`h-4 w-4 rounded-full border-2 border-ink ${c.cls}`} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" className="h-5 w-5 accent-[var(--pink)]" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} />
            Show it on the home page
          </label>
          <Field label="Link name" hint="Lowercase letters, numbers and dashes. Posts use it to show this card.">
            <TextInput
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set({ slug: slugify(e.target.value) });
              }}
            />
          </Field>
        </div>
      </Card>

      <Card title="Use it in a post">
        <p className="mb-3 text-ink/75">Paste this on its own line anywhere in a post and it shows there as a card with your link:</p>
        <CopyCode code={cardToken("product", rec.record.slug || form.slug || "link-name")} disabled={!rec.record.slug} />
        {!rec.record.slug && <p className="mt-2 text-sm text-ink/60">Save it first, then copy the code.</p>}
        <p className="mt-2 text-sm text-ink/60">Or use &ldquo;+ Product card&rdquo; in the post editor.</p>
      </Card>

      <div className="sticky bottom-3 z-30 space-y-3 rounded-[1.75rem] border-[3px] border-ink bg-paper p-3 shadow-[4px_4px_0_var(--ink)]">
        <Notice notice={rec.notice} />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => rec.save(values, { message: form.status === "published" ? "Saved. It's in the shop now." : "Saved as a draft.", paths: PATHS })} disabled={!canSave || rec.saving}>
            {rec.saving ? "Saving…" : "Save"}
          </Button>
          {!rec.isNew && (
            <span className="ml-auto">
              <DeleteButton onDelete={() => rec.remove(PATHS)} label="Delete pick" />
            </span>
          )}
        </div>
      </div>

      {values.name && (
        <div>
          <h2 className="mb-3 font-display text-2xl tracking-wide">Preview</h2>
          <div className="grid gap-6 sm:grid-cols-[14rem_1fr] sm:items-start">
            <PickCard pick={values} />
            <ProductEmbed product={values} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductEditor() {
  const { id } = useParams();
  const rec = useRecord("products", id, BLANK, "/admin/products");
  if (rec.missing) return <Notice notice={{ type: "error", text: "That pick doesn't exist (it may have been deleted)." }} />;
  if (!rec.record) return <p className="animate-pulse font-semibold text-ink/60">Loading…</p>;
  return <ProductForm key={rec.record.id || "new"} initial={rec.record} rec={rec} />;
}
