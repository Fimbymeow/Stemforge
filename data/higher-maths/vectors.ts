import { ACTIVE_CONTENT_STATUS } from "@/data/content-metadata";
import type { CourseArea } from "@/data/types";
import { createHigherMathsPlaceholder } from "@/data/higher-maths/placeholder";

export const higherMathsVectorStrandIds = {
  determiningVectorConnections: "determining-vector-connections",
  workingWithVectors: "working-with-vectors",
} as const;

const courseHref = "/subjects/higher-maths/vectors";

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

export const higherMathsVectorsCourseArea: CourseArea = {
  slug: "vectors",
  contentStatus: ACTIVE_CONTENT_STATUS,
  name: "Vectors",
  description: "Work with vector pathways, geometric connections and scalar products in two and three dimensions.",
  href: courseHref,
  available: false,
  progress: 0,
  questionsCompleted: 0,
  specificationStrands: [
    {
      id: higherMathsVectorStrandIds.determiningVectorConnections,
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Determining vector connections",
      description: "Determine resultants, collinearity and internal division points.",
      displayOrder: 1,
      href: courseHref,
    },
    {
      id: higherMathsVectorStrandIds.workingWithVectors,
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Working with vectors",
      description: "Use unit vectors and scalar products to solve geometric problems.",
      displayOrder: 2,
      href: courseHref,
    },
  ],
  specAreas: [
    {
      slug: "vector-connections",
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Vector Connections",
      description: "Connect points and pathways using vector geometry in three dimensions.",
      href: `${courseHref}/vector-connections`,
      progress: 0,
      completed: 0,
      questions: 0,
      status: "coming-soon",
      isAvailable: false,
      skillPaths: [
        placeholder("vector-connections", "vector-pathways-and-resultants-in-three-dimensions", higherMathsVectorStrandIds.determiningVectorConnections, 1, "Vector pathways and resultants in three dimensions", "Determine the resultant of vector pathways in three dimensions."),
        placeholder("vector-connections", "collinearity", higherMathsVectorStrandIds.determiningVectorConnections, 2, "Collinearity", "Use parallel vectors and a common point to establish collinearity."),
        placeholder("vector-connections", "internal-division-of-a-line", higherMathsVectorStrandIds.determiningVectorConnections, 3, "Internal division of a line", "Determine the coordinates of an internal division point."),
      ],
    },
    {
      slug: "vector-operations",
      contentStatus: ACTIVE_CONTENT_STATUS,
      name: "Vector Operations",
      description: "Use vector bases, unit vectors and scalar-product properties.",
      href: `${courseHref}/vector-operations`,
      progress: 0,
      completed: 0,
      questions: 0,
      status: "coming-soon",
      isAvailable: false,
      skillPaths: [
        placeholder("vector-operations", "unit-vectors-and-ijk-basis", higherMathsVectorStrandIds.workingWithVectors, 1, "Unit vectors and the i, j, k basis", "Use and find unit vectors, including i, j and k as a basis."),
        placeholder("vector-operations", "scalar-product-and-angle-between-vectors", higherMathsVectorStrandIds.workingWithVectors, 2, "Scalar product and angle between vectors", "Evaluate a scalar product and determine the angle between two vectors."),
        placeholder("vector-operations", "scalar-product-properties-and-perpendicularity", higherMathsVectorStrandIds.workingWithVectors, 3, "Scalar-product properties and perpendicularity", "Apply scalar-product properties, including perpendicular vector conditions."),
      ],
    },
  ],
};
