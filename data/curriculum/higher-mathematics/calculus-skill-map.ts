/**
 * The proposed canonical Calculus skill map, audited against the live registry in
 * data/higher-maths.ts. This file is deliberately data, not prose, so
 * lib/curriculum/coverage.ts can compute "proposed canonical skills absent from the
 * current live registry" mechanically instead of by hand.
 *
 * Reconciled against the approved 49-skill migration: the map below reflects the final
 * 17-skill Calculus structure — the "Stationary Points" / "Nature of Stationary Points"
 * split entries have merged into one ("stationary-points"), "Recovering a Function from a
 * Rate of Change" has merged into "differential-equations", and the "further-integration"
 * / "areas-using-integration" bundled entries have been superseded by their four live split
 * successors. "mixed-differentiation-practice" remains listed only to document why it is
 * excluded from the canonical map — it no longer exists in the live registry at all.
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

  { skillPathId: "tangents-and-normals", displayName: "Tangents", headingGroup: "Using Differentiation to Investigate Functions", liveStatus: "live-coming-soon", note: "VERIFIED (May 2023 spec, p6): the official statement names only \"the equation of a tangent\" — no normal-line skill appears anywhere in the document. Migrated: the live skillPathId keeps its slug (tangents-and-normals) for compatibility, but its displayed name is now \"Tangents\" — the normal-line implication has been removed from the live registry's name and description." },
  { skillPathId: "increasing-and-decreasing-functions", displayName: "Increasing and Decreasing", headingGroup: "Using Differentiation to Investigate Functions", liveStatus: "live-placeholder" },
  { skillPathId: "stationary-points", displayName: "Stationary Points and Their Nature", headingGroup: "Using Differentiation to Investigate Functions", liveStatus: "live-coming-soon", note: "VERIFIED (May 2023 spec, p6): the official specification does not list this as a separate statement from nature-classification and curve-sketching — all three sit inside one compound bullet. Migrated: the former \"nature-of-stationary-points\" skill has merged into this surviving identity (slug unchanged) — finding stationary points and classifying their nature (via sign changes of f'(x), explicitly excluding the second-derivative test) are now one canonical skill. Curve sketching remains a separate skill; see graph-sketching-using-calculus." },
  { skillPathId: "graph-sketching-using-calculus", displayName: "Curve Sketching Using Calculus", headingGroup: "Using Differentiation to Investigate Functions", liveStatus: "live-placeholder", note: "VERIFIED (May 2023 spec, p6): part of the same compound official statement as Stationary Points and Their Nature — see note there. Kept as a separate canonical skill per the approved migration; now hard-requires stationary-points." },

  { skillPathId: "basic-integration", displayName: "Basic Integration", headingGroup: "Integrating Functions", liveStatus: "live-coming-soon" },
  { skillPathId: "integration-composite-power", displayName: "Integration of Bracket Powers", headingGroup: "Integrating Functions", liveStatus: "live-coming-soon", note: "VERIFIED (May 2023 spec, p7): the official spec lists (x+q)^n and (px+q)^n as two separate bullets, both now covered by this skill. Migrated: superseded the bundled \"further-integration\" skill, which has been removed from the live registry; this identity is new, not inherited from further-integration." },
  { skillPathId: "trigonometric-integration", displayName: "Trigonometric Integration", headingGroup: "Integrating Functions", liveStatus: "live-coming-soon", note: "VERIFIED (May 2023 spec, p7): the official spec separately lists p cos x/p sin x and p cos(qx+r)/p sin(qx+r) as two bullets, both now covered by this skill. Migrated: superseded the bundled \"further-integration\" skill, which has been removed from the live registry; this identity is new, not inherited from further-integration." },
  { skillPathId: "differential-equations", displayName: "Differential Equations", headingGroup: "Integrating Functions", liveStatus: "live-coming-soon", note: "RESOLVED (May 2023 spec, p7): \"solving differential equations of the form dy/dx = f(x)\" sits directly inside the Integrating Functions bullet list, not Applying Integral Calculus. Migrated: absorbed the former \"reconstructing-a-function-from-a-rate-and-initial-conditions\" placeholder — determining and using the resulting function from a rate and an initial condition is now part of this skill's scope, not a separate identity." },

  { skillPathId: "definite-integrals", displayName: "Definite Integrals", headingGroup: "Definite Integration", liveStatus: "live-coming-soon" },

  { skillPathId: "optimisation", displayName: "Optimisation", headingGroup: "Applications of Differential Calculus", liveStatus: "live-coming-soon" },
  { skillPathId: "greatest-and-least-values-on-closed-intervals", displayName: "Closed-Interval Greatest and Least Values", headingGroup: "Applications of Differential Calculus", liveStatus: "live-placeholder" },
  { skillPathId: "rates-of-change", displayName: "Rates of Change", headingGroup: "Applications of Differential Calculus", liveStatus: "live-placeholder" },

  { skillPathId: "area-under-curve", displayName: "Area Between a Curve and the Axis", headingGroup: "Applications of Integral Calculus", liveStatus: "live-coming-soon", note: "VERIFIED (May 2023 spec, p7): the official spec explicitly lists this as its own bullet, distinct from area-between-curves. Migrated: superseded the bundled \"areas-using-integration\" skill, which has been removed from the live registry; this identity is new, not inherited from areas-using-integration." },
  { skillPathId: "area-between-curves", displayName: "Area Between Curves or a Line and a Curve", headingGroup: "Applications of Integral Calculus", liveStatus: "live-coming-soon", note: "VERIFIED (May 2023 spec, p7): the official spec explicitly lists this as its own bullet, distinct from area-under-curve. Migrated: superseded the bundled \"areas-using-integration\" skill, which has been removed from the live registry; this identity is new, not inherited from areas-using-integration. May carry a question-level (not skill-level) dependency on intersections-of-lines-and-curves for questions that require finding an intersection first." },

  { skillPathId: "mixed-differentiation-practice", displayName: "Mixed Differentiation Practice", headingGroup: "(not part of the canonical skill map)", liveStatus: "excluded", note: "CONFIRMED (May 2023 spec, full document read): no bullet in the official specification resembles mixed-practice content — it is not a specification-mapped skill. Migrated: removed from the live registry entirely (it no longer exists as a SkillPath). It may return later as a non-canonical Practice Session grouping, Question Bank category or revision set, but never as a canonical skill with its own mastery or Review identity." },
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
