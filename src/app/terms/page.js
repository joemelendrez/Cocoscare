import Link from "next/link";
import LegalPage, { ContactLine } from "@/components/LegalPage";
import { SITE } from "@/lib/content";

export const metadata = {
  title: "Terms of use",
  description: `The ground rules for using ${SITE.name}, its recipes, tools and free account.`,
  alternates: { canonical: "/terms" },
};

const LIST = "list-disc space-y-1.5 pl-5 marker:text-pink";
const A = "font-semibold text-pink-deep underline";

const SECTIONS = [
  {
    id: "using",
    title: "Using this site",
    body: (
      <p>
        By using {SITE.name} you agree to these terms. They&rsquo;re short, and they&rsquo;re here to keep everyone safe and the
        site fun to use.
      </p>
    ),
  },
  {
    id: "advice",
    title: "Tips, not medical advice",
    body: (
      <>
        <p>
          I share what has worked for me as a career nanny and a mom. It isn&rsquo;t medical, nutrition or safety advice, and it
          doesn&rsquo;t replace your pediatrician or doctor.
        </p>
        <p>If you&rsquo;re worried about your child&rsquo;s health, eating or development, please ask a professional.</p>
      </>
    ),
  },
  {
    id: "recipes",
    title: "Recipes and allergies",
    body: (
      <ul className={LIST}>
        <li>Check every ingredient for allergies before you cook, and read the labels on packaged foods.</li>
        <li>
          Cut food to a safe size for your child&rsquo;s age. Whole grapes, nuts and popcorn are choking risks for little ones.
        </li>
        <li>Cooking times, amounts and the kitchen converter are close guides, so use your judgment.</li>
      </ul>
    ),
  },
  {
    id: "activities",
    title: "Activities and outings",
    body: (
      <p>
        Activities, crafts and outings on this site are meant to be done with an adult watching. Small parts, scissors, water and
        heat all need supervision. You know your child best, so pick what fits their age.
      </p>
    ),
  },
  {
    id: "products",
    title: "Products and affiliate links",
    body: (
      <>
        <p>
          I only share things I&rsquo;d use myself, but I don&rsquo;t make or sell them. Prices and stock change, and the shop you
          buy from is responsible for the product and the sale. Always check the age range and safety notes on anything for kids.
        </p>
        <p>
          Some links are affiliate links, so I may earn a small commission at no extra cost to you. As an Amazon Associate I earn
          from qualifying purchases.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <p>
        Accounts are free. Please use your own email and keep it to one account per person. I may close an account that&rsquo;s
        used to abuse the site. You can delete yours any time on{" "}
        <Link href="/account" className={A}>
          My account
        </Link>
        .
      </p>
    ),
  },
  {
    id: "content",
    title: "Sharing my content",
    body: (
      <p>
        You&rsquo;re welcome to pin, share and link to anything here. Please don&rsquo;t copy whole posts, recipes or photos onto
        another site without asking first.
      </p>
    ),
  },
  {
    id: "liability",
    title: "The legal part",
    body: (
      <p>
        {SITE.name} is offered as is, without promises that it will always be available or error-free. As far as the law allows,
        I&rsquo;m not responsible for any loss or injury from using the site, its recipes, tools or the products it links to.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and questions",
    body: (
      <>
        <p>If these terms change, I&rsquo;ll update the date on this page. Using the site after that means you accept them.</p>
        <ContactLine />
        <p>
          See the{" "}
          <Link href="/privacy" className={A}>
            privacy policy
          </Link>{" "}
          for what I keep about you.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Ground rules"
      title="Terms of use"
      intro="Short, plain and mostly about keeping little ones safe."
      updated="October 17, 2026"
      color="mint"
      sections={SECTIONS}
    />
  );
}
