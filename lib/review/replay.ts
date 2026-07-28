import { getReviewScheduler } from "@/lib/review/scheduler";
import type { ReviewEvent, ReviewTargetRef } from "@/lib/review/types";

export type ReviewReplayDiagnostic =
  | "cycle"
  | "cross_target_prior"
  | "duplicate_event_id"
  | "self_reference"
  | "unknown_scheduler";

export type ReviewReplayResult = {
  canonicalEvent: ReviewEvent | null;
  excludedEventIds: string[];
  diagnostics: ReviewReplayDiagnostic[];
};

type ResolvedBranch = { terminal: ReviewEvent; depth: number };

export function resolveCanonicalReviewTip(
  allEvents: readonly ReviewEvent[],
  target: ReviewTargetRef,
): ReviewReplayResult {
  const globalById = new Map(allEvents.map((event) => [event.eventId, event]));
  const events = allEvents.filter((event) => sameTarget(event.target, target));
  if (!events.length) return { canonicalEvent: null, excludedEventIds: [], diagnostics: [] };
  if (new Set(events.map((event) => event.eventId)).size !== events.length) {
    return {
      canonicalEvent: null,
      excludedEventIds: [...new Set(events.map((event) => event.eventId))].sort(),
      diagnostics: ["duplicate_event_id"],
    };
  }
  const byId = new Map(events.map((event) => [event.eventId, event]));
  const adjacency = new Map<string, Set<string>>(events.map((event) => [event.eventId, new Set()]));
  for (const event of events) {
    if (event.priorEventId && byId.has(event.priorEventId)) {
      adjacency.get(event.eventId)!.add(event.priorEventId);
      adjacency.get(event.priorEventId)!.add(event.eventId);
    }
  }

  const components: ReviewEvent[][] = [];
  const seen = new Set<string>();
  for (const event of events) {
    if (seen.has(event.eventId)) continue;
    const component: ReviewEvent[] = [];
    const stack = [event.eventId];
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      component.push(byId.get(id)!);
      for (const neighbour of adjacency.get(id) ?? []) stack.push(neighbour);
    }
    components.push(component);
  }

  const excludedEventIds: string[] = [];
  const diagnostics = new Set<ReviewReplayDiagnostic>();
  const resolved: ResolvedBranch[] = [];
  for (const component of components) {
    const problem = componentProblem(component, globalById);
    if (problem) {
      diagnostics.add(problem);
      excludedEventIds.push(...component.map((event) => event.eventId));
      continue;
    }
    const branch = resolveComponent(component);
    if (branch) resolved.push(branch);
  }
  resolved.sort(compareBranches);
  return {
    canonicalEvent: resolved[0]?.terminal ?? null,
    excludedEventIds: excludedEventIds.sort(),
    diagnostics: [...diagnostics].sort(),
  };
}

function componentProblem(
  component: readonly ReviewEvent[],
  globalById: ReadonlyMap<string, ReviewEvent>,
): ReviewReplayDiagnostic | null {
  const ids = new Set(component.map((event) => event.eventId));
  for (const event of component) {
    if (!getReviewScheduler(event.schedulerVersion)) return "unknown_scheduler";
    if (event.priorEventId === event.eventId) return "self_reference";
    const prior = event.priorEventId ? globalById.get(event.priorEventId) : undefined;
    if (prior && !sameTarget(prior.target, event.target)) return "cross_target_prior";
  }
  const resolved = new Set<string>();
  for (const event of component) {
    if (resolved.has(event.eventId)) continue;
    const path = new Set<string>();
    let current: string | null = event.eventId;
    while (current && ids.has(current) && !resolved.has(current)) {
      if (path.has(current)) return "cycle";
      path.add(current);
      current = globalById.get(current)?.priorEventId ?? null;
    }
    path.forEach((id) => resolved.add(id));
  }
  return null;
}

function resolveComponent(component: readonly ReviewEvent[]) {
  const byId = new Map(component.map((event) => [event.eventId, event]));
  const childCounts = new Map<string, number>(component.map((event) => [event.eventId, 0]));
  for (const event of component) {
    if (event.priorEventId && byId.has(event.priorEventId)) {
      childCounts.set(event.priorEventId, (childCounts.get(event.priorEventId) ?? 0) + 1);
    }
  }
  const depthById = new Map<string, number>();
  const depth = (terminal: ReviewEvent) => {
    const path: ReviewEvent[] = [];
    let current: ReviewEvent | undefined = terminal;
    while (current && !depthById.has(current.eventId)) {
      path.push(current);
      current = current.priorEventId ? byId.get(current.priorEventId) : undefined;
    }
    let value = current ? depthById.get(current.eventId) ?? 0 : 0;
    for (let index = path.length - 1; index >= 0; index -= 1) {
      value += 1;
      depthById.set(path[index].eventId, value);
    }
    return depthById.get(terminal.eventId)!;
  };
  return component
    .filter((event) => childCounts.get(event.eventId) === 0)
    .map((terminal) => ({ terminal, depth: depth(terminal) }))
    .sort(compareBranches)[0] ?? null;
}

function compareBranches(left: ResolvedBranch, right: ResolvedBranch) {
  const incorrect = Number(right.terminal.outcome === "incorrect") - Number(left.terminal.outcome === "incorrect");
  if (incorrect) return incorrect;
  const time = Date.parse(right.terminal.occurredAt) - Date.parse(left.terminal.occurredAt);
  if (time) return time;
  if (left.depth !== right.depth) return right.depth - left.depth;
  return left.terminal.eventId.localeCompare(right.terminal.eventId);
}

function sameTarget(left: ReviewTargetRef, right: ReviewTargetRef) {
  return left.targetType === right.targetType && left.targetId === right.targetId;
}
