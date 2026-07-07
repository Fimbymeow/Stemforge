import type { ReactNode } from "react";

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`ml-[268px] px-[clamp(26px,4vw,58px)] py-12 max-xl:ml-0 max-md:px-4 max-md:py-8 ${className}`}>{children}</main>;
}

