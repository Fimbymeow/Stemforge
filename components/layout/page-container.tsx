import type { CSSProperties, ReactNode } from "react";

/** Bottom padding always reserves space for the global feedback dock, which is fixed and can overlap unpadded content. */
const bottomReservationStyle: CSSProperties = {
  paddingBottom: "calc(var(--global-bottom-inset) + var(--feedback-dock-height) + var(--fixed-ui-gap))",
};

export function PageContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      style={bottomReservationStyle}
      className={`ml-[240px] px-[clamp(20px,3vw,42px)] pt-8 max-lg:ml-0 max-md:px-4 max-md:pt-5 ${className}`}
    >
      {children}
    </main>
  );
}
