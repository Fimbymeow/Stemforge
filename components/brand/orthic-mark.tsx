import {
  ORTHIC_ALTITUDE_PATH,
  ORTHIC_CONSTRUCTION_PATHS,
  ORTHIC_FOOT_PATH,
  ORTHIC_OUTLINE_PATH,
  ORTHIC_VIEWBOX,
} from "@/lib/brand/orthic-geometry";

export function OrthicMark({ className = "", title = "Orthic" }: { className?: string; title?: string }) {
  return (
    <svg viewBox={ORTHIC_VIEWBOX} role="img" aria-label={title} className={className}>
      <path fill="currentColor" fillRule="evenodd" d={ORTHIC_OUTLINE_PATH} />
      <path fill="currentColor" d={ORTHIC_ALTITUDE_PATH} />
      <path fill="currentColor" d={ORTHIC_FOOT_PATH} />
    </svg>
  );
}

export function OrthicWordmark({ className = "", reversed = false }: { className?: string; reversed?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-3 ${reversed ? "text-white" : "text-ink"} ${className}`}>
      <OrthicMark className={`size-9 shrink-0 ${reversed ? "text-white" : "text-forge"}`} />
      <span className="text-[19px] font-extrabold tracking-[0.19em]">ORTHIC</span>
    </span>
  );
}

export function OrthicConstructionMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={ORTHIC_VIEWBOX} aria-hidden="true" className={`orthic-construction ${className}`}>
      <g className="orthic-construction-lines" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4">
        <path className="orthic-draw orthic-edge-one" pathLength="1" d={ORTHIC_CONSTRUCTION_PATHS.firstEdge} />
        <path className="orthic-draw orthic-edge-two" pathLength="1" d={ORTHIC_CONSTRUCTION_PATHS.secondEdge} />
        <path className="orthic-draw orthic-base" pathLength="1" d={ORTHIC_CONSTRUCTION_PATHS.base} />
        <path className="orthic-draw orthic-altitude" pathLength="1" d={ORTHIC_CONSTRUCTION_PATHS.altitude} />
        <path className="orthic-draw orthic-right-angle" pathLength="1" d={ORTHIC_CONSTRUCTION_PATHS.rightAngle} />
      </g>
      <g className="orthic-construction-fill">
        <path fill="currentColor" fillRule="evenodd" d={ORTHIC_OUTLINE_PATH} />
        <path fill="currentColor" d={ORTHIC_ALTITUDE_PATH} />
        <path fill="currentColor" d={ORTHIC_FOOT_PATH} />
      </g>
    </svg>
  );
}
