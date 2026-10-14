import PageHero from "@/components/PageHero";
import { BlogGrid } from "@/components/FilterGrid";
import { getPosts } from "@/lib/data";

export const revalidate = 60;

export const metadata = {
  title: "Blog",
  description: "Easy recipes, mom finds, kid-tested outings and nanny tips from Coco.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const { posts, sample } = await getPosts();
  return (
    <>
      <PageHero eyebrow="The blog" title="Fresh posts" color="butter">
        Recipes, mom finds, outings and nanny tips{sample ? ". Real posts show up here once the blog is connected." : ", tested on real kids."}
      </PageHero>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <BlogGrid posts={posts} />
      </section>
    </>
  );
}
