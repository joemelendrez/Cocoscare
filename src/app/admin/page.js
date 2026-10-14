"use client";

import AdminList, { RowText, RowThumb, ago } from "@/components/admin/AdminList";
import { categoryFor } from "@/lib/content";

export default function AdminPosts() {
  return (
    <AdminList
      table="posts"
      title="Posts"
      intro="Write a post, mark it ready for review, and Joseph puts it live."
      newHref="/admin/posts/new"
      newLabel="New post"
      select="id, title, category, status, cover_url, updated_at"
      statuses={[
        { value: "review", label: "Ready for review" },
        { value: "draft", label: "Drafts" },
        { value: "published", label: "Live" },
      ]}
      emptyText="No posts here yet."
      render={(r) => (
        <>
          <RowThumb src={r.cover_url} fallback="📝" />
          <RowText title={r.title} sub={`${categoryFor(r.category).label} · edited ${ago(r.updated_at)}`} />
        </>
      )}
    />
  );
}
