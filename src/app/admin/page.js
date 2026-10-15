"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminList, { RowText, RowThumb, ago } from "@/components/admin/AdminList";
import { useAdmin } from "@/components/admin/AdminShell";
import { Button, Card, Notice, friendlyError } from "@/components/admin/AdminUI";
import { categoryFor } from "@/lib/content";

// A fixed id so WordPress lists one "Coco's Care admin" entry under the
// user's Application Passwords, however often it's reconnected.
const WORDPRESS_APP_ID = "85c106d7-9080-4f82-84c0-496d0b853a7f";

const STATE_LABEL = { draft: "Draft in Handoff Hero", scheduled: "Scheduled", live: "Already on the blog" };

// Posts sent from Handoff Hero to the WordPress subsite that haven't been
// pulled in yet. "Finish here" copies one into a draft post on this site.
function FromHandoffHero() {
  const { supabase } = useAdmin();
  const router = useRouter();
  const [state, setState] = useState({ loading: true, configured: true, site: "", user: "", posts: [], error: "" });
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

  const [reload, setReload] = useState(0);

  // Coming back from WordPress's "Connect WordPress" screen: save the
  // Application Password it added to the link, then drop it from the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userLogin = params.get("user_login");
    const password = params.get("password");
    const rejected = params.get("wp") === "rejected";
    if (!rejected && !(userLogin && password)) return;
    window.history.replaceState(null, "", window.location.pathname);
    const connecting = rejected
      ? Promise.reject(
          new Error("WordPress wasn't connected. Press Connect WordPress and choose Yes, I approve of this connection."),
        )
      : call({ method: "POST", body: JSON.stringify({ connect: { user_login: userLogin, password } }) }).finally(() =>
          setReload((n) => n + 1),
        );
    connecting
      .then(({ user }) => setNotice({ type: "success", text: `WordPress is connected as ${user}.` }))
      .catch((err) => setNotice({ type: "error", text: err.message }));
  }, [call]);

  useEffect(() => {
    let live = true;
    Promise.all([call(), supabase.from("posts").select("wordpress_id").not("wordpress_id", "is", null)])
      .then(([wp, { data, error }]) => {
        if (error) throw new Error(friendlyError(error));
        const taken = new Set((data || []).map((r) => r.wordpress_id));
        if (live) setState({ loading: false, ...wp, posts: wp.posts.filter((p) => !taken.has(p.id)), error: wp.error || "" });
      })
      .catch((err) => live && setState({ loading: false, configured: true, posts: [], error: err.message }));
    return () => {
      live = false;
    };
  }, [call, supabase, reload]);

  // Sends the admin to WordPress to approve an Application Password for
  // this site; WordPress then returns to /admin with it in the link.
  const connect = () => {
    const back = `${window.location.origin}${window.location.pathname}`;
    const url = new URL(`${state.site}/wp-admin/authorize-application.php`);
    url.searchParams.set("app_name", "Coco's Care admin");
    url.searchParams.set("app_id", WORDPRESS_APP_ID);
    url.searchParams.set("success_url", back);
    url.searchParams.set("reject_url", `${back}?wp=rejected`);
    window.location.href = url.toString();
  };

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
        <div className="space-y-3">
          <Notice notice={notice} />
          <p className="text-ink/75">
            Connect the Coco&rsquo;s Care WordPress once and posts sent from Handoff Hero show up here. You&rsquo;ll sign in to
            WordPress with an Editor or Administrator account and approve the connection.
          </p>
          <Button onClick={connect}>Connect WordPress</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="From Handoff Hero"
      aside={state.posts.length ? <span className="font-semibold text-ink/60">{state.posts.length} new</span> : null}
    >
      <div className="space-y-3">
        <Notice notice={notice || (state.error ? { type: "error", text: state.error } : null)} />
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
        {!state.loading && (
          <p className="text-sm text-ink/55">
            {state.user ? `Connected to WordPress as ${state.user}. ` : ""}
            <button type="button" onClick={connect} className="font-semibold underline underline-offset-2 hover:text-pink-deep">
              {state.error ? "Connect WordPress again" : "Reconnect"}
            </button>
          </p>
        )}
      </div>
    </Card>
  );
}

// New posts start in Coco's Handoff Hero account, which writes in her voice.
const HANDOFF_HERO_NEW_POST = "https://handoffhero.com/generate";

export default function AdminPosts() {
  return (
    <AdminList
      table="posts"
      title="Posts"
      intro="Write a new post in Handoff Hero and send it here as a draft. Then finish it here: add photos, product cards and a recipe, and mark it ready for review or put it live."
      newHref={HANDOFF_HERO_NEW_POST}
      newExternal
      newLabel="New post"
      altHref="/admin/posts/new"
      altLabel="or start a blank one here"
      select="id, title, category, status, cover_url, updated_at"
      statuses={[
        { value: "review", label: "Ready for review" },
        { value: "draft", label: "Drafts" },
        { value: "published", label: "Live" },
      ]}
      emptyText="No posts here yet. Tap New post to write one in Handoff Hero, then finish it here."
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
