import Link from "next/link";
import { notFound } from "next/navigation";
import FaqBlock from "@/components/FaqBlock";
import FaveGallery from "@/components/FaveGallery";
import { PostCard } from "@/components/Cards";
import { Heart } from "@/components/Doodles";
import { COLOR, SHOP_SECTIONS, SITE } from "@/lib/content";
import { getFave, getFaveSlugs, getFeaturedIn } from "@/lib/data";
import { bodySegments } from "@/lib/postBody";

export const revalidate = 60;

export async function generateStaticParams() {
  const rows = await getFaveSlugs();
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const fave = await getFave(slug);
  if (!fave) return { title: "Pick not found" };
  const description = fave.note || `Why ${fave.name} is one of Coco's faves.`;
  const image = fave.image_url || fave.photos[0];
  return {
    title: `${fave.name} review`,
    description,
    alternates: { canonical: `/shop/${fave.slug}` },
    openGraph: {
      title: fave.name,
      description,
      siteName: SITE.name,
      url: `/shop/${fave.slug}`,
      images: image ? [image] : undefined,
    },
  };
}

export default async function FavePage({ params }) {
  const { slug } = await params;
  const fave = await getFave(slug);
  if (!fave) notFound();

  const { posts, recipes } = await getFeaturedIn(fave.slug);
  const photos = [fave.image_url, ...fave.photos].filter((p, i, all) => p && all.indexOf(p) === i);
  const color = COLOR[fave.color] ? fave.color : "pink";
  const section = SHOP_SECTIONS.find((s) => s.key === fave.section);
  const segments = fave.details ? bodySegments(fave.details) : [];

  return (
    <article>
      <header className={`relative border-b-[3px] border-ink pb-10 pt-32 sm:pt-36 ${COLOR[color].hero}`}>
        <div className="mx-auto max-w-6xl px-5">
          <Link
            href="/shop"
            className="follow-theme sticker-sm inline-flex -rotate-2 items-center gap-2 rounded-full bg-paper px-4 py-1 font-display tracking-wide text-ink"
          >
            ← Shop my faves
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <FaveGallery photos={photos} name={fave.name} color={color} />

        <div className="lg:sticky lg:top-28">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink">
            Coco&rsquo;s fave{section ? ` · ${section.label}` : ""}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-[1.05] tracking-wide sm:text-5xl">{fave.name}</h1>
          {fave.note && (
            <p className="mt-4 text-lg text-ink/80">
              <span className="font-semibold text-pink">Coco says:</span> {fave.note}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {fave.url ? (
              <a
                href={fave.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="lift rounded-full border-[3px] border-ink bg-pink px-7 py-3 font-display text-xl tracking-wide text-paper shadow-[5px_5px_0_var(--shadow)]"
              >
                {fave.price_label ? `${fave.price_label} · ` : ""}Check price →
              </a>
            ) : (
              <span className="rounded-full border-[2.5px] border-dashed border-ink/40 px-6 py-3 font-display tracking-wide text-ink/50">
                Link coming soon
              </span>
            )}
          </div>
          {fave.url && (
            <p className="mt-5 rounded-2xl border-2 border-dashed border-ink/40 px-4 py-3 text-sm text-ink/70">
              This is an affiliate link. If you buy through it I may earn a small commission at no extra cost to you.
            </p>
          )}
          {(posts.length > 0 || recipes.length > 0) && (
            <a href="#featured-in" className="mt-5 inline-block font-semibold text-ink/70 underline-offset-2 hover:underline">
              See the posts and recipes it&rsquo;s in ↓
            </a>
          )}
        </div>
      </div>

      {segments.length > 0 && (
        <div className="mx-auto max-w-3xl px-5 pb-12">
          <h2 className="mb-6 font-display text-4xl tracking-wide">The full review</h2>
          <div className="space-y-[1.1em]">
            {segments.map((s, i) =>
              s.type === "faq" ? (
                <div key={i} className="py-4">
                  <FaqBlock title={s.title} intro={s.intro} items={s.items} />
                </div>
              ) : s.type === "html" ? (
                <div key={i} dangerouslySetInnerHTML={{ __html: s.html }} className="post-body" />
              ) : null,
            )}
          </div>
        </div>
      )}

      {(posts.length > 0 || recipes.length > 0) && (
        <section id="featured-in" className="dots-ink scroll-mt-24 border-t-[3px] border-ink bg-blush py-16">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-center font-display text-4xl tracking-wide sm:text-5xl">
              Featured <span className="text-pink">in</span>
            </h2>
            {recipes.length > 0 && (
              <>
                <h3 className="mt-10 font-display text-2xl tracking-wide">Recipes</h3>
                <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recipes.map((r) => (
                    <li key={r.slug}>
                      <Link href={r.href} className="sticker lift flex items-center gap-4 rounded-[1.5rem] bg-paper p-3">
                        <span className={`grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border-[2.5px] border-ink ${COLOR.butter.bg}`}>
                          {r.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element -- Supabase storage URLs
                            <img src={r.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <Heart className="h-8 w-8" fill="var(--paper)" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-display text-xl leading-tight tracking-wide">{r.title}</span>
                          {r.minutes > 0 && <span className="text-sm font-semibold text-ink/60">{r.minutes} min</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {posts.length > 0 && (
              <>
                <h3 className="mt-10 font-display text-2xl tracking-wide">Posts</h3>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((p) => (
                    <PostCard key={p.slug} post={p} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
