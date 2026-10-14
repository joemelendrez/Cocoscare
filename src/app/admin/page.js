"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminList, { RowText, RowThumb, ago } from "@/components/admin/AdminList";
import { useAdmin } from "@/components/admin/AdminShell";
import { Button, Card, Notice, friendlyError } from "@/components/admin/AdminUI";
import { categoryFor } from "@/lib/content";

const STATE_LABEL = { draft: "Draft in Handoff Hero", scheduled: "Scheduled", live: "Already on the blog" };

// Posts sent from Handoff Hero to the WordPress subsite that haven't been
// pulled in yet. "Finish here" copies one into a draft post on this site.
function FromHandoffHero() {
  const { supabase } = useAdmin();
  const router = useRouter();
  const [state, setState] = useState({ loading: true, configured: true, posts: [], error: "" });
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState(null);

  const call = useCallback(
    async (init) => {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/wordpress", {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token || ""}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Couldn't reach WordPress. Try again.");
      return json;
    },
    [supabase],
  );

  useEffect(() => {
    let live = true;
    Promise.all([call(), supabase.from("posts").select("wordpress_id").not("wordpress_id", "is", null)])
      .then(([wp, { data, error }]) => {
        if (error) throw new Error(friendlyError(error));
        const taken = new Set((data || []).map((r) => r.wordpress_id));
        if (live) setState({ loading: false, configured: wp.configured, posts: wp.posts.filter((p) => !taken.has(p.id)), error: "" });
      })
      .catch((err) => live && setState({ loading: false, configured: true, posts: [], error: err.message }));
    return () => {
      live = false;
    };
  }, [call, supabase]);

  const finish = async (id) => {
    if (busy) return;
    setBusy(id);
    setNotice(null);
    try {
      const { post } = await call({ method: "POST", body: JSON.stringify({ id }) });
      // Keep the WordPress link name unless a post here already uses it.
      const { data: used } = await supabase.from("posts").select("slug").like("slug", `${post.slug}%`);
      const names = new Set((used || []).map((r) => r.slug));
      let slug = post.slug;
      for (let n = 2; names.has(slug); n++) slug = `${post.slug}-${n}`;
      const { data, error } = await supabase
        .from("posts")
        .insert({ ...post, slug, status: "draft" })
        .select("id")
        .single();
      if (error) {
        if (error.code === "23505") {
          const { data: existing } = await supabase.from("posts").select("id").eq("wordpress_id", id).maybeSingle();
          if (existing) return router.push(`/admin/posts/${existing.id}`);
        }
        throw new Error(friendlyError(error));
      }
      router.push(`/admin/posts/${data.id}`);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
      setBusy(null);
    }
  };

  if (!state.loading && !state.configured) {
    return (
      <Card title="From Handoff Hero">
        <p className="text-ink/75">
          Not connected yet. Add <code className="font-mono text-sm">WORDPRESS_USERNAME</code> and <code className="font-mono text-sm">WORDPRESS_APP_PASSWORD</code> on Netlify (an
          Application Password from the Coco&rsquo;s Care WordPress) and posts sent from Handoff Hero show up here.
        </p>
      </Card>
    );
  }

  return (
    <Card title="From Handoff Hero" aside={state.posts.length ? <span className="font-semibold text-ink/60">{state.posts.length} new</span> : null}>
      <div className="space-y-3">
        <Notice notice={state.error ? { type: "error", text: state.error } : notice} />
        {state.loading ? (
          <div className="h-14 animate-pulse rounded-2xl bg-blush" aria-busy="true" />
        ) : state.posts.length === 0 ? (
          !state.error && <p className="text-ink/60">Nothing new. Posts you send from Handoff Hero as a draft show up here.</p>
        ) : (
          <ul className="divide-y-2 divide-ink/10">
            {state.posts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <RowText title={p.title} sub={`${STATE_LABEL[p.state]}${p.modified ? ` · ${ago(p.modified)}` : ""}`} />
                <Button className="py-1.5 text-sm" onClick={() => finish(p.id)} disabled={busy !== null}>
                  {busy === p.id ? "Bringing it in…" : "Finish here"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

export default function AdminPosts() {
  return (
    <AdminList
      table="posts"
      title="Posts"
      intro="Write posts in Handoff Hero and send them to your blog as a draft. Finish them here with photos, product cards and a recipe, then mark them ready for review."
      newHref="/admin/posts/new"
      select="id, title, category, status, cover_url, updated_at"
      statuses={[
        { value: "review", label: "Ready for review" },
        { value: "draft", label: "Drafts" },
        { value: "published", label: "Live" },
      ]}
      emptyText="No posts here yet. Finish one from Handoff Hero above."
      render={(r) => (
        <>
          <RowThumb src={r.cover_url} fallback="📝" />
          <RowText title={r.title} sub={`${categoryFor(r.category).label} · edited ${ago(r.updated_at)}`} />
        </>
      )}
    >
      <FromHandoffHero />
    </AdminList>
  );
}
