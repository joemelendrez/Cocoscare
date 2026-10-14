"use client";

import AdminList, { RowText, RowThumb } from "@/components/admin/AdminList";
import { SHOP_SECTIONS } from "@/lib/content";

const sectionLabel = (key) => SHOP_SECTIONS.find((s) => s.key === key)?.label || key;

export default function AdminProducts() {
  return (
    <AdminList
      table="products"
      title="Shop"
      intro="Your picks. Live ones show in the shop, and any post can show one as a card."
      newHref="/admin/products/new"
      newLabel="New pick"
      select="id, name, section, status, image_url, url, featured, updated_at"
      statuses={[
        { value: "draft", label: "Drafts" },
        { value: "published", label: "Live" },
      ]}
      emptyText="No picks yet. Tap New pick to add one."
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
