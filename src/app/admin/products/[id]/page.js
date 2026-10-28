"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PickCard, ProductEmbed } from "@/components/Cards";
import RichEditor from "@/components/admin/RichEditor";
import { useHasColumn, useRecord } from "@/components/admin/useRecord";
import { useAdmin } from "@/components/admin/AdminShell";
import { Button, Card, CopyCode, DeleteButton, Field, Notice, PhotoInput, RowTools, Segmented, Select, TextArea, TextInput, moveItem, uploadPhoto } from "@/components/admin/AdminUI";
import { SHOP_SECTIONS } from "@/lib/content";
import { cardToken, cleanDetails } from "@/lib/data";
import { slugify } from "@/lib/recipe";
import { amazonImageUrl, isAmazonShortLink, isAmazonUrl, withAmazonImage, withAmazonTag } from "@/lib/amazon";

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
  fave: false,
  details: "",
  photos: [],
  sort: 0,
  status: "draft",
};

const MAX_PHOTOS = 8;
const NO_LIBRARY = { products: [], recipes: [], loaded: true };

const COLORS = [
  { value: "pink", label: "Pink", cls: "bg-pink" },
  { value: "butter", label: "Butter", cls: "bg-butter" },
  { value: "periwinkle", label: "Periwinkle", cls: "bg-periwinkle" },
  { value: "mint", label: "Mint", cls: "bg-mint" },
];

const pathsFor = (slug) => ["/", "/shop", "/blog", ...(slug ? [`/shop/${slug}`] : [])];

function isHttps(url) {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function ProductForm({ initial, rec }) {
  const { supabase } = useAdmin();
  // Fave, review and photos need migration 0005; until it's run the
  // editor saves the old fields only and every live pick is in the shop.
  const hasFaves = useHasColumn("products", "fave");
  const [form, setForm] = useState(() => ({
    ...BLANK,
    ...initial,
    note: initial.note || "",
    url: initial.url || "",
    price_label: initial.price_label || "",
    details: cleanDetails(initial.details),
    photos: Array.isArray(initial.photos) ? initial.photos : [],
    fave: initial.fave ?? false,
  }));
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
    url: withAmazonTag(url) || null,
    price_label: form.price_label.trim() || null,
    section: form.section,
    color: form.color,
    featured: form.featured,
    sort: Number(form.sort) || 0,
    status: form.status,
    ...(hasFaves ? { fave: form.fave, details: form.details.trim() || null, photos: form.photos.filter(Boolean) } : {}),
  };
  // A short Amazon link names no product, so ask the server to follow it.
  const [shortLink, setShortLink] = useState({ url: "", asin: null });
  useEffect(() => {
    if (!isAmazonShortLink(url)) return;
    let live = true;
    const timer = setTimeout(async () => {
      let asin = null;
      try {
        const { data } = await supabase.auth.getSession();
        const res = await fetch(`/api/admin/amazon-image?url=${encodeURIComponent(url)}`, {
          headers: { Authorization: `Bearer ${data.session?.access_token || ""}` },
        });
        asin = (await res.json()).asin || null;
      } catch {}
      if (live) setShortLink({ url, asin });
    }, 500);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [url, supabase]);
  const shortAsin = shortLink.url === url ? shortLink.asin : null;
  const checkingShort = isAmazonShortLink(url) && shortLink.url !== url;
  const amazonPhoto = Boolean(amazonImageUrl(url) || shortAsin);

  const PATHS = pathsFor(form.slug);
  const uploadBodyPhoto = async (file) => {
    const { url: uploaded, error } = await uploadPhoto(supabase, "products", file);
    if (error) rec.setNotice({ type: "error", text: error });
    return error ? null : uploaded;
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
          <Field label="Shop link" className="sm:col-span-2" hint="Paste any Amazon product page and our tag is added for you. Other affiliate links work too. Must start with https://">
            <TextInput type="url" inputMode="url" value={form.url} placeholder="https://www.amazon.com/dp/…" onChange={(e) => set({ url: e.target.value })} className={badUrl ? "border-pink-deep" : ""} />
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
            {!form.image_url && url && (isAmazonUrl(url) || isAmazonShortLink(url)) && (
              <p className="mt-2 text-sm text-ink/70">
                {amazonPhoto
                  ? "No photo? Amazon's own product photo shows instead. Add yours any time and it takes over."
                  : checkingShort
                    ? "Finding Amazon's product photo for this link…"
                    : isAmazonShortLink(url)
                      ? "Couldn't find the product behind this short link. Paste the full amazon.com/dp/… link instead, or add your own photo."
                      : "This is a search link, so there's no one product to show. Paste the product's own amazon.com/dp/… link, or add your own photo."}
              </p>
            )}
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
          {hasFaves !== false && (
            <label className="flex items-start gap-3 font-semibold">
              <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--pink)]" checked={form.fave} onChange={(e) => set({ fave: e.target.checked, ...(e.target.checked ? {} : { featured: false }) })} />
              <span>
                It&rsquo;s one of my faves
                <span className="block text-sm font-normal text-ink/60">
                  Shows it in the shop with its own page. Leave it off for picks that are only in a post, like the other car seats in a roundup.
                </span>
              </span>
            </label>
          )}
          <label className={`flex items-center gap-3 font-semibold ${hasFaves !== false && !form.fave ? "opacity-50" : ""}`}>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[var(--pink)]"
              checked={form.featured}
              disabled={hasFaves !== false && !form.fave}
              onChange={(e) => set({ featured: e.target.checked })}
            />
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

      {hasFaves && form.fave && (
        <Card title="Its page">
          <p className="mb-4 text-ink/75">
            Your faves each get a page{form.slug ? <> at <span className="font-semibold">/shop/{form.slug}</span></> : ""}. Go as deep as you like: how you use it, what you&rsquo;d change, photos of it in real life. Posts and recipes that use this pick show under it on their own.
          </p>
          <span className="mb-1.5 block font-display tracking-wide">More photos</span>
          <div className="flex flex-wrap gap-4">
            {form.photos.map((src, i) => (
              <div key={src} className="space-y-1">
                <PhotoInput supabase={supabase} folder="products" value={src} label={`Photo ${i + 2}`} onChange={(url) => set({ photos: url ? form.photos.map((p, j) => (j === i ? url : p)) : form.photos.filter((_, j) => j !== i) })} />
                <RowTools index={i} count={form.photos.length} label={`photo ${i + 2}`} onMove={(index, dir) => set({ photos: moveItem(form.photos, index, dir) })} onRemove={() => set({ photos: form.photos.filter((_, j) => j !== i) })} />
              </div>
            ))}
            {form.photos.length < MAX_PHOTOS && (
              <PhotoInput key={form.photos.length} supabase={supabase} folder="products" value={null} label="Add a photo" onChange={(url) => url && set({ photos: [...form.photos, url] })} />
            )}
          </div>
          <p className="mt-2 text-sm text-ink/60">The product photo above comes first. Up to {MAX_PHOTOS} more.</p>
          <div className="mt-6">
            <span className="mb-1.5 block font-display tracking-wide">Your review</span>
            <RichEditor
              value={form.details}
              onChange={(details) => set({ details })}
              library={NO_LIBRARY}
              onUploadPhoto={uploadBodyPhoto}
              placeholder="Why it's a fave, how you use it, anything you'd change…"
            />
            <p className="mt-2 text-sm text-ink/60">Optional. Headings, lists and photos all work, like in a post.</p>
          </div>
        </Card>
      )}

      <Card title="Use it in a post">
        <p className="mb-3 text-ink/75">Paste this on its own line anywhere in a post and it shows there as a card with your link:</p>
        <CopyCode code={cardToken("product", rec.record.slug || form.slug || "link-name")} disabled={!rec.record.slug} />
        {!rec.record.slug && <p className="mt-2 text-sm text-ink/60">Save it first, then copy the code.</p>}
        <p className="mt-2 text-sm text-ink/60">Or use &ldquo;+ Product card&rdquo; in the post editor.</p>
      </Card>

      <div className="sticky bottom-3 z-30 space-y-3 rounded-[1.75rem] border-[3px] border-ink bg-paper p-3 shadow-[4px_4px_0_var(--shadow)]">
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
            <PickCard pick={withAmazonImage({ ...values, fave: false }, shortAsin)} />
            <ProductEmbed product={withAmazonImage(values, shortAsin)} />
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
