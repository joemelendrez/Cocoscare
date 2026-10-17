import Link from "next/link";
import LegalPage, { ContactLine } from "@/components/LegalPage";
import { SITE } from "@/lib/content";

export const metadata = {
  title: "Privacy policy",
  description: `What ${SITE.name} keeps about you, where it lives, and how to delete it.`,
  alternates: { canonical: "/privacy" },
};

const LIST = "list-disc space-y-1.5 pl-5 marker:text-pink";
const A = "font-semibold text-pink-deep underline";

const SECTIONS = [
  {
    id: "short",
    title: "The short version",
    body: (
      <>
        <p>
          I keep as little as I can. You can read everything on {SITE.name} without giving me anything. There are no ads, no
          tracking pixels and no analytics scripts following you around.
        </p>
        <p>I never sell your information, and I only email you if you ask me to.</p>
      </>
    ),
  },
  {
    id: "device",
    title: "What stays on your device",
    body: (
      <>
        <p>
          The free tools save your work in your own browser (its local storage), so it&rsquo;s still there next time. That
          includes:
        </p>
        <ul className={LIST}>
          <li>your grocery list and the items you buy every week</li>
          <li>your meal plan</li>
          <li>whether you like the site light or dark</li>
        </ul>
        <p>This never reaches me unless you sign in (see below). Clearing your browser&rsquo;s site data removes it.</p>
      </>
    ),
  },
  {
    id: "account",
    title: "If you make an account",
    body: (
      <>
        <p>
          Accounts are free and optional. You sign in with a link sent to your email, so there&rsquo;s no password. When you have
          an account I keep:
        </p>
        <ul className={LIST}>
          <li>your email address, to sign you in</li>
          <li>the recipes and posts you save</li>
          <li>your grocery list and meal plan, so they show up on every device you sign in on</li>
        </ul>
        <p>
          These are stored with Supabase, the database the site runs on. Only you can see your own saves and lists. I can see how
          many times each recipe or post has been saved, but not who saved it.
        </p>
      </>
    ),
  },
  {
    id: "email",
    title: "Emails",
    body: (
      <>
        <p>
          If you join the newsletter, your email goes to Mailchimp, which sends it. Every email has an unsubscribe link at the
          bottom.
        </p>
        <p>
          If you use <strong>Email me this recipe</strong>, I send that one email through Resend. Your address is only added to
          the newsletter if you tick the box to join.
        </p>
      </>
    ),
  },
  {
    id: "links",
    title: "Shopping and affiliate links",
    body: (
      <>
        <p>
          Some links go to Amazon, Walmart, Instacart and other shops. Many are affiliate links, which means I may earn a small
          commission if you buy something, at no extra cost to you. As an Amazon Associate I earn from qualifying purchases.
        </p>
        <p>
          Those shops can set their own cookies once you land on their site, so they know the visit came from here. Their own
          privacy policies cover what they do with it.
        </p>
        <p>
          <strong>Send to Instacart</strong> sends the items on your grocery list to Instacart to build your cart, and nothing
          else about you.
        </p>
      </>
    ),
  },
  {
    id: "pinterest",
    title: "Pinterest",
    body: (
      <p>
        The <strong>Save to Pinterest</strong> and <strong>Pin it</strong> buttons are plain links that open Pinterest. Nothing
        from Pinterest loads on this site until you tap one.
      </p>
    ),
  },
  {
    id: "hosting",
    title: "Hosting",
    body: (
      <p>
        The site is hosted on Netlify. Like any web server, it briefly logs basic request details such as your IP address and
        browser, to keep the site running and safe.
      </p>
    ),
  },
  {
    id: "kids",
    title: "Kids",
    body: (
      <p>
        {SITE.name} is written for parents and caregivers. Accounts are for adults, and I don&rsquo;t knowingly collect anything
        from children under 13.
      </p>
    ),
  },
  {
    id: "delete",
    title: "Seeing or deleting your data",
    body: (
      <>
        <p>
          Your saves are all on{" "}
          <Link href="/account" className={A}>
            My account
          </Link>
          . To delete everything, go there and tap <strong>Delete my account</strong>. Your email, saves and synced lists are
          removed straight away.
        </p>
        <p>To leave the newsletter, use the unsubscribe link in any email.</p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Questions",
    body: (
      <>
        <ContactLine />
        <p>
          If this policy changes, I&rsquo;ll update the date on this page. Also see the{" "}
          <Link href="/terms" className={A}>
            terms of use
          </Link>
          .
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="The boring but important bit"
      title="Privacy policy"
      intro="What I keep about you, where it lives, and how to delete it. In plain words."
      updated="October 17, 2026"
      sections={SECTIONS}
    />
  );
}
