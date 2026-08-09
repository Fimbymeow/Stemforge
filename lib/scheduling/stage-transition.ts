export type StageTransitionConfiguration<Stage, Outcome> = {
  version: number;
  intervals: ReadonlyMap<Stage, number>;
  transition(previous: Stage | null, outcome: Outcome): Stage;
};

export function transitionStage<Stage, Outcome>(
  configuration: StageTransitionConfiguration<Stage, Outcome>,
  previous: Stage | null,
  outcome: Outcome,
) {
  return configuration.transition(previous, outcome);
}

export function intervalForStage<Stage, Outcome>(
  configuration: StageTransitionConfiguration<Stage, Outcome>,
  stage: Stage,
) {
  return configuration.intervals.get(stage) ?? null;
}

export function dueAtFromInterval<Stage, Outcome>(
  configuration: StageTransitionConfiguration<Stage, Outcome>,
  anchor: string,
  stage: Stage,
) {
  const timestamp = Date.parse(anchor);
  const interval = intervalForStage(configuration, stage);
  if (!Number.isFinite(timestamp) || interval === null) return null;
  return new Date(timestamp + interval).toISOString();
}
