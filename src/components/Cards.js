import Link from "next/link";
import { CategoryIcon, Heart, Squiggle } from "@/components/Doodles";
import { COLOR, categoryFor } from "@/lib/content";

export function SectionTitle({ eyebrow, title, accent, children, center = true }) {
  return (
    <div className={center ? "flex flex-col items-center text-center" : ""}>
      {eyebrow && (
        <span className="sticker-sm inline-block -rotate-2 rounded-full bg-butter px-4 py-1 font-display text-base tracking-wide">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-4 font-display text-5xl leading-none tracking-wide sm:text-6xl">
        {title} {accent && <span className="text-pink">{accent}</span>}
      </h2>
      <Squiggle className={`mt-4 h-4 w-28 ${center ? "" : ""}`} color="var(--pink)" />
      {children && <p className="mt-4 max-w-xl text-lg text-ink/75">{children}</p>}
    </div>
  );
}

export function SampleBadge() {
  return (
    <span className="rounded-full border-2 follow-theme border-dashed border-ink/50 bg-paper/80 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-ink/60">
      Sample
    </span>
  );
}

// Sample posts have no page yet, so only real posts are links.
export function PostCard({ post }) {
  const cat = categoryFor(post.category);
  const Wrap = post.sample ? "article" : Link;
  const wrapProps = post.sample ? {} : { href: `/blog/${post.slug}` };
  return (
    <Wrap {...wrapProps} className="sticker lift group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-paper">
      <div
        className={`dots-ink relative grid aspect-[4/3] place-items-center overflow-hidden border-b-[3px] border-ink ${COLOR[cat.color].bg}`}
      >
        {post.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase storage URLs, sized by the uploader
          <img
            src={post.cover_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="grid h-20 w-20 place-items-center rounded-full follow-theme border-[3px] border-ink bg-paper transition-transform duration-500 group-hover:rotate-[-12deg] group-hover:scale-110">
            <CategoryIcon name={cat.icon} className="h-12 w-12" />
          </span>
        )}
        <span className="follow-theme absolute left-4 top-4 rounded-full border-2 border-ink bg-paper px-3 py-0.5 text-sm font-semibold">
          {cat.label}
        </span>
        {post.sample && (
          <span className="absolute right-4 top-4">
            <SampleBadge />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl leading-tight tracking-wide">{post.title}</h3>
        {post.excerpt && <p className="mt-2 text-ink/70">{post.excerpt}</p>}
        <p className="mt-auto pt-4 text-sm font-semibold text-ink/60">{post.minutes} min read</p>
      </div>
    </Wrap>
  );
}

export function PickCard({ pick }) {
  const color = COLOR[pick.color] ? pick.color : "pink";
  return (
    <article className="sticker lift group flex h-full flex-col rounded-[1.75rem] bg-paper p-4">
      <div
        className={`dots-ink relative grid aspect-square place-items-center overflow-hidden rounded-[1.25rem] border-[3px] border-ink ${COLOR[color].bg}`}
      >
        {pick.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase storage URLs
          <img
            src={pick.image_url}
            alt={pick.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full bg-paper object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Heart
            className="h-16 w-16 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12"
            fill="var(--paper)"
          />
        )}
        {pick.sample && (
          <span className="absolute right-3 top-3">
            <SampleBadge />
          </span>
        )}
        {pick.price_label && (
          <span className="absolute bottom-3 left-3 rounded-full border-2 border-ink bg-butter px-2.5 py-0.5 text-sm font-semibold">
            {pick.price_label}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-xl leading-tight tracking-wide">{pick.name}</h3>
      {pick.note && (
        <p className="mt-1.5 flex-1 text-sm text-ink/70">
          <span className="font-semibold text-pink">Coco says:</span> {pick.note}
        </p>
      )}
      {pick.url ? (
        <a
          href={pick.url}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="mt-4 rounded-full border-[2.5px] border-ink bg-ink py-2.5 text-center font-display tracking-wide text-paper transition-colors hover:bg-pink"
        >
          Get it →
        </a>
      ) : (
        <span className="mt-4 rounded-full border-[2.5px] border-dashed border-ink/40 py-2.5 text-center font-display tracking-wide text-ink/50">
          Link coming soon
        </span>
      )}
    </article>
  );
}

// Wide affiliate card for inside a post.
// A product inside a post: closed it's a slim row (thumbnail, name, Check
// price); opening it shows the big photo and Coco's note.
export function ProductEmbed({ product }) {
  const color = COLOR[product.color] ? product.color : "pink";
  const photo = (size) => (
    <div
      className={`dots-ink relative grid aspect-square shrink-0 place-items-center overflow-hidden border-ink ${COLOR[color].bg} ${size}`}
    >
      {product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase storage URLs
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full bg-paper object-contain p-1"
        />
      ) : (
        <Heart className="h-1/2 w-1/2" fill="var(--paper)" />
      )}
    </div>
  );
  return (
    <aside className="sticker not-prose my-8 rounded-[1.75rem] bg-paper p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <details className="group min-w-0 flex-1">
          <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            {photo("w-16 rounded-xl border-[2.5px] group-open:hidden")}
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wider text-pink">Coco&rsquo;s pick</span>
              <span className="block font-display text-xl leading-tight tracking-wide sm:text-2xl">{product.name}</span>
              <span className="text-sm font-semibold text-ink/60">
                <span className="group-open:hidden">More details ▾</span>
                <span className="hidden group-open:inline">Less ▴</span>
              </span>
            </span>
          </summary>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            {photo("w-full rounded-[1.25rem] border-[3px] sm:w-40")}
            {product.note && <p className="text-base text-ink/75">{product.note}</p>}
          </div>
        </details>
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="shrink-0 self-start rounded-full border-[2.5px] border-ink bg-pink px-4 py-2.5 text-center font-display tracking-wide text-paper shadow-[3px_3px_0_var(--ink)] transition-transform hover:-translate-y-0.5 sm:px-6 sm:text-lg"
          >
            {product.price_label ? `${product.price_label} · ` : ""}Check price
          </a>
        )}
      </div>
    </aside>
  );
}

export function CategoryCard({ cat }) {
  return (
    <Link
      href="/blog"
      className={`sticker lift group relative flex h-full flex-col overflow-hidden rounded-[2rem] p-6 ${COLOR[cat.color].bg}`}
    >
      <span className="grid follow-theme h-16 w-16 place-items-center rounded-full border-[3px] border-ink bg-paper transition-transform duration-300 group-hover:rotate-[-15deg] group-hover:scale-110">
        <CategoryIcon name={cat.icon} className="h-10 w-10" />
      </span>
      <h3 className="mt-5 font-display text-3xl tracking-wide">{cat.label}</h3>
      <p className="mt-2 font-medium text-ink/80">{cat.blurb}</p>
      <span className="mt-auto pt-5 font-display text-lg tracking-wide">
        Let&rsquo;s go <span className="inline-block transition-transform group-hover:translate-x-1.5">→</span>
      </span>
    </Link>
  );
}
