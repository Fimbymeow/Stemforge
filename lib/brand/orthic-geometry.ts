export const ORTHIC_VIEWBOX = "0 0 64 64";
export const ORTHIC_OUTLINE_PATH = "M32 5 58 55H6L32 5Zm0 12.8L16.5 47h31L32 17.8Z";
export const ORTHIC_ALTITUDE_PATH = "M29.5 13h5v34h-5z";
export const ORTHIC_FOOT_PATH = "M29.5 43.5h9V48h-9z";

export const ORTHIC_CONSTRUCTION_PATHS = {
  firstEdge: "M32 5 6 55",
  secondEdge: "M32 5 58 55",
  base: "M6 55H58",
  altitude: "M32 5V47",
  rightAngle: "M32 47h7v-7",
} as const;
