import PageHero from "@/components/PageHero";
import { BlogGrid } from "@/components/FilterGrid";

export const metadata = {
  title: "Blog",
  description: "Easy recipes, mom finds, kid-tested outings and nanny tips from Coco.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <>
      <PageHero eyebrow="The blog" title="Fresh posts" color="butter">
        Recipes, mom finds, outings and nanny tips. Real posts show up here once the blog is connected.
      </PageHero>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <BlogGrid />
      </section>
    </>
  );
}
