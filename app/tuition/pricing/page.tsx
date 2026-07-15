import type { Metadata } from "next";
import { TuitionFooter } from "@/components/tuition/tuition-footer";
import { TuitionNavbar } from "@/components/tuition/tuition-navbar";
import { TuitionPricing } from "@/components/tuition/tuition-pricing";

export const metadata: Metadata = {
  title: "Pricing — Tuition",
  description: "£20/hour for National 5, £25/hour for Higher — Maths and Physics tuition with a free trial session.",
};

export default function TuitionPricingPage() {
  return (
    <>
      <TuitionNavbar />
      <main>
        <TuitionPricing />
      </main>
      <TuitionFooter />
    </>
  );
}
