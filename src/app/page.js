import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import ScrollBands from "@/components/ScrollBands";
import PinWall from "@/components/PinWall";
import { CategoryCard, PickCard, PostCard, SectionTitle } from "@/components/Cards";
import { Cookie, Flower, Heart, Sparkle, Star } from "@/components/Doodles";
import { Parallax, Reveal, Stagger, StaggerItem } from "@/components/Motion";
import { CATEGORIES } from "@/lib/content";
import { getPosts, getProducts } from "@/lib/data";
import { mailchimpConfigured } from "@/lib/mailchimp";
import EmailSignup from "@/components/EmailSignup";

const TILTS = [-2, 1.5, -1, 2];

export const revalidate = 60;

export default async function Home() {
  const [{ posts, sample }, { products }] = await Promise.all([getPosts({ limit: 9 }), getProducts({ limit: 4 })]);
  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-5 pt-16 sm:pt-20">
        <Reveal>
          <SectionTitle eyebrow="Pick a lane" title="What are we doing" accent="today?" />
        </Reveal>
        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat, i) => (
            <StaggerItem key={cat.key} tilt={TILTS[i]} className="h-full">
              <CategoryCard cat={cat} />
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <ScrollBands />

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <Reveal>
          <SectionTitle eyebrow="Fresh from the kitchen table" title="Latest" accent="posts">
            {sample
              ? "Real posts land here once the blog is connected."
              : "New recipes, finds and outings, fresh from the kitchen table."}
          </SectionTitle>
        </Reveal>
        <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post) => (
            <StaggerItem key={post.slug} className="h-full">
              <PostCard post={post} />
            </StaggerItem>
          ))}
        </Stagger>
        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="sticker lift inline-block rounded-full bg-butter px-7 py-3 font-display text-xl tracking-wide"
          >
            See all posts
          </Link>
        </div>
      </section>

      {posts.length > 3 && <PinWall posts={posts} />}

      <section className="relative overflow-hidden py-24 sm:py-32">
        <Parallax speed={120} className="absolute left-[6%] top-10">
          <Cookie className="h-16 w-16 drop-shadow-[3px_3px_0_var(--shadow)]" />
        </Parallax>
        <Parallax speed={-90} rotate={20} className="absolute right-[8%] top-24">
          <Star className="h-14 w-14" />
        </Parallax>
        <Parallax speed={160} rotate={-25} className="absolute bottom-16 left-[45%]">
          <Flower className="h-12 w-12" />
        </Parallax>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <Parallax speed={50} className="relative mx-auto w-full max-w-sm">
            <div className="sticker relative aspect-square rotate-[-4deg] rounded-[2.5rem] bg-periwinkle">
              <div className="dots absolute inset-0 rounded-[2.3rem]" aria-hidden="true" />
              <Image src="/coco-logo.webp" alt="" fill sizes="384px" className="object-contain p-4" />
            </div>
            <span className="sticker-sm absolute -bottom-5 -right-3 rotate-6 rounded-full bg-paper px-4 py-2 font-display text-lg tracking-wide">
              Hi, I&rsquo;m Coco! <Heart className="inline h-5 w-5" />
            </span>
          </Parallax>
          <Reveal>
            <SectionTitle eyebrow="Meet the mama" title="10+ years of" accent="other people's kids" center={false} />
            <div className="mt-6 space-y-4 text-lg text-ink/80">
              <p>
                I spent my whole career as a nanny: naps, picky eaters, rainy days and every baby gadget you can imagine. Now
                I&rsquo;m home with my own little one, and this is where I share what actually works.
              </p>
              <p>No fluff, no 40-step recipes. Just the good stuff, tested on real kids.</p>
            </div>
            <Link
              href="/about"
              className="sticker lift mt-8 inline-flex items-center gap-2 rounded-full bg-pink px-7 py-3 font-display text-xl tracking-wide text-paper"
            >
              My story <Sparkle className="h-5 w-5" />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="dots-ink border-y-[3px] border-ink bg-blush py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <SectionTitle eyebrow="Coco approved" title="Shop my" accent="faves">
              The things I bought twice: once for a nanny family, once for us.
            </SectionTitle>
          </Reveal>
          <Stagger className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((pick, i) => (
              <StaggerItem key={pick.slug || pick.name} tilt={TILTS[i] / 2} className="h-full">
                <PickCard pick={pick} />
              </StaggerItem>
            ))}
          </Stagger>
          <div className="mt-10 text-center">
            <Link
              href="/shop"
              className="lift inline-block rounded-full border-[3px] border-ink bg-ink px-7 py-3 font-display text-xl tracking-wide text-paper shadow-[5px_5px_0_var(--pink)] hover:shadow-[8px_8px_0_var(--pink)]"
            >
              Visit the shop
            </Link>
          </div>
        </div>
      </section>

      {mailchimpConfigured && (
        <section className="mx-auto max-w-3xl px-5 py-20">
          <Reveal>
            <EmailSignup source="home" />
          </Reveal>
        </section>
      )}
    </>
  );
}
