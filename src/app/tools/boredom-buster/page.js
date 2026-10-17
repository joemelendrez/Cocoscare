import { KiteDoodle } from "@/components/Doodles";
import PageHero from "@/components/PageHero";
import BoredomBuster from "@/components/tools/BoredomBuster";

export const metadata = {
  title: "Boredom Buster: Easy Activities for Toddlers and Kids",
  description:
    "Bored kids? Pick an age and inside or outside and get an easy activity idea with what you need and how to do it. Free, no sign-up.",
  alternates: { canonical: "/tools/boredom-buster" },
};

export default function BoredomBusterPage() {
  return (
    <>
      <PageHero
        eyebrow="Free tool"
        title="Boredom buster"
        color="pink"
        icon={<KiteDoodle className="h-20 w-20 sm:h-24 sm:w-24" />}
      >
        &ldquo;I&rsquo;m bored&rdquo;? One tap for an easy idea, with what you need and how to do it.
      </PageHero>
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <BoredomBuster />
        </div>
      </section>
    </>
  );
}
