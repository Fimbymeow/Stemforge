/**
 * Photo-ready placeholder for Finlay's tutor photo. No real photograph exists in the
 * repository yet — this renders an initials treatment on the existing forge-soft token
 * rather than a generic person icon, a stock photo, or visible instructional text, so the
 * layout already looks finished and simply needs a real <Image> swapped in later.
 */
export function TuitionAvatarPlaceholder({ size = "md" }: { size?: "md" | "lg" }) {
  const sizeClass = size === "lg" ? "size-24 text-2xl" : "size-16 text-lg";
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-forge-soft font-extrabold text-forge ${sizeClass}`}
      aria-hidden="true"
    >
      FK
    </span>
  );
}
