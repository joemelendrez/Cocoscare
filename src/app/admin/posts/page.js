"use client";

import AdminList, { RowText, RowThumb, ago } from "@/components/admin/AdminList";
import { FromHandoffHero, HANDOFF_HERO_NEW_POST } from "@/components/admin/HandoffInbox";
import { categoryFor } from "@/lib/content";

export default function AdminPosts() {
  return (
    <AdminList
      table="posts"
      title="Posts"
      intro="Write a new post in Handoff Hero and send it here as a draft. Then finish it here: add photos, product cards and a recipe, and mark it ready for review or put it live."
      newHref={HANDOFF_HERO_NEW_POST}
      newExternal
      rowHref="/admin/posts"
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
