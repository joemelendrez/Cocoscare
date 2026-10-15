import { Heart } from "@/components/Doodles";

// A post's FAQ as a card of tap-to-open questions. Plain <details>, so it
// works without JavaScript and every answer is in the page for Google.
export default function FaqBlock({ title = "Frequently Asked Questions", intro, items }) {
  return (
    <section id="faq" className="sticker scroll-mt-28 rounded-[2rem] bg-blush p-5 sm:p-7">
      <h2 className="flex items-center gap-3 font-display text-3xl tracking-wide">
        <Heart className="h-8 w-8 shrink-0" /> {title}
      </h2>
      {intro && <div className="post-body mt-3 text-base" dangerouslySetInnerHTML={{ __html: intro }} />}
      <div className="mt-5 space-y-3">
        {items.map((item, i) => (
          <details key={i} className="group rounded-2xl border-[2.5px] border-ink bg-paper open:shadow-[4px_4px_0_var(--pink)]">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-4 py-3.5 font-display text-lg leading-snug tracking-wide [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <span
                aria-hidden="true"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-pink-soft text-xl leading-none transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="post-body border-t-2 border-dashed border-ink/25 px-4 pb-4 pt-3 text-base" dangerouslySetInnerHTML={{ __html: item.answer }} />
          </details>
        ))}
      </div>
    </section>
  );
}
