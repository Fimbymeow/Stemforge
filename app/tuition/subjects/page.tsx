import type { Metadata } from "next";
import { Suspense } from "react";
import { TuitionFooter } from "@/components/tuition/tuition-footer";
import { TuitionNavbar } from "@/components/tuition/tuition-navbar";
import { TuitionSubjects } from "@/components/tuition/tuition-subjects";

export const metadata: Metadata = {
  title: "Subjects — Tuition",
  description: "National 5 and Higher Maths and Physics tuition, built around the SQA curriculum.",
};

export default function TuitionSubjectsPage() {
  return (
    <>
      <TuitionNavbar />
      <main>
        <Suspense fallback={null}>
          <TuitionSubjects />
        </Suspense>
      </main>
      <TuitionFooter />
    </>
  );
}
