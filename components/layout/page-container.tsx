import type { ReactNode } from "react";

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`ml-[268px] px-[clamp(20px,3vw,42px)] py-8 max-xl:ml-0 max-md:px-4 max-md:py-5 ${className}`}>{children}</main>;
}