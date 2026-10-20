export const HIGHER_MATHS_COURSE_HREF = "/subjects/higher-maths";

const COURSE_AREA_ANCHOR_PREFIX = "course-area-";

export function getCourseAreaAnchorId(courseAreaSlug: string) {
  return `${COURSE_AREA_ANCHOR_PREFIX}${courseAreaSlug}`;
}

export function getHigherMathsCourseAreaHref(courseAreaSlug: string) {
  return `${HIGHER_MATHS_COURSE_HREF}#${getCourseAreaAnchorId(courseAreaSlug)}`;
}

export function getCourseAreaSlugFromHash(hash: string) {
  const anchor = decodeURIComponent(hash.replace(/^#/, ""));
  return anchor.startsWith(COURSE_AREA_ANCHOR_PREFIX)
    ? anchor.slice(COURSE_AREA_ANCHOR_PREFIX.length)
    : null;
}
