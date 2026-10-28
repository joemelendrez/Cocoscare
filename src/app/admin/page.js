"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RowText, RowThumb, ago } from "@/components/admin/AdminList";
import { useAdmin } from "@/components/admin/AdminShell";
import { Card, Notice, StatusPill } from "@/components/admin/AdminUI";
import { FromHandoffHero, HANDOFF_HERO_NEW_POST, MostSaved } from "@/components/admin/HandoffInbox";
import { categoryFor } from "@/lib/content";

// The admin's front page: what's waiting, what to finish next, and one tap
// to everything Coco does most. Every list links straight into its editor.

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const QUICK = [
  { href: HANDOFF_HERO_NEW_POST, label: "Write a post", sub: "In Handoff Hero", emoji: "✍️", bg: "bg-pink-soft", external: true },
  { href: "/admin/recipes/new", label: "New recipe", sub: "Ingredients and steps", emoji: "🍪", bg: "bg-butter/40" },
  { href: "/admin/products/new", label: "New pick", sub: "For the shop or a post", emoji: "💗", bg: "bg-periwinkle/30" },
  { href: "/admin/newsletter", label: "Newsletter", sub: "Email your readers", emoji: "💌", bg: "bg-mint/40" },
];

function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {QUICK.map((q) => (
        <Link
          key={q.href}
          href={q.href}
          {...(q.external ? { target: "_blank", rel: "noopener" } : {})}
          className={`flex flex-col gap-1 rounded-[1.5rem] border-[3px] border-ink p-4 transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--shadow)] ${q.bg}`}
        >
          <span className="text-2xl" aria-hidden="true">
            {q.emoji}
          </span>
          <span className="font-display text-lg leading-tight tracking-wide">
            {q.label}
            {q.external && " ↗"}
          </span>
          <span className="text-sm text-ink/65">{q.sub}</span>
        </Link>
      ))}
    </div>
  );
}

// The four steps a post goes through, with how many sit at each one.
function Pipeline({ posts }) {
  const count = (s) => posts.filter((p) => p.status === s).length;
  const steps = [
    { label: "Write it", sub: "in Handoff Hero", n: null, href: HANDOFF_HERO_NEW_POST, external: true },
    { label: "Finish it", sub: "photos and cards", n: count("draft"), href: "/admin/posts" },
    { label: "Review", sub: "Joseph checks it", n: count("review"), href: "/admin/posts" },
    { label: "Live", sub: "on the blog", n: count("published"), href: "/admin/posts" },
  ];
  return (
    <Card title="How a post goes">
      <ol className="grid gap-2 sm:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.label}>
            <Link
              href={s.href}
              {...(s.external ? { target: "_blank", rel: "noopener" } : {})}
              className="flex h-full items-center gap-3 rounded-2xl border-2 border-ink/20 px-3 py-2.5 hover:border-ink hover:bg-blush sm:flex-col sm:items-start sm:gap-1"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper font-display">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg leading-tight tracking-wide">{s.label}</span>
                <span className="block text-sm text-ink/60">{s.sub}</span>
              </span>
              {s.n !== null && <span className="font-display text-2xl tracking-wide">{s.n}</span>}
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function PostRows({ rows, empty }) {
  if (!rows.length) return <p className="text-ink/60">{empty}</p>;
  return (
    <ul className="divide-y-2 divide-ink/10">
      {rows.map((p) => (
        <li key={p.id}>
          <Link href={`/admin/posts/${p.id}`} className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-blush">
            <RowThumb src={p.cover_url} fallback="📝" />
            <RowText title={p.title} sub={`${categoryFor(p.category).label} · edited ${ago(p.updated_at)}`} />
            <StatusPill status={p.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Stat({ href, n, label }) {
  return (
    <Link href={href} className="rounded-2xl border-2 border-ink/20 px-3 py-2.5 hover:border-ink hover:bg-blush">
      <span className="block font-display text-3xl tracking-wide">{n}</span>
      <span className="block text-sm text-ink/65">{label}</span>
    </Link>
  );
}

// Small jobs that make a post or pick look finished: missing photos,
// summaries and shop links. Each one opens the right editor.
function todos({ posts, recipes, products }) {
  const list = [];
  for (const p of posts) {
    if (p.status === "published" && !p.cover_url) list.push({ href: `/admin/posts/${p.id}`, text: `Add a cover photo to "${p.title}"` });
    else if (p.status !== "draft" && !p.excerpt) list.push({ href: `/admin/posts/${p.id}`, text: `Write a short summary for "${p.title}"` });
  }
  for (const r of recipes) {
    if (!r.image_url) list.push({ href: `/admin/recipes/${r.id}`, text: `Add a photo to the recipe "${r.title}"` });
  }
  for (const p of products) {
    if (p.fave === false) continue;
    if (!p.url) list.push({ href: `/admin/products/${p.id}`, text: `Add a shop link to "${p.name}"` });
    else if (!p.image_url) list.push({ href: `/admin/products/${p.id}`, text: `Add a photo to "${p.name}"` });
  }
  return list;
}

export default function AdminHome() {
  const { supabase } = useAdmin();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    Promise.all([
      supabase
        .from("posts")
        .select("id, title, slug, category, status, excerpt, cover_url, updated_at, published_at")
        .order("updated_at", { ascending: false })
        .limit(500),
      supabase.from("recipes").select("id, title, status, image_url, updated_at").order("updated_at", { ascending: false }).limit(500),
      supabase.from("products").select("*").order("updated_at", { ascending: false }).limit(500),
    ]).then(([p, r, s]) => {
      if (!live) return;
      const err = p.error || r.error || s.error;
      if (err) setError(err.message);
      setData({ posts: p.data || [], recipes: r.data || [], products: s.data || [] });
    });
    return () => {
      live = false;
    };
  }, [supabase]);

  const posts = data?.posts || [];
  const drafts = posts.filter((p) => p.status === "draft").slice(0, 5);
  const review = posts.filter((p) => p.status === "review");
  const recent = posts
    .filter((p) => p.status === "published")
    .sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""))
    .slice(0, 4);
  const faves = (data?.products || []).filter((p) => p.fave !== false && p.status === "published").length;
  const tidy = data ? todos(data) : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-4xl tracking-wide">{greeting()}!</h1>
        <p className="mt-1 text-ink/70">Here&rsquo;s what&rsquo;s waiting for Coco&rsquo;s Care today.</p>
      </div>

      <QuickActions />
      <Notice notice={error ? { type: "error", text: error } : null} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-5">
          <FromHandoffHero />

          {data === null ? (
            <div className="h-48 animate-pulse rounded-[1.75rem] border-[3px] border-ink/20 bg-paper" aria-busy="true" />
          ) : (
            <>
              <Card
                title="Pick up where you left off"
                aside={
                  <Link href="/admin/posts" className="text-sm font-semibold text-pink-deep hover:underline">
                    All posts
                  </Link>
                }
              >
                <PostRows rows={drafts} empty="No drafts right now. Send one from Handoff Hero to get started." />
              </Card>
              {review.length > 0 && (
                <Card title="Waiting for review" aside={<span className="font-semibold text-ink/60">{review.length}</span>}>
                  <PostRows rows={review} empty="" />
                </Card>
              )}
              <Pipeline posts={posts} />
            </>
          )}
        </div>

        <div className="space-y-5">
          <Card title="At a glance">
            <div className="grid grid-cols-2 gap-2">
              <Stat href="/admin/posts" n={posts.filter((p) => p.status === "published").length} label="Live posts" />
              <Stat href="/admin/posts" n={posts.filter((p) => p.status !== "published").length} label="Not live yet" />
              <Stat href="/admin/recipes" n={data?.recipes.length ?? "…"} label="Recipes" />
              <Stat href="/admin/products" n={data ? faves : "…"} label="Shop faves" />
            </div>
          </Card>

          {tidy.length > 0 && (
            <Card title="Little to-dos" aside={<span className="font-semibold text-ink/60">{tidy.length}</span>}>
              <ul className="space-y-1.5">
                {tidy.slice(0, 6).map((t) => (
                  <li key={t.href + t.text}>
                    <Link href={t.href} className="-mx-2 flex gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-blush">
                      <span aria-hidden="true">○</span>
                      <span className="break-words">{t.text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {tidy.length > 6 && <p className="mt-2 text-sm text-ink/55">And {tidy.length - 6} more.</p>}
            </Card>
          )}

          {recent.length > 0 && (
            <Card title="Recently live">
              <ul className="space-y-2">
                {recent.map((p) => (
                  <li key={p.id} className="flex items-start gap-2 text-sm">
                    <Link href={`/admin/posts/${p.id}`} className="min-w-0 flex-1 break-words font-semibold hover:underline">
                      {p.title}
                    </Link>
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noopener" className="shrink-0 text-ink/60 hover:underline">
                      View ↗
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <MostSaved />
        </div>
      </div>
    </div>
  );
}
