import Link from "next/link";
import PageHero from "@/components/PageHero";
import { GroceryBag, KiteDoodle, MeasuringCup, PlannerDoodle } from "@/components/Doodles";
import { Reveal } from "@/components/Motion";
import { TOOLS as TOOL_LIST } from "@/lib/tools";

export const metadata = {
  title: "Free Tools for Busy Moms",
  description:
    "Free little helpers from Coco's Care: a grocery list, a meal planner, a kitchen converter and a boredom buster for the kids.",
  alternates: { canonical: "/tools" },
};

// Color and doodle per tool (the list itself is in src/lib/tools.js).
const LOOK = {
  "/tools/grocery-list": { color: "bg-mint", Icon: GroceryBag },
  "/tools/meal-planner": { color: "bg-butter", Icon: PlannerDoodle },
  "/tools/kitchen-converter": { color: "bg-periwinkle", Icon: MeasuringCup },
  "/tools/boredom-buster": { color: "bg-blush", Icon: KiteDoodle },
};


const TOOLS = TOOL_LIST.map((t) => ({ ...t, ...LOOK[t.href] }));

export default function ToolsPage() {
  return (
    <>
      <PageHero eyebrow="Free, no sign-up" title="Little mom helpers" color="butter">
        Small free tools I wish I&rsquo;d had on busy days.
      </PageHero>
      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Reveal key={t.href}>
              <Link
                href={t.href}
                className="group block h-full rounded-[2rem] border-[3px] border-ink bg-paper p-6 shadow-[6px_6px_0_var(--shadow)] transition-transform hover:-translate-y-1 hover:rotate-[-1deg]"
              >
                <span
                  className={`grid h-16 w-16 place-items-center rounded-2xl border-[2.5px] border-ink transition-transform group-hover:rotate-[-8deg] group-hover:scale-110 ${t.color}`}
                  aria-hidden
                >
                  <t.Icon className="h-12 w-12" />
                </span>
                <h2 className="mt-4 font-display text-2xl tracking-wide">{t.title}</h2>
                <p className="mt-2 font-medium text-ink/70">{t.blurb}</p>
                <span className="mt-4 inline-block font-display tracking-wide text-pink-deep group-hover:underline">
                  Open it →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
