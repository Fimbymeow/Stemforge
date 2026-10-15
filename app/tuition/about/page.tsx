import type { Metadata } from "next";
import { TuitionAbout } from "@/components/tuition/tuition-about";
import { TuitionFooter } from "@/components/tuition/tuition-footer";
import { TuitionNavbar } from "@/components/tuition/tuition-navbar";

export const metadata: Metadata = {
  title: "About — Tuition",
  description:
    "Finlay Kennedy has 2+ years of tutoring experience, achieved A grades across five Highers and is currently studying Advanced Higher Mathematics, Physics, Chemistry and Mathematics of Mechanics.",
};

export default function TuitionAboutPage() {
  return (
    <>
      <TuitionNavbar />
      <main>
        <TuitionAbout />
      </main>
      <TuitionFooter />
    </>
  );
}
