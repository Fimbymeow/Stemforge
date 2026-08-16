import { basicDifferentiationPackage } from "@/data/curriculum/higher-mathematics/basic-differentiation-package";
import { chainRulePackage } from "@/data/curriculum/higher-mathematics/chain-rule-package";
import { tangentsPackage } from "@/data/curriculum/higher-mathematics/tangents-package";
import type { SkillPackageManifest } from "@/lib/curriculum/skill-package";

/** One discoverable registry for every Higher Maths package that has entered production. */
export const higherMathematicsSkillPackages: readonly SkillPackageManifest[] = [
  basicDifferentiationPackage,
  chainRulePackage,
  tangentsPackage,
];

export const higherMathematicsSkillPackageById = new Map(
  higherMathematicsSkillPackages.map((manifest) => [manifest.skillPathId, manifest]),
);
