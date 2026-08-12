import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthFeatureProvider } from "@/components/auth-feature-provider";
import { isAuthFeatureAvailable } from "@/lib/auth/config";
import { ProgressSyncProvider } from "@/components/progress-sync-provider";
import "katex/dist/katex.min.css";
import "mathlive/fonts.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const title = "Orthic — Structured STEM learning for Scottish students";
const description = "Structured STEM learning for Scottish students.";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_ENV === "production" ? "https://stemforge-6an8.vercel.app" : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Orthic",
  },
  description,
  applicationName: "Orthic",
  icons: {
    icon: "/assets/orthic-mark.svg",
    apple: "/assets/orthic-mark.svg",
  },
  openGraph: {
    title,
    description,
    siteName: "Orthic",
    type: "website",
    images: [
      {
        url: "/assets/orthic-wordmark.svg",
        width: 260,
        height: 64,
        alt: "Orthic",
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
          <ProgressSyncProvider accountsAvailable={accountsAvailable}>{children}</ProgressSyncProvider>
        </AuthFeatureProvider>
      </body>
    </html>
  );
}
