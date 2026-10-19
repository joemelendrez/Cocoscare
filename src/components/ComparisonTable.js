import { Heart } from "@/components/Doodles";

// A post's comparison table (see src/lib/compareTable.js for the block it
// comes from). Wider screens get the table, products side by side with the
// top pick's column tinted; phones get one swipeable card per product.

function Photo({ product, className }) {
  return (
    <div className={`dots-ink relative grid aspect-square place-items-center overflow-hidden border-ink bg-pink-soft ${className}`}>
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- images from the post body
        <img src={product.image.src} alt={product.image.alt || product.name} loading="lazy" className="absolute inset-0 h-full w-full bg-paper object-contain p-1.5" />
      ) : (
        <Heart className="h-1/2 w-1/2" fill="var(--paper)" />
      )}
    </div>
  );
}

function TopBadge() {
  return (
    <span className="sticker-sm inline-block -rotate-2 rounded-full bg-butter px-3 py-0.5 font-display text-sm tracking-wide text-ink">
      Coco&rsquo;s top pick
    </span>
  );
}

function BuyButton({ link, wide = false }) {
  if (!link) return null;
  return (
    <a
      href={link.url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={`inline-block rounded-full border-[2.5px] border-ink bg-pink px-4 py-2 text-center font-display tracking-wide text-paper shadow-[3px_3px_0_var(--shadow)] transition-transform hover:-translate-y-0.5 ${wide ? "w-full" : ""}`}
    >
      {link.text && link.text.length <= 24 ? link.text : "Check price"}
    </a>
  );
}

export default function ComparisonTable({ table, id }) {
  const { title, labels, products } = table;
  const hasPhotos = products.some((p) => p.image);
  const hasLinks = products.some((p) => p.link);
  return (
    <section id={id} className="sticker not-prose my-8 scroll-mt-28 rounded-[2rem] bg-paper p-4 sm:p-6">
      <h2 className="flex items-center gap-3 font-display text-2xl leading-tight tracking-wide sm:text-3xl">
        <Heart className="h-7 w-7 shrink-0" /> {title || "Side by side"}
      </h2>

      {/* Phones: one card per product, swipe sideways. */}
      <div className="-mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 sm:hidden">
        {products.map((p, i) => (
          <article
            key={i}
            className={`flex w-[82%] shrink-0 snap-center flex-col rounded-[1.5rem] border-[2.5px] border-ink p-4 ${p.top ? "bg-blush shadow-[4px_4px_0_var(--pink)]" : "bg-paper"}`}
          >
            {p.top && (
              <span className="mb-2">
                <TopBadge />
              </span>
            )}
            {hasPhotos && <Photo product={p} className="mx-auto w-3/5 rounded-[1.25rem] border-[2.5px]" />}
            <h3 className="mt-3 font-display text-xl leading-tight tracking-wide">{p.name}</h3>
            <dl className="mt-3 flex-1 space-y-2.5 text-[0.95rem]">
              {labels.map((label, r) => (
                <div key={r} className="border-t-2 border-dashed border-ink/20 pt-2.5">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-pink">{label}</dt>
                  <dd className="compare-cell mt-0.5 text-ink/85" dangerouslySetInnerHTML={{ __html: p.values[r] || "–" }} />
                </div>
              ))}
            </dl>
            {p.link && (
              <div className="mt-4">
                <BuyButton link={p.link} wide />
              </div>
            )}
          </article>
        ))}
      </div>
      {products.length > 1 && (
        <p className="text-center text-xs font-semibold text-ink/50 sm:hidden">Swipe to compare all {products.length} →</p>
      )}

      {/* Wider screens: the table. */}
      <div className="mt-5 hidden overflow-x-auto sm:block">
        <table className="w-full border-separate border-spacing-0 text-left text-[0.95rem]">
          <thead>
            <tr>
              <th className="w-32 p-0" />
              {products.map((p, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`min-w-36 rounded-t-[1.25rem] px-3 pb-3 pt-3 align-top ${p.top ? "bg-blush" : ""}`}
                >
                  <div className="flex min-h-7 items-start">{p.top && <TopBadge />}</div>
                  {hasPhotos && <Photo product={p} className="mt-2 w-24 rounded-2xl border-[2.5px]" />}
                  <span className="mt-2 block font-display text-lg leading-tight tracking-wide">{p.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((label, r) => (
              <tr key={r}>
                <th scope="row" className="border-t-2 border-dashed border-ink/20 py-3 pr-3 align-top text-xs font-semibold uppercase tracking-wider text-pink">
                  {label}
                </th>
                {products.map((p, i) => (
                  <td
                    key={i}
                    className={`compare-cell border-t-2 border-dashed border-ink/20 px-3 py-3 align-top text-ink/85 ${p.top ? "bg-blush" : ""}`}
                    dangerouslySetInnerHTML={{ __html: p.values[r] || "–" }}
                  />
                ))}
              </tr>
            ))}
            {hasLinks && (
              <tr>
                <th className="p-0" />
                {products.map((p, i) => (
                  <td key={i} className={`rounded-b-[1.25rem] px-3 pb-4 pt-3 ${p.top ? "bg-blush" : ""}`}>
                    <BuyButton link={p.link} />
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
