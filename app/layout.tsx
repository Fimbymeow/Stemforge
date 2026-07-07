import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
