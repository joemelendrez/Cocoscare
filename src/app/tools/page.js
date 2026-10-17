import Link from "next/link";
import PageHero from "@/components/PageHero";
import { Reveal } from "@/components/Motion";

export const metadata = {
  title: "Free Tools for Busy Moms",
  description: "Free little helpers from Coco's Care: a grocery list you can paste and shop in one tap, and more on the way.",
  alternates: { canonical: "/tools" },
};

// Add a tool here once its page exists.
const TOOLS = [
  {
    href: "/tools/grocery-list",
    title: "Grocery list helper",
    blurb: "Paste the list from your notes. Send it to Instacart, search it at Walmart, or tick it off in the store.",
    color: "bg-mint",
    emoji: "🛒",
  },
];

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
                className="group block h-full rounded-[2rem] border-[3px] border-ink bg-paper p-6 shadow-[6px_6px_0_var(--ink)] transition-transform hover:-translate-y-1 hover:rotate-[-1deg]"
              >
                <span
                  className={`grid h-14 w-14 place-items-center rounded-2xl border-[2.5px] border-ink text-3xl ${t.color}`}
                  aria-hidden
                >
                  {t.emoji}
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
