/**
 * The proposed canonical Calculus skill map, audited against the live registry in
 * data/higher-maths.ts. This file is deliberately data, not prose, so
 * lib/curriculum/coverage.ts can compute "proposed canonical skills absent from the
 * current live registry" mechanically instead of by hand.
 *
 * liveStatus:
 *   "live-available"   — a real SkillPath, status "available", isAvailable true
 *   "live-coming-soon" — a real SkillPath with its own slug/href, status "coming-soon"
 *   "live-placeholder" — created via createHigherMathsPlaceholder(); metadata-only, no own route
 *   "proposed-absent"  — this exact skill does not exist as a standalone SkillPath yet;
 *                         it is currently bundled inside another live skill (noted in
 *                         `bundledWithSkillId`)
 *   "excluded"         — deliberately left out of the canonical skill map for Phase 1;
 *                         `note` explains why
 */
export type ProposedCalculusSkillEntry = {
  skillPathId: string;
  displayName: string;
  headingGroup: string;
  liveStatus: "live-available" | "live-coming-soon" | "live-placeholder" | "proposed-absent" | "excluded";
  bundledWithSkillId?: string;
  note?: string;
};

export const proposedCalculusSkillMap: ProposedCalculusSkillEntry[] = [
  { skillPathId: "basic-differentiation", displayName: "Basic Differentiation", headingGroup: "Differentiating Functions", liveStatus: "live-available" },
  { skillPathId: "trigonometric-differentiation", displayName: "Trigonometric Differentiation", headingGroup: "Differentiating Functions", liveStatus: "live-coming-soon" },
  { skillPathId: "chain-rule", displayName: "Chain Rule", headingGroup: "Differentiating Functions", liveStatus: "live-coming-soon" },

  { skillPathId: "tangents-and-normals", displayName: "Tangents", headingGroup: "Using Differentiation to Investigate Functions", liveStatus: "live-coming-soon", note: "VERIFIED (May 2023 spec, p6): the official statement names only \"the equation of a tangent\" — no normal-line skill appears anywhere in the document. The live skillPathId keeps its current name in this pass (no live rename), but the canonical concept this maps to should be understood as Tangents, not Tangents and Normals." },
  { skillPathId: "increasing-and-decreasing-functions", displayName: "Increasing and Decreasing", headingGroup: "Using Differentiation to Investigate Functions", liveStatus: "live-placeholder" },
  { skillPathId: "stationary-points", displayName: "Stationary Points (finding)", headingGroup: "Using Differentiation to Investigate Functions", liveStatus: "live-coming-soon", note: "VERIFIED (May 2023 spec, p6): the official specification does not list this as a separate statement from nature-classification and curve-sketching — all three sit inside one compound bullet. The three-way split below is a pedagogical decision, not a reflection of three separate official statements; see hm-calc-stationary-nature-sketching's three coverage claims." },
  { skillPathId: "nature-of-stationary-points", displayName: "Stationary Points (classifying nature)", headingGroup: "Using Differentiation to Investigate Functions", liveStatus: "live-coming-soon", note: "VERIFIED (May 2023 spec, p6): part of the same compound official statement as Stationary Points and Curve Sketching — see note there." },
  { skillPathId: "graph-sketching-using-calculus", displayName: "Curve Sketching", headingGroup: "Using Differentiation to Investigate Functions", liveStatus: "live-placeholder", note: "VERIFIED (May 2023 spec, p6): part of the same compound official statement as Stationary Points and Nature of Stationary Points — see note there." },

  { skillPathId: "basic-integration", displayName: "Basic Integration", headingGroup: "Integrating Functions", liveStatus: "live-coming-soon" },
  { skillPathId: "further-integration", displayName: "Further Integration (currently bundled)", headingGroup: "Integrating Functions", liveStatus: "live-coming-soon", note: "The real, live skill path today — currently bundles all four of the official spec's power-integration and trig-integration bullets. Expected to be superseded by the two split entries below once that split is actually made; both this entry and the split entries are listed so the coverage report can track either state honestly." },
  { skillPathId: "integration-composite-power", displayName: "Integration of Bracket Powers / Reverse Chain Rule", headingGroup: "Integrating Functions", liveStatus: "proposed-absent", bundledWithSkillId: "further-integration", note: "VERIFIED (May 2023 spec, p7): the official spec is more granular than this single proposed skill suggests — it lists (x+q)^n and (px+q)^n as two separate bullets. Currently both sit inside the single live 'further-integration' skill path, alongside two trig-integration bullets." },
  { skillPathId: "trigonometric-integration", displayName: "Trigonometric Integration", headingGroup: "Integrating Functions", liveStatus: "proposed-absent", bundledWithSkillId: "further-integration", note: "VERIFIED (May 2023 spec, p7): the official spec separately lists p cos x/p sin x and p cos(qx+r)/p sin(qx+r) as two bullets. Currently both sit inside the single live 'further-integration' skill path, alongside two power-integration bullets." },
  { skillPathId: "differential-equations", displayName: "Differential Equations", headingGroup: "Integrating Functions", liveStatus: "live-coming-soon", note: "RESOLVED (May 2023 spec, p7): \"solving differential equations of the form dy/dx = f(x)\" sits directly inside the Integrating Functions bullet list, not Applying Integral Calculus. The open question in STEM_FORGE_SQA_TAXONOMY_AND_MULTI_PATH_RUNTIME.md §17 is settled by the official document's own structure — Integrating Functions is correct." },

  { skillPathId: "definite-integrals", displayName: "Definite Integrals", headingGroup: "Definite Integration", liveStatus: "live-coming-soon" },

  { skillPathId: "optimisation", displayName: "Optimisation", headingGroup: "Applications of Differential Calculus", liveStatus: "live-coming-soon" },
  { skillPathId: "greatest-and-least-values-on-closed-intervals", displayName: "Closed-Interval Greatest and Least Values", headingGroup: "Applications of Differential Calculus", liveStatus: "live-placeholder" },
  { skillPathId: "rates-of-change", displayName: "Rates of Change", headingGroup: "Applications of Differential Calculus", liveStatus: "live-placeholder" },

  { skillPathId: "areas-using-integration", displayName: "Areas Using Integration (currently bundled)", headingGroup: "Applications of Integral Calculus", liveStatus: "live-coming-soon", note: "The real, live skill path today — currently bundles both of the official spec's area bullets. Expected to be superseded by the two split entries below once that split is actually made." },
  { skillPathId: "area-under-curve", displayName: "Area Between a Curve and the Axis", headingGroup: "Applications of Integral Calculus", liveStatus: "proposed-absent", bundledWithSkillId: "areas-using-integration", note: "VERIFIED (May 2023 spec, p7): the official spec explicitly lists this as its own bullet, distinct from area-between-curves — the strongest-evidenced split candidate in this whole map. Currently bundled with area-between-curves inside the single live 'areas-using-integration' skill path." },
  { skillPathId: "area-between-curves", displayName: "Area Between Curves / a Line and a Curve", headingGroup: "Applications of Integral Calculus", liveStatus: "proposed-absent", bundledWithSkillId: "areas-using-integration", note: "VERIFIED (May 2023 spec, p7): the official spec explicitly lists this as its own bullet, distinct from area-under-curve. Currently bundled with area-under-curve inside the single live 'areas-using-integration' skill path." },
  { skillPathId: "reconstructing-a-function-from-a-rate-and-initial-conditions", displayName: "Recovering a Function from a Rate of Change", headingGroup: "Applications of Integral Calculus", liveStatus: "live-placeholder" },

  { skillPathId: "mixed-differentiation-practice", displayName: "Mixed Differentiation Practice", headingGroup: "(not part of the canonical skill map)", liveStatus: "excluded", note: "CONFIRMED (May 2023 spec, full document read): no bullet in the official specification resembles mixed-practice content — it is not a specification-mapped skill. Exists live only as a coming-soon skill path; treat it as a mixed-practice mode/resource, never as a canonical skill." },
];

/**
 * Every skillPathId that is genuinely part of the proposed canonical skill map — including
 * the "proposed-absent" entries, since those are exactly the candidates
 * lib/curriculum/coverage.ts needs in order to detect which proposed skills are still
 * missing a standalone identity in the live registry. Only "excluded" entries (skills
 * deliberately left out of the canonical map) are omitted.
 */
export const proposedCalculusSkillPathIds = proposedCalculusSkillMap
  .filter((entry) => entry.liveStatus !== "excluded")
  .map((entry) => entry.skillPathId);
