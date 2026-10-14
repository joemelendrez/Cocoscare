"use client";

import AdminList, { RowText, RowThumb, ago } from "@/components/admin/AdminList";

export default function AdminRecipes() {
  return (
    <AdminList
      table="recipes"
      title="Recipes"
      intro="Build a recipe once, then attach it to a post."
      newHref="/admin/recipes/new"
      newLabel="New recipe"
      select="id, title, status, image_url, servings, steps, updated_at"
      statuses={[
        { value: "draft", label: "Drafts" },
        { value: "published", label: "Live" },
      ]}
      emptyText="No recipes yet. Tap New recipe to build your first one."
      render={(r) => (
        <>
          <RowThumb src={r.image_url} fallback="🍪" />
          <RowText title={r.title} sub={`${r.steps?.length || 0} steps · serves ${r.servings} · edited ${ago(r.updated_at)}`} />
        </>
      )}
    />
  );
}
