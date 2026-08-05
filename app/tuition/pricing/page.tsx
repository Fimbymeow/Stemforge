import type { Metadata } from "next";
import { getTuitionLevelBySlug } from "@/components/tuition/tuition-data";
import { TuitionFooter } from "@/components/tuition/tuition-footer";
import { TuitionNavbar } from "@/components/tuition/tuition-navbar";
import { TuitionPricing } from "@/components/tuition/tuition-pricing";

const national5Price = getTuitionLevelBySlug("national-5-maths")?.pricePerHour;
const higherPrice = getTuitionLevelBySlug("higher-maths")?.pricePerHour;

export const metadata: Metadata = {
  title: "Pricing — Tuition",
  description: `£${national5Price}/hour for National 5, £${higherPrice}/hour for Higher — Maths and Physics tuition with a free first session.`,
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
