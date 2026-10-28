import PageHero from "@/components/PageHero";
import { RecipeGrid } from "@/components/FilterGrid";
import { getRecipeList } from "@/lib/data";

export const revalidate = 60;

export const metadata = {
  title: "Recipes",
  description: "Every easy, kid-approved recipe from Coco's Care in one place. Search by name or by what's in your fridge.",
  alternates: { canonical: "/recipes" },
};

// The recipes live inside their posts (that's where the Recipe schema,
// pins and "Jump to recipe" are). This page is the index: one card each,
// linking to the recipe card in its post.
export default async function RecipesPage() {
  const recipes = (await getRecipeList()).filter((r) => r.href);
  return (
    <>
      <PageHero eyebrow="From my kitchen" title="All my recipes" color="mint">
        Quick, kid-approved and tested in a real (messy) kitchen. Search by name or by what&rsquo;s already in your
        fridge.
      </PageHero>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <RecipeGrid recipes={recipes} />
      </section>
    </>
  );
}
