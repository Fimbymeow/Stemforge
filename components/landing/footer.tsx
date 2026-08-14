import Link from "next/link";
import { OrthicWordmark } from "@/components/brand/orthic-mark";

export function Footer() {
  return (
    <footer className="border-t border-line px-5 py-9 text-muted">
      <div className="mx-auto grid w-[min(1180px,100%)] grid-cols-[1fr_auto] gap-8 max-md:grid-cols-1">
        <div><OrthicWordmark /><p className="mt-3 max-w-sm text-sm leading-relaxed">Structured STEM learning for Scottish students, beginning with Higher Maths.</p></div>
        <nav aria-label="Footer" className="grid grid-cols-3 gap-x-8 gap-y-3 text-sm font-bold max-sm:grid-cols-2">
          <Link href="/subjects">Courses</Link>
          <Link href="/tuition">Orthic Tuition</Link>
          <Link href="/account">Account</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
      <div className="mx-auto mt-8 w-[min(1180px,100%)] border-t border-line pt-5 text-xs leading-relaxed">
        <p>Orthic creates original Qualifications Scotland-style practice materials and is not affiliated with or endorsed by Qualifications Scotland.</p>
      </div>
    </footer>
  );
}
