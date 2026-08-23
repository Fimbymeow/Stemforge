import { higherMathematicsOfficialSkillMappings } from "@/data/curriculum/higher-mathematics/official-skill-mappings";
import type { CanonicalSkillSpecificationMapping } from "@/lib/curriculum/official-skill-mapping";

/**
 * The one canonical official-requirement -> canonical-skill resolver. Every downstream consumer
 * (assessment scope matching, Assessment Readiness, the Create Assessment scope picker) reads
 * through this function rather than re-walking `officialSkillMappings` itself, so there is never a
 * second, hand-maintained requirement<->skill mapping anywhere in the codebase.
 *
 * Deterministic and deduplicated: if requirement A maps to skills [X, Y] and requirement B maps to
 * skills [X, Z], resolving [A, B] returns [X, Y, Z] in that first-seen order — never [X, Y, X, Z].
 * Unknown/invalid requirement IDs contribute nothing and never throw (they simply resolve to no
 * skills), matching every other defensive normalizer in this codebase.
 */
export function resolveSkillsForRequirements(
  specPointIds: readonly string[],
  mappings: readonly CanonicalSkillSpecificationMapping[] = higherMathematicsOfficialSkillMappings,
): string[] {
  const index = skillIdsBySpecPointId(mappings);
  const seen = new Set<string>();
  const resolved: string[] = [];
  for (const pointId of specPointIds) {
    for (const skillId of index.get(pointId) ?? []) {
      if (seen.has(skillId)) continue;
      seen.add(skillId);
      resolved.push(skillId);
    }
  }
  return resolved;
}

function skillIdsBySpecPointId(mappings: readonly CanonicalSkillSpecificationMapping[]): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const mapping of mappings) {
    for (const pointId of mapping.officialSpecificationPointIds) {
      const ids = index.get(pointId) ?? [];
      ids.push(mapping.skillPathId);
      index.set(pointId, ids);
    }
  }
  return index;
}
