import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { SectionTitle } from "@/components/Cards";
import { Cookie, Heart, Star } from "@/components/Doodles";
import { Parallax, Reveal, Stagger, StaggerItem } from "@/components/Motion";

export const metadata = {
  title: "About Coco",
  description: "A career nanny turned stay-at-home mom sharing what actually works with little kids.",
  alternates: { canonical: "/about" },
};

// Placeholder story: Coco should rewrite this in her own words.
const FACTS = [
  { big: "10+", small: "years as a nanny", color: "bg-butter" },
  { big: "1", small: "little one of my own", color: "bg-mint" },
  { big: "∞", small: "snacks packed", color: "bg-periwinkle" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="Nice to meet you" title="Hi, I’m Coco!" color="mint">
        Career nanny, now a stay-at-home mama, sharing the stuff that actually works.
      </PageHero>

      <section className="relative overflow-hidden py-20 sm:py-28">
        <Parallax speed={140} rotate={30} className="absolute right-[6%] top-16">
          <Cookie className="h-16 w-16" />
        </Parallax>
        <Parallax speed={-80} className="absolute bottom-20 left-[4%]">
          <Star className="h-12 w-12" />
        </Parallax>
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-[1fr_1.2fr]">
          <Parallax speed={60} className="mx-auto w-full max-w-sm">
            <div className="sticker relative aspect-square rotate-3 rounded-full bg-pink">
              <div className="dots absolute inset-0 rounded-full" aria-hidden="true" />
              <Image src="/logo.webp" alt="Cartoon of Coco holding cookie dough" fill sizes="384px" className="object-contain" />
            </div>
          </Parallax>
          <Reveal>
            <SectionTitle eyebrow="My story" title="From nanny" accent="to mama" center={false} />
            <div className="mt-6 space-y-4 text-lg text-ink/80">
              <p>
                For more than ten years I cared for other people&rsquo;s kids. I learned which snacks a toddler will
                actually eat, which strollers survive a city sidewalk, and how to turn a rainy Tuesday into an
                adventure.
              </p>
              <p>
                Now I&rsquo;m home with my own little one, and friends kept asking for my lists. So here they are:
                easy recipes, the products I&rsquo;d buy again, the outings worth the drive, and the tricks I picked
                up along the way.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="ink-band border-y-[3px] border-ink bg-ink py-16">
        <Stagger className="mx-auto grid max-w-4xl gap-6 px-5 sm:grid-cols-3">
          {FACTS.map((f, i) => (
            <StaggerItem key={f.small} tilt={[-2, 1.5, -1][i]}>
              <div className={`sticker rounded-[2rem] p-6 text-center ${f.color}`}>
                <p className="font-display text-6xl tracking-wide">{f.big}</p>
                <p className="mt-1 font-semibold">{f.small}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <Reveal>
          <Heart className="mx-auto h-12 w-12 animate-wiggle" />
          <h2 className="mt-4 font-display text-4xl tracking-wide sm:text-5xl">Want my favorite things?</h2>
          <p className="mt-3 text-lg text-ink/75">Start with the shop, or dig into the latest posts.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/shop" className="sticker lift rounded-full bg-pink px-7 py-3 font-display text-xl tracking-wide text-paper">
              Shop my faves
            </Link>
            <Link href="/blog" className="sticker lift rounded-full bg-paper px-7 py-3 font-display text-xl tracking-wide">
              Read the blog
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
