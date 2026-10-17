import { GroceryBag } from "@/components/Doodles";
import PageHero from "@/components/PageHero";
import GroceryList from "@/components/tools/GroceryList";
import { getRecipeList } from "@/lib/data";
import { instacartConfigured } from "@/lib/instacart";
import { walmartAffiliateLink } from "@/lib/walmart";

export const metadata = {
  title: "Free Grocery List Tool: Paste It, Shop It",
  description:
    "Paste your grocery list or add a recipe's ingredients, sorted by aisle. Send it to Instacart, search each item at Walmart, or tick things off in the store. Free, no sign-up.",
  alternates: { canonical: "/tools/grocery-list" },
};

export const revalidate = 300;

export default async function GroceryListPage() {
  const recipes = await getRecipeList();
  return (
    <>
      <PageHero
        eyebrow="Free tool"
        title="Grocery list helper"
        color="mint"
        icon={<GroceryBag className="h-20 w-20 sm:h-24 sm:w-24" />}
      >
        Paste the list from your notes or add a recipe, then shop it in one tap. No sign-up, nothing to download.
      </PageHero>
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <GroceryList instacart={instacartConfigured} walmartLink={walmartAffiliateLink()} recipes={recipes} />
        </div>
      </section>
    </>
  );
}
