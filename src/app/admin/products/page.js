"use client";

import { CopyCode } from "@/components/admin/AdminUI";
import { cardToken } from "@/lib/data";
import AdminList, { RowText, RowThumb } from "@/components/admin/AdminList";
import { SHOP_SECTIONS } from "@/lib/content";
import { amazonImageUrl } from "@/lib/amazon";

const sectionLabel = (key) => SHOP_SECTIONS.find((s) => s.key === key)?.label || key;

export default function AdminProducts() {
  return (
    <AdminList
      table="products"
      title="Shop"
      intro="Your picks. Live faves show in the shop with their own page; the rest only show as cards inside posts (handy for roundups like the best car seats). Tap Copy card and paste it on its own line in any post to show it there."
      newHref="/admin/products/new"
      newLabel="New pick"
      select="*"
      statuses={[
        { value: "draft", label: "Drafts" },
        { value: "published", label: "Live" },
      ]}
      emptyText="No picks yet. Tap New pick to add one."
      action={(r) => <CopyCode compact code={cardToken("product", r.slug)} />}
      render={(r) => (
        <>
          <RowThumb src={r.image_url || amazonImageUrl(r.url)} fallback="💗" />
          <RowText
            title={`${r.featured ? "★ " : ""}${r.name}`}
            sub={`${sectionLabel(r.section)} · ${r.fave === false ? "Post cards only" : "Fave, in the shop"}${r.url ? "" : " · no link yet"}`}
          />
        </>
      )}
    />
  );
}
