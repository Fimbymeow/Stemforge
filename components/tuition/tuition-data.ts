import { Atom, Calculator, type LucideIcon } from "lucide-react";

export type TuitionLevel = {
  slug: string;
  subject: "Maths" | "Physics";
  level: "National 5" | "Higher";
  name: string;
  icon: LucideIcon;
  pricePerHour: number;
  copy: string;
  topics: string[];
};

export const tuitionLevels: TuitionLevel[] = [
  {
    slug: "national-5-maths",
    subject: "Maths",
    level: "National 5",
    name: "National 5 Maths",
    icon: Calculator,
    pricePerHour: 20,
    copy: "Building a robust foundational understanding to secure the grades that enable your next steps.",
    topics: [
      "Algebra and simplifying expressions",
      "Simultaneous equations",
      "Trigonometry (right-angled and non right-angled)",
      "Circles, area and volume",
      "Statistics and data analysis",
    ],
  },
  {
    slug: "higher-maths",
    subject: "Maths",
    level: "Higher",
    name: "Higher Maths",
    icon: Calculator,
    pricePerHour: 25,
    copy: "Solidify the advanced topics — from Calculus to exam technique — to secure the result you need.",
    topics: [
      "Differentiation",
      "Integration",
      "Trigonometric identities and equations",
      "Sequences and recurrence relations",
      "Straight lines and functions",
    ],
  },
  {
    slug: "national-5-physics",
    subject: "Physics",
    level: "National 5",
    name: "National 5 Physics",
    icon: Atom,
    pricePerHour: 20,
    copy: "Work through the full course with focused explanation and steady, methodical practice.",
    topics: ["Dynamics and space", "Electricity", "Properties of matter", "Waves and radiation"],
  },
  {
    slug: "higher-physics",
    subject: "Physics",
    level: "Higher",
    name: "Higher Physics",
    icon: Atom,
    pricePerHour: 25,
    copy: "Rigorous exploration of the Higher Physics specification, built for confident exam performance.",
    topics: ["Mechanics and properties of matter", "Electricity", "Waves and particles", "Radiation"],
  },
];

export function getTuitionLevelBySlug(slug: string) {
  return tuitionLevels.find((level) => level.slug === slug);
}
