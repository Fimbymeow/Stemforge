import type { ReactNode } from "react";

export function SectionShell({
  id,
  kicker,
  title,
  children,
}: {
  id?: string;
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto w-[min(1220px,calc(100%_-_40px))] border-t border-line py-[68px]">
      <p className="mb-4 text-center font-mono text-[13px] font-extrabold uppercase">{kicker}</p>
      <h2 className="mx-auto mb-9 max-w-[760px] text-center text-[clamp(34px,5vw,64px)] font-extrabold leading-[1.02]">
        {title}
      </h2>
      {children}
    </section>
  );
}
