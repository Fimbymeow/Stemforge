import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthFeatureProvider } from "@/components/auth-feature-provider";
import { isAuthFeatureAvailable } from "@/lib/auth/config";
import { ProgressSyncProvider } from "@/components/progress-sync-provider";
import "katex/dist/katex.min.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const title = "STEM Forge - Structured SQA STEM Learning";
const description = "A calm, guided learning platform for Scottish SQA STEM students. Start with Higher Maths Basic differentiation.";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stemforge.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | STEM Forge",
  },
  description,
  applicationName: "STEM Forge",
  icons: {
    icon: "/assets/stemforge-logo-header.png",
    apple: "/assets/stemforge-logo-header.png",
  },
  openGraph: {
    title,
    description,
    siteName: "STEM Forge",
    type: "website",
    images: [
      {
        url: "/assets/stemforge-logo-header.png",
        width: 300,
        height: 91,
        alt: "STEM Forge",
      },
    ],
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const accountsAvailable = isAuthFeatureAvailable();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AuthFeatureProvider accountsAvailable={accountsAvailable}>
          <ProgressSyncProvider accountsAvailable={accountsAvailable}><div id="main-content" tabIndex={-1}>{children}</div></ProgressSyncProvider>
        </AuthFeatureProvider>
      </body>
    </html>
  );
}
