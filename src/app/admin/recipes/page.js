"use client";

import { CopyCode } from "@/components/admin/AdminUI";
import { cardToken } from "@/lib/data";
import AdminList, { RowText, RowThumb, ago } from "@/components/admin/AdminList";

export default function AdminRecipes() {
  return (
    <AdminList
      table="recipes"
      title="Recipes"
      intro="Build a recipe once, then put its card in any post: tap Copy card and paste it on its own line."
      newHref="/admin/recipes/new"
      newLabel="New recipe"
      select="id, slug, title, status, image_url, servings, steps, updated_at"
      statuses={[
        { value: "draft", label: "Drafts" },
        { value: "published", label: "Live" },
      ]}
      emptyText="No recipes yet. Tap New recipe to build your first one."
      action={(r) => <CopyCode compact code={cardToken("recipe", r.slug)} />}
      render={(r) => (
        <>
          <RowThumb src={r.image_url} fallback="🍪" />
          <RowText title={r.title} sub={`${r.steps?.length || 0} steps · serves ${r.servings} · edited ${ago(r.updated_at)}`} />
        </>
      )}
    />
  );
}
