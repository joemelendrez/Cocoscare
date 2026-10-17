import PageHero from "@/components/PageHero";
import GroceryList from "@/components/tools/GroceryList";
import { instacartConfigured } from "@/lib/instacart";
import { walmartAffiliateLink } from "@/lib/walmart";

export const metadata = {
  title: "Free Grocery List Tool: Paste It, Shop It",
  description:
    "Paste your grocery list from your notes app and send it to Instacart, search each item at Walmart, or tick things off in the store. Free, no sign-up.",
  alternates: { canonical: "/tools/grocery-list" },
};

export default function GroceryListPage() {
  return (
    <>
      <PageHero eyebrow="Free tool" title="Grocery list helper" color="mint">
        Paste the list from your notes, then shop it in one tap. No sign-up, nothing to download.
      </PageHero>
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <GroceryList instacart={instacartConfigured} walmartLink={walmartAffiliateLink()} />
        </div>
      </section>
    </>
  );
}
