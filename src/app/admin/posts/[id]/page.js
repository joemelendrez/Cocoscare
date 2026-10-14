"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import RecipeCard from "@/components/RecipeCard";
import { ProductEmbed } from "@/components/Cards";
import { useRecord } from "@/components/admin/useRecord";
import { useAdmin } from "@/components/admin/AdminShell";
import { Button, Card, DeleteButton, Field, Notice, PhotoInput, Segmented, Select, StatusPill, TextArea, TextInput, friendlyError, uploadPhoto } from "@/components/admin/AdminUI";
import { CATEGORIES } from "@/lib/content";
import { productSlugsIn, recipeSlugsIn } from "@/lib/data";
import { bodySegments } from "@/lib/postBody";
import FaqBlock from "@/components/FaqBlock";
import RichEditor from "@/components/admin/RichEditor";
import { slugify } from "@/lib/recipe";

const BLANK = {
  title: "",
  slug: "",
  category: "recipes",
  excerpt: "",
  body: "",
  cover_url: null,
  recipe_id: null,
  status: "draft",
  published_at: null,
};

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "Ready for review" },
  { value: "published", label: "Live" },
];

// Recipes and picks to choose from, drafts included.
function useLibrary(supabase) {
  const [lib, setLib] = useState({ recipes: [], products: [], loaded: false });
  useEffect(() => {
    let live = true;
    Promise.all([
      supabase.from("recipes").select("*").order("updated_at", { ascending: false }),
      supabase.from("products").select("id, slug, name, note, image_url, url, price_label, section, color, status").order("name"),
    ]).then(([r, p]) => {
      if (live) setLib({ recipes: r.data || [], products: p.data || [], loaded: true });
    });
    return () => {
      live = false;
    };
  }, [supabase]);
  return lib;
}

function PostForm({ initial, rec }) {
  const { supabase } = useAdmin();
  const lib = useLibrary(supabase);
  const [form, setForm] = useState(() => ({ ...BLANK, ...initial, excerpt: initial.excerpt || "", body: initial.body || "" }));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  const [picking, setPicking] = useState(null); // "product" | "recipe" | null
  const [tab, setTab] = useState("write");
  const cardInserterRef = useRef(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const recipe = lib.recipes.find((r) => r.id === form.recipe_id) || null;
  const usedSlugs = productSlugsIn(form.body);
  const usedProducts = lib.products.filter((p) => usedSlugs.includes(p.slug));
  const usedRecipeSlugs = recipeSlugsIn(form.body);
  const usedRecipes = usedRecipeSlugs.map((s) => lib.recipes.find((r) => r.slug === s)).filter(Boolean);
  const missingSlugs = lib.loaded
    ? [...usedSlugs.filter((s) => !lib.products.some((p) => p.slug === s)), ...usedRecipeSlugs.filter((s) => !lib.recipes.some((r) => r.slug === s))]
    : [];
  const canSave = form.title.trim() && form.slug;

  // Photos added in the editor go to storage first; null if that failed.
  const uploadBodyPhoto = async (file) => {
    const { url, error } = await uploadPhoto(supabase, "posts", file);
    if (error) rec.setNotice({ type: "error", text: error });
    return error ? null : url;
  };

  const save = async () => {
    const goingLive = form.status === "published";
    const values = {
      title: form.title.trim(),
      slug: form.slug,
      category: form.category,
      excerpt: form.excerpt.trim() || null,
      body: form.body,
      cover_url: form.cover_url,
      recipe_id: form.recipe_id || null,
      status: form.status,
      published_at: goingLive ? form.published_at || new Date().toISOString() : form.published_at,
    };

    // A live post shows its recipe and picks only if they're live too.
    let alsoLive = [];
    if (goingLive) {
      const drafts = [
        ...[...new Set([recipe, ...usedRecipes].filter(Boolean))].filter((r) => r.status !== "published").map((r) => ({ table: "recipes", id: r.id, name: r.title })),
        ...usedProducts.filter((p) => p.status !== "published").map((p) => ({ table: "products", id: p.id, name: p.name })),
      ];
      for (const d of drafts) {
        const { error } = await supabase.from(d.table).update({ status: "published" }).eq("id", d.id);
        if (error) return rec.setNotice({ type: "error", text: friendlyError(error) });
        alsoLive.push(d.name);
      }
    }

    const message = goingLive
      ? `Live!${alsoLive.length ? ` Also put live: ${alsoLive.join(", ")}.` : ""}`
      : form.status === "review"
        ? "Saved and marked ready for review."
        : "Saved as a draft.";
    const saved = await rec.save(values, { message, paths: ["/", "/blog", `/blog/${values.slug}`, ...(alsoLive.length ? ["/shop"] : [])] });
    if (saved) set({ published_at: saved.published_at });
  };

  const segments = bodySegments(form.body, { products: usedProducts, recipes: usedRecipes });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm font-semibold text-ink/60 hover:underline">
            ← Posts
          </Link>
          <h1 className="font-display text-4xl tracking-wide">{form.title || "Post"}</h1>
          {!rec.isNew && (
            <p className="mt-1 flex items-center gap-2 text-sm text-ink/60">
              Saved as <StatusPill status={rec.record.status} />
              {rec.record.status === "published" && (
                <Link href={`/blog/${rec.record.slug}`} target="_blank" className="font-semibold hover:underline">
                  Open post ↗
                </Link>
              )}
            </p>
          )}
        </div>
        <Segmented label="Status" value={form.status} onChange={(status) => set({ status })} options={STATUSES} />
      </div>

      <Card title="The basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <TextInput
              value={form.title}
              placeholder="Our favorite rainy-day spots in town"
              onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
            />
          </Field>
          <Field label="Category">
            <Select value={form.category} onChange={(e) => set({ category: e.target.value })} options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} />
          </Field>
          <Field label="Link name" hint="Lowercase letters, numbers and dashes.">
            <TextInput
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set({ slug: slugify(e.target.value) });
              }}
            />
          </Field>
          <Field label="Short summary" className="sm:col-span-2" hint="Shows on the blog card and in Google. About 150 characters.">
            <TextArea rows={2} value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
          </Field>
          <span className={`-mt-3 text-right text-xs sm:col-span-2 ${form.excerpt.length > 160 ? "font-semibold text-pink-deep" : "text-ink/50"}`}>{form.excerpt.length}/160</span>
          <div className="sm:col-span-2">
            <PhotoInput supabase={supabase} folder="posts" value={form.cover_url} onChange={(cover_url) => set({ cover_url })} label="Cover photo (best tall, like a Pin)" />
          </div>
        </div>
      </Card>

      <Card title="Recipe card at the end" aside={<Link href="/admin/recipes/new" className="text-sm font-semibold text-pink-deep hover:underline">New recipe</Link>}>
        <Select
          aria-label="Recipe"
          value={form.recipe_id || ""}
          onChange={(e) => set({ recipe_id: e.target.value || null })}
          options={[{ value: "", label: lib.loaded ? "No recipe card" : "Loading…" }, ...lib.recipes.map((r) => ({ value: r.id, label: `${r.title}${r.status === "published" ? "" : " (draft)"}` }))]}
        />
        <p className="mt-2 text-sm text-ink/60">It shows after the post with timers, a servings scaler and a print button. To put a recipe card somewhere in the middle, use &ldquo;+ Recipe card&rdquo; below.</p>
      </Card>

      <Card
        title="The post"
        aside={<Segmented label="View" value={tab} onChange={setTab} options={[{ value: "write", label: "Write" }, { value: "preview", label: "Preview" }]} />}
      >
        {tab === "write" ? (
          <>
            {picking && (
              <div className="mb-3 max-h-72 overflow-y-auto rounded-2xl border-2 border-dashed border-ink/50 p-2">
                {(picking === "product" ? lib.products : lib.recipes).length === 0 ? (
                  <p className="p-2 text-sm text-ink/70">
                    {picking === "product" ? "No picks yet. " : "No recipes yet. "}
                    <Link href={picking === "product" ? "/admin/products/new" : "/admin/recipes/new"} className="font-semibold text-pink-deep hover:underline">
                      {picking === "product" ? "Add one in Shop" : "Build one in Recipes"}
                    </Link>{" "}
                    first.
                  </p>
                ) : (
                  <ul>
                    {(picking === "product" ? lib.products : lib.recipes).map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-blush"
                          onClick={() => {
                            cardInserterRef.current?.(picking, item.slug);
                            setPicking(null);
                          }}
                        >
                          <span className="font-semibold">{item.name || item.title}</span>
                          <span className="text-xs text-ink/60">{item.status === "published" ? "" : "draft"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <RichEditor
              value={form.body}
              onChange={(body) => set({ body })}
              library={{ ...lib }}
              onUploadPhoto={uploadBodyPhoto}
              onOpenPicker={(kind) => setPicking((v) => (v === kind ? null : kind))}
              cardInserterRef={cardInserterRef}
              placeholder="Start with a line or two about why this matters to you."
            />
            <p className="mt-2 text-sm text-ink/60">
              Select words to make them bold, italic or a link. Drag a card to move it. Preview shows the post exactly as readers see it.
            </p>
            {missingSlugs.length > 0 && (
              <p className="mt-2 text-sm font-semibold text-pink-deep">Nothing has the link name {missingSlugs.join(", ")}, so that card won&rsquo;t show.</p>
            )}
          </>
        ) : (
          <div className="space-y-6">
            {form.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element -- storage URL preview
              <img src={form.cover_url} alt="" className="max-h-96 w-full rounded-[1.25rem] border-[3px] border-ink object-cover" />
            )}
            <div className="space-y-[1.1em]">
              {segments.length === 0 && <p className="text-ink/60">Nothing written yet.</p>}
              {segments.map((s, i) =>
                s.type === "html" ? (
                  <div key={i} className="post-body" dangerouslySetInnerHTML={{ __html: s.html }} />
                ) : s.type === "faq" ? (
                  <FaqBlock key={i} title={s.title} items={s.items} />
                ) : s.type === "recipe" ? (
                  <RecipeCard key={i} recipe={s.recipe} anchor={false} />
                ) : (
                  <div key={i} className="post-body">
                    <ProductEmbed product={s.product} />
                  </div>
                ),
              )}
            </div>
            {recipe && <RecipeCard recipe={recipe} anchor={false} />}
          </div>
        )}
      </Card>

      <div className="sticky bottom-3 z-30 space-y-3 rounded-[1.75rem] border-[3px] border-ink bg-paper p-3 shadow-[4px_4px_0_var(--ink)]">
        <Notice notice={rec.notice} />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={!canSave || rec.saving}>
            {rec.saving ? "Saving…" : form.status === "published" ? "Save & put live" : form.status === "review" ? "Save & send for review" : "Save draft"}
          </Button>
          {!rec.isNew && (
            <span className="ml-auto">
              <DeleteButton onDelete={() => rec.remove(["/", "/blog", `/blog/${rec.record.slug}`])} label="Delete post" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostEditor() {
  const { id } = useParams();
  const rec = useRecord("posts", id, BLANK, "/admin/posts");
  // Posts start in Handoff Hero; this page finishes them.
  if (rec.isNew)
    return (
      <Card title="Posts start in Handoff Hero">
        <p className="text-ink/75">Write it there and send it to your blog as a draft. It then shows on the Posts page under &ldquo;From Handoff Hero&rdquo;, ready to finish here.</p>
        <Link href="/admin" className="mt-3 inline-block font-semibold text-pink-deep underline">
          ← Posts
        </Link>
      </Card>
    );
  if (rec.missing) return <Notice notice={{ type: "error", text: "That post doesn't exist (it may have been deleted)." }} />;
  if (!rec.record) return <p className="animate-pulse font-semibold text-ink/60">Loading…</p>;
  return <PostForm key={rec.record.id || "new"} initial={rec.record} rec={rec} />;
}
