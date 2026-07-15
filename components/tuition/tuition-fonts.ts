import { Lora } from "next/font/google";

// Shared serif accent for the tuition sub-brand headings — loaded once here so
// every page pulls the same font instance instead of re-declaring next/font calls.
export const lora = Lora({ subsets: ["latin"], weight: ["600", "700"], style: ["normal", "italic"], display: "swap" });
