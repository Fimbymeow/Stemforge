import { ImageResponse } from "next/og";
import { ORTHIC_ALTITUDE_PATH, ORTHIC_FOOT_PATH, ORTHIC_OUTLINE_PATH, ORTHIC_VIEWBOX } from "@/lib/brand/orthic-geometry";

export const alt = "Orthic — Learn with Precision";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f5f4f0", color: "#16191c", padding: "88px 96px" }}>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 28, fontWeight: 800, letterSpacing: "0.2em" }}>
          <svg viewBox={ORTHIC_VIEWBOX} width="64" height="64">
            <path fill="#234b6e" fillRule="evenodd" d={ORTHIC_OUTLINE_PATH} />
            <path fill="#234b6e" d={ORTHIC_ALTITUDE_PATH} />
            <path fill="#234b6e" d={ORTHIC_FOOT_PATH} />
          </svg>
          ORTHIC
        </div>
        <div style={{ marginTop: 64, fontSize: 76, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em" }}>Learn with Precision.</div>
        <div style={{ marginTop: 28, fontSize: 27, color: "#5e6265", lineHeight: 1.45 }}>Structured Scottish STEM learning. Start with Higher Maths.</div>
      </div>
      <svg viewBox={ORTHIC_VIEWBOX} width="210" height="210" style={{ color: "#234b6e" }}>
        <path fill="currentColor" fillRule="evenodd" d={ORTHIC_OUTLINE_PATH} />
        <path fill="currentColor" d={ORTHIC_ALTITUDE_PATH} />
        <path fill="currentColor" d={ORTHIC_FOOT_PATH} />
      </svg>
    </div>,
    size,
  );
}
