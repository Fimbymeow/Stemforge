import { getActiveSkillPathHref } from "@/lib/learning-paths";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="grid justify-items-center gap-5 px-5 py-8 text-center text-muted">
      <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-8 gap-y-5 font-mono text-[13px] font-bold">
        <Link href="#about">About</Link>
        <Link href="/tuition">Tuition</Link>
        <Link href="/subjects">Subjects</Link>
        <Link href={getActiveSkillPathHref()}>Basic differentiation</Link>
      </nav>
      <p className="m-0 max-w-3xl text-xs leading-relaxed">
        STEM Forge creates original Qualifications Scotland-style practice materials and is not affiliated with or endorsed by Qualifications Scotland.
      </p>
      <p className="m-0 max-w-3xl text-xs leading-relaxed">
        Private-beta testers should use the feedback instructions supplied with their test invitation.
      </p>
    </footer>
  );
}

