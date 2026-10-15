import Link from "next/link";
import { notFound } from "next/navigation";
import EmailSignup from "@/components/EmailSignup";
import FaqBlock from "@/components/FaqBlock";
import ReadingProgress from "@/components/ReadingProgress";
import TableOfContents from "@/components/TableOfContents";
import RecipeCard from "@/components/RecipeCard";
import RecipeJump from "@/components/RecipeJump";
import { ProductEmbed } from "@/components/Cards";
import { CategoryIcon, Heart } from "@/components/Doodles";
import { COLOR, SITE, categoryFor } from "@/lib/content";
import { getPost, getPostSlugs, readingMinutes } from "@/lib/data";
import { bodySegments, faqSchema } from "@/lib/postBody";
import { withHeadingIds } from "@/lib/postHeadings";
import { mailchimpConfigured } from "@/lib/mailchimp";
import { recipeSchema } from "@/lib/recipe";

export const revalidate = 60;

export async function generateStaticParams() {
  const rows = await getPostSlugs();
  return rows.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };
  const images = post.cover_url ? [post.cover_url] : ["/opengraph-image.jpg"];
  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: "article",
      siteName: SITE.name,
      url: `/blog/${post.slug}`,
      images,
      publishedTime: post.published_at || undefined,
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt || undefined, images },
  };
}

function JsonLd({ item }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }} />
  );
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const cat = categoryFor(post.category);
  const url = `${SITE.url}/blog/${post.slug}`;
  const isHtml = post.source === "wordpress";
  const body = isHtml ? post.html : post.body;
  const rawSegments = bodySegments(body, { products: post.products, recipes: post.recipes, html: isHtml });
  // The recipe for Google and Pinterest: the one attached at the end, or
  // else the first recipe card in the post.
  const recipe = post.recipe || post.recipes[0] || null;
  const faq = faqSchema(rawSegments);
  // Every recipe card gets its own anchor (#recipe, #recipe-2, ...) in page
  // order, so the hero can jump to each one when a post has several.
  const jumps = [];
  const anchorFor = (r) => {
    const id = jumps.length ? `recipe-${jumps.length + 1}` : "recipe";
    jumps.push({ id, title: r.title });
    return id;
  };
  const anchored = rawSegments.map((s) => (s.type === "recipe" ? { ...s, anchorId: anchorFor(s.recipe) } : s));
  // The end card only gets its own jump when it isn't already in the post.
  const inBody = anchored.some((s) => s.type === "recipe" && s.recipe.id === post.recipe?.id);
  const endRecipe = post.recipe && !inBody ? { recipe: post.recipe, id: anchorFor(post.recipe) } : null;
  const { segments, headings } = withHeadingIds(anchored, { endRecipe });
  // The jump buttons' sticker shadow: butter on hot pink, pink elsewhere.
  const jumpShadow = cat.color === "pink" ? "shadow-[5px_5px_0_var(--butter)]" : "shadow-[5px_5px_0_var(--pink)]";
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  // Every Save goes out with the post's tall pin image (./pin) and a
  // description longer than the title, which is what Pinterest searches.
  const pinImage = `${url}/pin`;
  const pinDescription = [post.title, post.excerpt].filter(Boolean).join(" | ").slice(0, 480);
  const pinUrl = `https://www.pinterest.com/pin/create/button/?${new URLSearchParams({ url, media: pinImage, description: pinDescription })}`;

  return (
    <article id="post">
      <ReadingProgress targetId="post" />
      <JsonLd
        item={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt || undefined,
          image: post.cover_url ? [post.cover_url] : undefined,
          datePublished: post.published_at || undefined,
          dateModified: post.updated_at || undefined,
          author: { "@type": "Person", name: "Coco" },
          mainEntityOfPage: url,
        }}
      />
      {faq && <JsonLd item={faq} />}
      {recipe && <JsonLd item={recipeSchema(recipe, { url, author: "Coco", published: post.published_at })} />}

      <header className={`relative z-10 border-b-[3px] border-ink pb-14 pt-32 sm:pt-36 ${COLOR[cat.color].hero}`}>
        <div className="relative mx-auto max-w-3xl px-5 text-center">
          <Link
            href="/blog"
            className="follow-theme sticker-sm inline-flex -rotate-2 items-center gap-2 rounded-full bg-paper px-4 py-1 font-display tracking-wide text-ink"
          >
            <CategoryIcon name={cat.icon} className="h-5 w-5" /> {cat.label}
          </Link>
          <h1
            className={`mt-5 font-display text-4xl leading-[1.05] tracking-wide sm:text-6xl ${cat.color === "pink" ? "text-outline" : ""}`}
          >
            {post.title}
          </h1>
          {post.excerpt && <p className="mx-auto mt-4 max-w-2xl text-lg font-medium">{post.excerpt}</p>}
          <p className="mt-4 text-sm font-semibold">
            By Coco{date ? ` · ${date}` : ""} · {readingMinutes(body, { html: isHtml })} min read
          </p>
          {jumps.length === 1 && (
            <a
              href="#recipe"
              className={`lift mt-6 inline-block rounded-full border-[3px] border-ink bg-ink px-6 py-3 font-display text-lg tracking-wide text-paper ${jumpShadow}`}
            >
              Jump to recipe ↓
            </a>
          )}
          {jumps.length > 1 && <RecipeJump jumps={jumps} shadow={jumpShadow} />}
          <div>
            <a
              href={pinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="follow-theme sticker-sm mt-5 inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2 font-display tracking-wide text-ink"
            >
              <Heart className="h-5 w-5" /> Save to Pinterest
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16 lg:grid lg:max-w-6xl lg:grid-cols-[15rem_minmax(0,48rem)] lg:gap-10">
        <aside className="hidden lg:block">
          <TableOfContents headings={headings} />
        </aside>
        <div>
          {post.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase storage or WordPress URLs
            <img
              src={post.cover_url}
              alt=""
              data-pin-media={pinImage}
              data-pin-description={pinDescription}
              data-pin-url={url}
              className="sticker mb-10 aspect-[4/3] w-full rotate-[-1deg] rounded-[2rem] object-cover"
            />
          )}

          {post.products.length > 0 && (
            <p className="mb-8 rounded-2xl border-2 border-dashed border-ink/40 px-4 py-3 text-sm text-ink/70">
              This post has affiliate links. If you buy through them I may earn a small commission at no extra cost to you.
            </p>
          )}

          <TableOfContents headings={headings} variant="mobile" />

          {/* Text chunks get the post typography; cards sit between them unstyled. */}
          <div className="space-y-[1.1em]">
            {segments.map((s, i) =>
              s.type === "html" ? (
                <div key={i} dangerouslySetInnerHTML={{ __html: s.html }} className="post-body" />
              ) : s.type === "faq" ? (
                <div key={i} className="py-4">
                  <FaqBlock title={s.title} intro={s.intro} items={s.items} />
                </div>
              ) : s.type === "recipe" ? (
                <div key={i} className="py-6">
                  <RecipeCard recipe={s.recipe} pinUrl={pinUrl} anchor={s.anchorId} />
                </div>
              ) : (
                <div key={i} className="post-body">
                  <ProductEmbed product={s.product} />
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {post.recipe && (
        <div className="mx-auto max-w-5xl px-5 pb-16">
          <RecipeCard recipe={post.recipe} pinUrl={pinUrl} anchor={endRecipe?.id ?? false} />
        </div>
      )}

      <div className="mx-auto max-w-3xl space-y-8 px-5 pb-20">
        {mailchimpConfigured && <EmailSignup source={post.category || "blog-post"} />}
        <div className="sticker flex flex-col items-center gap-3 rounded-[2rem] bg-blush p-6 text-center sm:flex-row sm:text-left">
          <Heart className="h-10 w-10 shrink-0 animate-wiggle" />
          <p className="flex-1 text-lg font-medium">Thanks for reading! Pin it for later, and come back for more.</p>
          <Link
            href="/blog"
            className="shrink-0 rounded-full border-[2.5px] border-ink bg-paper px-5 py-2 font-display tracking-wide"
          >
            More posts
          </Link>
        </div>
      </div>
    </article>
  );
}
