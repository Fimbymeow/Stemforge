"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Scroll-triggered reveal for below-the-fold content. Content is always fully visible in the
 * server-rendered HTML and on first paint — this only ever hides an element, imperatively,
 * inside the same effect that also guarantees an observer is armed to reveal it again, so a
 * failed/slow hydration or a headless renderer can never leave content stuck invisible.
 */
export function TuitionReveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return; // already in view — leave it visible, no animation

    node.style.opacity = "0";
    node.style.transform = "translateY(10px)";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        node.style.animationDelay = `${delayMs}ms`;
        node.classList.add("animate-tuition-reveal");
        node.style.opacity = "";
        node.style.transform = "";
        observer.unobserve(node);
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delayMs]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
