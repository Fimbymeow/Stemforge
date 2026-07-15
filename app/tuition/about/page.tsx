import type { Metadata } from "next";
import { TuitionAbout } from "@/components/tuition/tuition-about";
import { TuitionFooter } from "@/components/tuition/tuition-footer";
import { TuitionNavbar } from "@/components/tuition/tuition-navbar";

export const metadata: Metadata = {
  title: "About — Tuition",
  description: "Meet the tutor behind STEM Forge's National 5 and Higher Maths and Physics tuition.",
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
