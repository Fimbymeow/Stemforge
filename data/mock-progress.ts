import type { ProgressStatus } from "@/data/types";

export type MockProgressScope = "subject" | "course_area" | "topic" | "skill_path" | "learning_stage" | "question";

export type MockProgressRecord = {
  id: string;
  scope: MockProgressScope;
  status: ProgressStatus;
  completed: number;
  total: number;
};

export const mockProgress: MockProgressRecord[] = [
  { id: "higher-maths", scope: "subject", status: "in_progress", completed: 0, total: 1 },
  { id: "calculus", scope: "course_area", status: "in_progress", completed: 0, total: 1 },
  { id: "differentiation", scope: "topic", status: "in_progress", completed: 0, total: 1 },
  { id: "basic-differentiation", scope: "skill_path", status: "not_started", completed: 0, total: 8 },
];

export function getMockProgress(id: string) {
  return mockProgress.find((item) => item.id === id);
}

export function getProgressPercent(completed: number, total: number) {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}
