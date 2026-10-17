import Link from "next/link";
import PageHero from "@/components/PageHero";
import { SITE } from "@/lib/content";

// Privacy and terms: a hero, a "jump to" list and numbered plain-language
// sections. sections: [{ id, title, body }].
export default function LegalPage({ eyebrow, title, intro, updated, sections, color = "periwinkle" }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} color={color}>
        {intro}
      </PageHero>
      <section className="py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 lg:grid-cols-[15rem_1fr]">
          <nav aria-label="On this page" className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-display text-xl tracking-wide">On this page</p>
            <ol className="mt-3 grid gap-1.5 text-sm font-semibold sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-2 rounded-xl px-2 py-1 hover:bg-blush">
                    <span className="text-pink-deep">{i + 1}.</span> {s.title}
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-ink/55">Last updated {updated}</p>
          </nav>
          <div className="space-y-5">
            {sections.map((s, i) => (
              <article
                key={s.id}
                id={s.id}
                className="scroll-mt-28 rounded-[1.75rem] border-[3px] border-ink bg-paper p-6 shadow-[5px_5px_0_var(--shadow)] sm:p-8"
              >
                <h2 className="flex items-center gap-3 font-display text-2xl tracking-wide sm:text-3xl">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-[2.5px] border-ink bg-butter text-lg text-ink">
                    {i + 1}
                  </span>
                  {s.title}
                </h2>
                <div className="legal-body mt-4 space-y-3 text-[1.05rem] font-medium leading-relaxed text-ink/80">{s.body}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// "How to reach me", the same on both pages.
export function ContactLine() {
  return SITE.email ? (
    <p>
      Email me at{" "}
      <a href={`mailto:${SITE.email}`} className="font-semibold text-pink-deep underline">
        {SITE.email}
      </a>{" "}
      and I&rsquo;ll get back to you.
    </p>
  ) : (
    <p>
      Reply to any email you&rsquo;ve had from {SITE.name} and it comes straight to me. You can also delete your account yourself
      any time on{" "}
      <Link href="/account" className="font-semibold text-pink-deep underline">
        My account
      </Link>
      .
    </p>
  );
}
