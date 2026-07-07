import Link from "next/link";

export function Footer() {
  return (
    <footer className="grid justify-items-center gap-5 px-5 py-8 text-center text-muted">
      <nav className="flex flex-wrap justify-center gap-x-8 gap-y-5 font-mono text-[13px] font-bold">
        <Link href="#about">About</Link>
        <Link href="#tuition">Tuition</Link>
        <Link href="/subjects">Subjects</Link>
        <Link href="/subjects/higher-maths/calculus/differentiation/basic-differentiation">Basic differentiation</Link>
      </nav>
      <p className="m-0 max-w-3xl text-xs leading-relaxed">
        STEM Forge creates original SQA-style learning material and is not affiliated with or endorsed by the SQA.
      </p>
    </footer>
  );
}