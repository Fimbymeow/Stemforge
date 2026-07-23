import { ACTIVE_CONTENT_STATUS } from "@/data/content-metadata";
import type { CourseArea } from "@/data/types";
import { createHigherMathsPlaceholder } from "@/data/higher-maths/placeholder";

export const higherMathsLinesCirclesSequencesStrandIds = {
  rectilinearShapes: "applying-algebraic-skills-to-rectilinear-shapes",
  circlesAndGraphs: "applying-algebraic-skills-to-circles-and-graphs",
  modellingSequences: "modelling-situations-using-sequences",
} as const;

const courseHref = "/subjects/higher-maths/lines-circles-and-sequences";

function placeholder(
  specArea: string,
  slug: string,
  specificationStrandId: string,
  displayOrder: number,
  name: string,
  description: string,
) {
  return createHigherMathsPlaceholder({
    slug,
    specificationStrandId,
    displayOrder,
    name,
    description,
    parentHref: `${courseHref}/${specArea}`,
  });
}

export const higherMathsLinesCirclesSequencesCourseArea: CourseArea = {
  slug: "lines-circles-and-sequences",
  contentStatus: ACTIVE_CONTENT_STATUS,
  name: "Lines, Circles and Sequences",
  description: "Apply algebra to coordinate geometry, circles and recurrence relationships.",
  href: courseHref,
  available: false,
  progress: 0,
  questionsCompleted: 0,
  specificationStrands: [
    {
      id: higherMathsLinesCirclesSequencesStrandIds.rectilinearShapes,
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Applying algebraic skills to rectilinear shapes",
      description: "Use gradients, line equations and triangle-line properties.",
      displayOrder: 1,
      href: courseHref,
    },
    {
      id: higherMathsLinesCirclesSequencesStrandIds.circlesAndGraphs,
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Applying algebraic skills to circles and graphs",
      description: "Use circle equations, tangency and intersections.",
      displayOrder: 2,
      href: courseHref,
    },
    {
      id: higherMathsLinesCirclesSequencesStrandIds.modellingSequences,
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Modelling situations using sequences",
      description: "Build and interpret recurrence relations and their limits.",
      displayOrder: 3,
      href: courseHref,
    },
  ],
  specAreas: [
    {
      slug: "straight-lines",
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Straight Lines",
      description: "Use gradients and equations to analyse lines and rectilinear shapes.",
      href: `${courseHref}/straight-lines`,
      progress: 0,
      completed: 0,
      questions: 0,
      status: "coming-soon",
      isAvailable: false,
      skillPaths: [
        placeholder("straight-lines", "parallel-and-perpendicular-lines", higherMathsLinesCirclesSequencesStrandIds.rectilinearShapes, 1, "Parallel and perpendicular lines", "Find equations of parallel and perpendicular lines and test perpendicularity."),
        placeholder("straight-lines", "gradient-and-angle", higherMathsLinesCirclesSequencesStrandIds.rectilinearShapes, 2, "Gradient and angle", "Use m = tan theta to calculate gradients and angles."),
        placeholder("straight-lines", "medians-altitudes-and-perpendicular-bisectors", higherMathsLinesCirclesSequencesStrandIds.rectilinearShapes, 3, "Medians, altitudes and perpendicular bisectors", "Use triangle-line properties with equations and intersections of lines."),
      ],
    },
    {
      slug: "circles",
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Circles",
      description: "Use circle equations and geometric properties to solve intersection and tangency problems.",
      href: `${courseHref}/circles`,
      progress: 0,
      completed: 0,
      questions: 0,
      status: "coming-soon",
      isAvailable: false,
      skillPaths: [
        placeholder("circles", "equation-of-a-circle", higherMathsLinesCirclesSequencesStrandIds.circlesAndGraphs, 1, "Equation of a circle", "Determine and use the equation of a circle."),
        placeholder("circles", "tangency-to-a-circle", higherMathsLinesCirclesSequencesStrandIds.circlesAndGraphs, 2, "Tangency to a circle", "Use properties of tangency to solve circle problems."),
        placeholder("circles", "line-circle-intersections", higherMathsLinesCirclesSequencesStrandIds.circlesAndGraphs, 3, "Line-circle intersections", "Determine the intersection of a line and a circle."),
        placeholder("circles", "circle-circle-intersections", higherMathsLinesCirclesSequencesStrandIds.circlesAndGraphs, 4, "Circle-circle intersections", "Determine the intersection of two circles."),
      ],
    },
    {
      slug: "sequences",
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Sequences",
      description: "Model situations with recurrence relations and interpret limiting behaviour.",
      href: `${courseHref}/sequences`,
      progress: 0,
      completed: 0,
      questions: 0,
      status: "coming-soon",
      isAvailable: false,
      skillPaths: [
        placeholder("sequences", "recurrence-relations", higherMathsLinesCirclesSequencesStrandIds.modellingSequences, 1, "Recurrence relations", "Determine a recurrence relation and use it to calculate required terms."),
        placeholder("sequences", "limits-of-sequences", higherMathsLinesCirclesSequencesStrandIds.modellingSequences, 2, "Limits of sequences", "Find and interpret the limit of a sequence where it exists."),
      ],
    },
  ],
};
