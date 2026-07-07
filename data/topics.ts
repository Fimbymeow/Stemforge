// Legacy Higher Physics demo code. The active question engine is the Higher Maths QuestionWorkspace.
import { higherPhysics } from "@/data/higher-physics";

export const higherPhysicsCourseAreas = higherPhysics.courseAreas.map((area) => ({
  ...area,
  specAreaCount: area.specAreas.length,
}));

export const dynamicUniverseSubtopics = higherPhysics.courseAreas[0].specAreas;

export const learningStages = higherPhysics.learningStages;



