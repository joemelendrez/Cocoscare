import { PlannerDoodle } from "@/components/Doodles";
import PageHero from "@/components/PageHero";
import MealPlanner from "@/components/tools/MealPlanner";
import { getRecipeList } from "@/lib/data";

export const metadata = {
  title: "Free Weekly Meal Planner for Busy Moms",
  description:
    "Plan the week's dinners in a few taps, fill empty nights with easy recipes, and send every ingredient to your grocery list. Free, no sign-up.",
  alternates: { canonical: "/tools/meal-planner" },
};

export const revalidate = 300;

export default async function MealPlannerPage() {
  const recipes = await getRecipeList();
  return (
    <>
      <PageHero
        eyebrow="Free tool"
        title="Meal planner"
        color="butter"
        icon={<PlannerDoodle className="h-20 w-20 sm:h-24 sm:w-24" />}
      >
        Plan the week&rsquo;s dinners, then send every ingredient to your grocery list in one tap.
      </PageHero>
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <MealPlanner recipes={recipes} />
        </div>
      </section>
    </>
  );
}
