"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import RecipeCard from "@/components/RecipeCard";
import { ProductEmbed } from "@/components/Cards";
import { useRecord } from "@/components/admin/useRecord";
import { RowThumb } from "@/components/admin/AdminList";
import { useAdmin } from "@/components/admin/AdminShell";
import { Button, Card, DeleteButton, adminFetch, Field, Notice, PhotoInput, Segmented, Select, StatusPill, TextArea, TextInput, friendlyError, uploadPhoto } from "@/components/admin/AdminUI";
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
  { value: "draft", label: "Draft", hint: "Only you can see it." },
  { value: "review", label: "Ready for review", hint: "Joseph takes a look before it goes live." },
  { value: "published", label: "Live", hint: "Readers can see it now." },
];

// The fields compared to spot unsaved changes.
const snapshot = (f) =>
  JSON.stringify([f.title, f.slug, f.category, f.excerpt, f.body, f.cover_url, f.recipe_id, f.status]);

// Recipes and picks to choose from, drafts included. `onLoad` runs once
// with them, after the first load.
function useLibrary(supabase, onLoad) {
  const [lib, setLib] = useState({ recipes: [], products: [], loaded: false });
  useEffect(() => {
    let live = true;
    Promise.all([
      supabase.from("recipes").select("*").order("updated_at", { ascending: false }),
      supabase.from("products").select("id, slug, name, note, image_url, url, price_label, section, color, status").order("name"),
    ]).then(([r, p]) => {
      if (!live) return;
      setLib({ recipes: r.data || [], products: p.data || [], loaded: true });
      onLoad?.({ recipes: r.data || [], products: p.data || [] });
    });
    return () => {
      live = false;
    };
    // onLoad is only for the first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);
  return lib;
}

function PostForm({ initial, rec, startRecipeId }) {
  const { supabase } = useAdmin();
  const [form, setForm] = useState(() => ({ ...BLANK, ...initial, excerpt: initial.excerpt || "", body: initial.body || "", recipe_id: initial.recipe_id || startRecipeId || null }));
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug));
  // A new post started from a recipe ("Write a post with this recipe")
  // borrows its name, summary and photo until they're changed.
  const lib = useLibrary(supabase, ({ recipes }) => {
    const r = startRecipeId && recipes.find((x) => x.id === startRecipeId);
    if (!r) return;
    setForm((f) => ({
      ...f,
      title: f.title || r.title,
      slug: f.slug || slugify(r.title),
      category: "recipes",
      excerpt: f.excerpt || r.summary || "",
      cover_url: f.cover_url || r.image_url || null,
    }));
  });
  const [picking, setPicking] = useState(null); // "product" | "recipe" | null
  const [pickQuery, setPickQuery] = useState("");
  const [tab, setTab] = useState("write");
  const [baseline, setBaseline] = useState(() => snapshot(form));
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
    if (saved) {
      set({ published_at: saved.published_at });
      setBaseline(snapshot(form));
    }
  };

  const segments = bodySegments(form.body, { products: usedProducts, recipes: usedRecipes });

  // A post pulled in from Handoff Hero also has a WordPress copy. That goes
  // to WordPress's Trash first, or the inbox would offer it again.
  const removePost = async () => {
    if (rec.record.wordpress_id) {
      try {
        await adminFetch(supabase, "/api/admin/wordpress", { method: "DELETE", body: JSON.stringify({ id: rec.record.wordpress_id }) });
      } catch (err) {
        rec.setNotice({ type: "error", text: `Couldn't delete the WordPress copy, so nothing was deleted. ${err.message}` });
        return false;
      }
    }
    setBaseline(snapshot(form));
    return rec.remove(["/", "/blog", `/blog/${rec.record.slug}`]);
  };

  // Unsaved changes: warn before leaving, and Ctrl/Cmd+S saves.
  const dirty = snapshot(form) !== baseline;
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (canSave && !rec.saving) saveRef.current();
      }
    };
    const onLeave = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [dirty, canSave, rec.saving]);

  const words = form.body.replace(/\{\{[^}]+\}\}|[#*_>\[\]()!-]/g, " ").split(/\s+/).filter(Boolean).length;
  const checks = [
    { ok: Boolean(form.title.trim()), text: "A title" },
    { ok: Boolean(form.cover_url), text: "A cover photo" },
    { ok: form.excerpt.trim().length > 0 && form.excerpt.length <= 160, text: "A short summary (160 characters or less)" },
    { ok: words >= 150, text: `Some words in the post (${words} so far)` },
    ...(missingSlugs.length ? [{ ok: false, text: "Every card points at a real recipe or pick" }] : []),
  ];
  const ready = checks.every((c) => c.ok);
  const saveLabel = rec.saving
    ? "Saving…"
    : form.status === "published"
      ? "Save & put live"
      : form.status === "review"
        ? "Save & send for review"
        : "Save draft";
  const pickList = (picking === "product" ? lib.products : lib.recipes).filter((item) =>
    `${item.name || item.title}`.toLowerCase().includes(pickQuery.trim().toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/posts" className="text-sm font-semibold text-ink/60 hover:underline">
          ← All posts
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink/60">
          {rec.isNew ? "New post, not saved yet" : <>Saved as <StatusPill status={rec.record.status} /></>}
          {dirty && !rec.saving && <span className="font-semibold text-pink-deep">· Unsaved changes</span>}
          {!rec.isNew && rec.record.status === "published" && (
            <Link href={`/blog/${rec.record.slug}`} target="_blank" className="font-semibold hover:underline">
              Open post ↗
            </Link>
          )}
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-5">
          <textarea
            aria-label="Title"
            rows={1}
            value={form.title}
            placeholder="Post title"
            onChange={(e) => set({ title: e.target.value.replace(/\n/g, " "), ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
            className="field-sizing-content block w-full resize-none rounded-[1.5rem] border-[3px] border-ink bg-paper px-5 py-3 font-display text-3xl leading-tight tracking-wide outline-none focus:shadow-[4px_4px_0_var(--pink)] sm:text-4xl"
          />

          <Card
            title="The post"
            aside={<Segmented label="View" value={tab} onChange={setTab} options={[{ value: "write", label: "Write" }, { value: "preview", label: "Preview" }]} />}
          >
            {tab === "write" ? (
              <>
                {picking && (
                  <div className="mb-3 rounded-2xl border-2 border-dashed border-ink/50 p-2">
                    <div className="flex items-center gap-2 p-1">
                      <input
                        type="search"
                        autoFocus
                        value={pickQuery}
                        onChange={(e) => setPickQuery(e.target.value)}
                        placeholder={picking === "product" ? "Find a pick" : "Find a recipe"}
                        aria-label={picking === "product" ? "Find a pick" : "Find a recipe"}
                        className="min-w-0 flex-1 rounded-full border-2 border-ink bg-paper px-4 py-1.5 outline-none"
                      />
                      <button type="button" onClick={() => setPicking(null)} className="rounded-full px-3 py-1.5 text-sm font-semibold hover:bg-blush">
                        Close
                      </button>
                    </div>
                    {(picking === "product" ? lib.products : lib.recipes).length === 0 ? (
                      <p className="p-2 text-sm text-ink/70">
                        {picking === "product" ? "No picks yet. " : "No recipes yet. "}
                        <Link href={picking === "product" ? "/admin/products/new" : "/admin/recipes/new"} className="font-semibold text-pink-deep hover:underline">
                          {picking === "product" ? "Add one in Shop" : "Build one in Recipes"}
                        </Link>{" "}
                        first.
                      </p>
                    ) : pickList.length === 0 ? (
                      <p className="p-2 text-sm text-ink/70">Nothing matches that.</p>
                    ) : (
                      <ul className="max-h-72 overflow-y-auto">
                        {pickList.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-blush"
                              onClick={() => {
                                cardInserterRef.current?.(picking, item.slug);
                                setPicking(null);
                              }}
                            >
                              <RowThumb src={item.image_url} fallback={picking === "product" ? "💗" : "🍪"} />
                              <span className="min-w-0 flex-1 break-words font-semibold">{item.name || item.title}</span>
                              {item.status !== "published" && <span className="shrink-0 text-xs text-ink/60">draft</span>}
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
                  onOpenPicker={(kind) => {
                    setPickQuery("");
                    setPicking((v) => (v === kind ? null : kind));
                  }}
                  cardInserterRef={cardInserterRef}
                  placeholder="Start with a line or two about why this matters to you."
                />
                <p className="mt-2 text-sm text-ink/60">
                  Select words to make them bold, italic or a link. Use the bag and spoon buttons to add a pick or recipe card, and drag a card to move it.
                </p>
                {missingSlugs.length > 0 && (
                  <p className="mt-2 text-sm font-semibold text-pink-deep">Nothing has the link name {missingSlugs.join(", ")}, so that card won&rsquo;t show.</p>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <h2 className="font-display text-3xl tracking-wide">{form.title || "Untitled post"}</h2>
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
                      <FaqBlock key={i} title={s.title} intro={s.intro} items={s.items} />
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
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <Card title="Publish">
            <div role="radiogroup" aria-label="Status" className="space-y-1.5">
              {STATUSES.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  role="radio"
                  aria-checked={form.status === st.value}
                  onClick={() => set({ status: st.value })}
                  className={`flex w-full items-start gap-3 rounded-2xl border-2 px-3 py-2 text-left ${
                    form.status === st.value ? "border-ink bg-pink-soft" : "border-ink/15 hover:border-ink/50"
                  }`}
                >
                  <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-ink ${form.status === st.value ? "bg-ink" : "bg-paper"}`} />
                  <span>
                    <span className="block font-semibold">{st.label}</span>
                    <span className="block text-sm text-ink/60">{st.hint}</span>
                  </span>
                </button>
              ))}
            </div>
            <Button onClick={save} disabled={!canSave || rec.saving} className="mt-4 hidden w-full lg:block">
              {saveLabel}
            </Button>
            <div className="mt-3 hidden lg:block">
              <Notice notice={rec.notice} />
            </div>
          </Card>

          <Card title="Before it goes live">
            <ul className="space-y-1.5 text-sm">
              {checks.map((c) => (
                <li key={c.text} className={`flex gap-2 ${c.ok ? "text-ink/55" : "font-semibold"}`}>
                  <span aria-hidden="true">{c.ok ? "✓" : "○"}</span>
                  <span>
                    {c.text}
                    <span className="sr-only">{c.ok ? ", done" : ", still to do"}</span>
                  </span>
                </li>
              ))}
            </ul>
            {ready && <p className="mt-2 text-sm font-semibold text-ink/70">All set. 🎉</p>}
          </Card>

          <Card title="Cover & summary">
            <div className="space-y-4">
              <PhotoInput supabase={supabase} folder="posts" value={form.cover_url} onChange={(cover_url) => set({ cover_url })} label="Cover photo (best tall, like a Pin)" />
              <Field label="Short summary" hint="Shows on the blog card and in Google.">
                <TextArea rows={4} value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
                <span className={`mt-1 block text-right text-xs ${form.excerpt.length > 160 ? "font-semibold text-pink-deep" : "text-ink/50"}`}>{form.excerpt.length}/160</span>
              </Field>
            </div>
          </Card>

          <Card title="Details">
            <div className="space-y-4">
              <Field label="Category">
                <Select value={form.category} onChange={(e) => set({ category: e.target.value })} options={CATEGORIES.map((c) => ({ value: c.key, label: c.label }))} />
              </Field>
              <Field label="Link name" hint={`cocoscare.com/blog/${form.slug || "…"}`}>
                <TextInput
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set({ slug: slugify(e.target.value) });
                  }}
                />
              </Field>
              <Field label="Recipe card at the end" hint="Shows after the post with timers, a servings scaler and a print button.">
                <Select
                  value={form.recipe_id || ""}
                  onChange={(e) => set({ recipe_id: e.target.value || null })}
                  options={[{ value: "", label: lib.loaded ? "No recipe card" : "Loading…" }, ...lib.recipes.map((r) => ({ value: r.id, label: `${r.title}${r.status === "published" ? "" : " (draft)"}` }))]}
                />
              </Field>
              <Link href="/admin/recipes/new" className="inline-block text-sm font-semibold text-pink-deep hover:underline">
                + New recipe
              </Link>
            </div>
          </Card>

          {!rec.isNew && (
            <div className="flex flex-col items-end gap-1.5 text-right">
              <DeleteButton onDelete={removePost} label="Delete post" />
              <p className="text-xs text-ink/55">
                Takes it off the blog for good.{rec.record.wordpress_id ? " Its WordPress copy goes to WordPress's Trash." : ""}
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Phones and tablets: save bar above the tab bar. */}
      <div className="sticky bottom-24 z-30 space-y-2 rounded-[1.75rem] border-[3px] border-ink bg-paper p-3 shadow-[4px_4px_0_var(--shadow)] lg:hidden">
        <Notice notice={rec.notice} />
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={!canSave || rec.saving} className="flex-1">
            {saveLabel}
          </Button>
          {dirty && !rec.saving && <span className="text-sm font-semibold text-pink-deep">Unsaved</span>}
        </div>
      </div>
    </div>
  );
}

export default function PostEditor() {
  const { id } = useParams();
  const startRecipeId = useSearchParams().get("recipe");
  const rec = useRecord("posts", id, BLANK, "/admin/posts");
  if (rec.missing) return <Notice notice={{ type: "error", text: "That post doesn't exist (it may have been deleted)." }} />;
  if (!rec.record) return <p className="animate-pulse font-semibold text-ink/60">Loading…</p>;
  return <PostForm key={rec.record.id || "new"} initial={rec.record} rec={rec} startRecipeId={rec.isNew ? startRecipeId : null} />;
}
