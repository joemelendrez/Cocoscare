import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import HideOnAdmin from "@/components/HideOnAdmin";
import { SITE } from "@/lib/content";
import { THEME_SCRIPT } from "@/components/ThemeToggle";

// Self-hosted (next/font/google fetches at build time, which has broken
// Netlify builds on Joseph's other sites).
const lilita = localFont({
  src: "./fonts/lilita-one.woff2",
  variable: "--font-lilita",
  display: "swap",
});

const fredoka = localFont({
  src: "./fonts/fredoka.woff2",
  variable: "--font-fredoka",
  weight: "300 700",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: ${SITE.tagline}`, template: `%s | ${SITE.name}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
  // Claiming cocoscare.com in Pinterest (Settings > Claimed accounts) gives a
  // p:domain_verify code; set it as PINTEREST_DOMAIN_VERIFY on Netlify.
  ...(process.env.PINTEREST_DOMAIN_VERIFY && { other: { "p:domain_verify": process.env.PINTEREST_DOMAIN_VERIFY } }),
};

export const viewport = { themeColor: "#ff0f9a" };

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: THEME_SCRIPT sets data-theme before React loads.
    <html lang="en" className={`${lilita.variable} ${fredoka.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-[100] rounded-full bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <Providers>
          <HideOnAdmin>
            <Header />
          </HideOnAdmin>
          <main id="main" className="flex-1">
            {children}
          </main>
          <HideOnAdmin>
            <Footer />
          </HideOnAdmin>
        </Providers>
      </body>
    </html>
  );
}
