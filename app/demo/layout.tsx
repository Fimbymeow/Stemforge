import type { Metadata } from "next";
import { DemoShell } from "@/components/demo/demo-shell";

const title = "Orthic Preview — Higher Maths";
const description = "Explore Orthic through one complete Higher Maths skill: Chain Rule Notes, interactive practice and deterministic marking.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  robots: { index: false, follow: false },
  openGraph: {
    title,
    description,
    siteName: "Orthic",
    type: "website",
    url: "/demo",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Orthic — Learn with Precision" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoShell>{children}</DemoShell>;
}
