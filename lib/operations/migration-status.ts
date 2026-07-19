export type MigrationStatus = {
  expectedCount: number;
  appliedCount: number;
  pending: string[];
  unexpected: string[];
  current: boolean;
};

export function compareMigrationStatus(expected: readonly string[], applied: readonly string[]): MigrationStatus {
  const appliedSet = new Set(applied);
  const expectedSet = new Set(expected);
  const pending = expected.filter((name) => !appliedSet.has(name));
  const unexpected = applied.filter((name) => !expectedSet.has(name));
  return {
    expectedCount: expected.length,
    appliedCount: applied.length,
    pending,
    unexpected,
    current: pending.length === 0 && unexpected.length === 0,
  };
}
