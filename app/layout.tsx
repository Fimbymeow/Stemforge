import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { RuntimeBoundary } from "@/components/runtime-boundary";
import { isAuthFeatureAvailable } from "@/lib/auth/config";
import { isPremiumPreviewAvailable } from "@/lib/premium-preview";
import "katex/dist/katex.min.css";
import "mathlive/fonts.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });
const title = "Orthic — Learn with Precision";
const description = "Structured Scottish STEM learning through clear notes, deliberate practice, worked solutions and Review. Start with Higher Maths.";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: title, template: "%s | Orthic" },
  description,
  applicationName: "Orthic",
  icons: { icon: "/assets/orthic-mark.svg", apple: "/assets/orthic-mark.svg" },
  openGraph: {
    title,
    description,
    siteName: "Orthic",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Orthic — Learn with Precision" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const accountsAvailable = isAuthFeatureAvailable();
  const premiumPreviewAvailable = isPremiumPreviewAvailable();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <RuntimeBoundary accountsAvailable={accountsAvailable} premiumPreviewAvailable={premiumPreviewAvailable}>{children}</RuntimeBoundary>
      </body>
    </html>
  );
}
