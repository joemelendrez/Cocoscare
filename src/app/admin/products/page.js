"use client";

import { CopyCode } from "@/components/admin/AdminUI";
import { cardToken } from "@/lib/data";
import AdminList, { RowText, RowThumb } from "@/components/admin/AdminList";
import { SHOP_SECTIONS } from "@/lib/content";

const sectionLabel = (key) => SHOP_SECTIONS.find((s) => s.key === key)?.label || key;

export default function AdminProducts() {
  return (
    <AdminList
      table="products"
      title="Shop"
      intro="Your picks. Live ones show in the shop. Tap Copy card and paste it on its own line in any post to show it there."
      newHref="/admin/products/new"
      newLabel="New pick"
      select="id, slug, name, section, status, image_url, url, featured, updated_at"
      statuses={[
        { value: "draft", label: "Drafts" },
        { value: "published", label: "Live" },
      ]}
      emptyText="No picks yet. Tap New pick to add one."
      action={(r) => <CopyCode compact code={cardToken("product", r.slug)} />}
      render={(r) => (
        <>
          <RowThumb src={r.image_url} fallback="💗" />
          <RowText
            title={`${r.featured ? "★ " : ""}${r.name}`}
            sub={`${sectionLabel(r.section)}${r.url ? "" : " · no link yet"}`}
          />
        </>
      )}
    />
  );
}
