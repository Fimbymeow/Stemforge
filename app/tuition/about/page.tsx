import type { Metadata } from "next";
import { TuitionAbout } from "@/components/tuition/tuition-about";
import { TuitionFooter } from "@/components/tuition/tuition-footer";
import { TuitionNavbar } from "@/components/tuition/tuition-navbar";

export const metadata: Metadata = {
  title: "About — Tuition",
  description:
    "Finlay Kennedy, 17, achieved A grades across five Highers and is now studying Advanced Higher Maths, Physics and Chemistry while tutoring National 5 and Higher Maths and Physics.",
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
