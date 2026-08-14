import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthFeatureProvider } from "@/components/auth-feature-provider";
import { isAuthFeatureAvailable } from "@/lib/auth/config";
import { ProgressSyncProvider } from "@/components/progress-sync-provider";
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AuthFeatureProvider accountsAvailable={accountsAvailable}>
          <ProgressSyncProvider accountsAvailable={accountsAvailable}>{children}</ProgressSyncProvider>
        </AuthFeatureProvider>
      </body>
    </html>
  );
}
