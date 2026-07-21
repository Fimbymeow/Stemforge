// Legacy Higher Physics demo code. The active question engine is the Higher Maths QuestionWorkspace.
export type QuestionStage = "Foundations" | "Applications" | "Past Paper Questions";

export type StemForgeQuestion = {
  id: string;
  subject: "Higher Physics";
  courseArea: "Our dynamic Universe";
  specArea: "Motion - equations and graphs";
  stage: QuestionStage;
  difficulty: "Core" | "Standard" | "Challenge";
  marks: number;
  timeEstimate: string;
  question: string;
  answer: string;
  answerUnit: string;
  solution: Array<{
    title: string;
    equation: string;
    note: string;
  }>;
  commonMistake: string;
};

export const questions: StemForgeQuestion[] = [
  {
    id: "motion-f-001",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Foundations",
    difficulty: "Core",
    marks: 2,
    timeEstimate: "~2 min",
    question: "A trolley accelerates uniformly from rest to 12 m s^-1 in 6.0 s. Calculate its acceleration.",
    answer: "2.0",
    answerUnit: "m s^-2",
    solution: [
      { title: "Identify known values", equation: "u = 0 m s^-1, v = 12 m s^-1, t = 6.0 s", note: "From rest means the initial velocity is zero." },
      { title: "Use the acceleration formula", equation: "a = (v - u) / t", note: "This applies when acceleration is uniform." },
      { title: "Substitute values", equation: "a = (12 - 0) / 6.0 = 2.0 m s^-2", note: "The acceleration is 2.0 m s^-2." },
    ],
    commonMistake: "Students often forget that from rest means the initial velocity is 0 m s^-1.",
  },
  {
    id: "motion-f-002",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Foundations",
    difficulty: "Core",
    marks: 2,
    timeEstimate: "~2 min",
    question: "A car travels at a constant speed of 18 m s^-1 for 5.0 s. Calculate the distance travelled.",
    answer: "90",
    answerUnit: "m",
    solution: [
      { title: "Identify known values", equation: "v = 18 m s^-1, t = 5.0 s", note: "The speed is constant, so use distance = speed x time." },
      { title: "Use the formula", equation: "s = vt", note: "This links distance, speed and time." },
      { title: "Substitute values", equation: "s = 18 x 5.0 = 90 m", note: "The car travels 90 m." },
    ],
    commonMistake: "Students sometimes use acceleration equations even when the speed is constant.",
  },
  {
    id: "motion-f-003",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Foundations",
    difficulty: "Core",
    marks: 2,
    timeEstimate: "~2 min",
    question: "A cyclist changes speed from 4.0 m s^-1 to 10 m s^-1 in 3.0 s. Calculate the acceleration.",
    answer: "2.0",
    answerUnit: "m s^-2",
    solution: [
      { title: "Identify known values", equation: "u = 4.0 m s^-1, v = 10 m s^-1, t = 3.0 s", note: "Acceleration depends on change in velocity." },
      { title: "Use the formula", equation: "a = (v - u) / t", note: "Subtract the initial velocity from the final velocity." },
      { title: "Substitute values", equation: "a = (10 - 4.0) / 3.0 = 2.0 m s^-2", note: "The acceleration is 2.0 m s^-2." },
    ],
    commonMistake: "A common mistake is dividing final velocity by time instead of change in velocity by time.",
  },
  {
    id: "motion-f-004",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Foundations",
    difficulty: "Core",
    marks: 2,
    timeEstimate: "~2 min",
    question: "A runner accelerates at 1.5 m s^-2 for 8.0 s from rest. Calculate the final velocity.",
    answer: "12",
    answerUnit: "m s^-1",
    solution: [
      { title: "Identify known values", equation: "u = 0 m s^-1, a = 1.5 m s^-2, t = 8.0 s", note: "From rest means u = 0 m s^-1." },
      { title: "Rearrange the formula", equation: "v = u + at", note: "This comes from a = (v - u) / t." },
      { title: "Substitute values", equation: "v = 0 + (1.5 x 8.0) = 12 m s^-1", note: "The final velocity is 12 m s^-1." },
    ],
    commonMistake: "Students sometimes forget to include the initial velocity when it is not zero.",
  },
  {
    id: "motion-f-005",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Foundations",
    difficulty: "Core",
    marks: 2,
    timeEstimate: "~2 min",
    question: "A velocity-time graph has a horizontal line at 6.0 m s^-1 for 4.0 s. Calculate the displacement.",
    answer: "24",
    answerUnit: "m",
    solution: [
      { title: "Identify the graph shape", equation: "Rectangle under the graph", note: "Displacement is the area under a velocity-time graph." },
      { title: "Use area of a rectangle", equation: "area = base x height", note: "The base is time and the height is velocity." },
      { title: "Substitute values", equation: "s = 4.0 x 6.0 = 24 m", note: "The displacement is 24 m." },
    ],
    commonMistake: "Students often describe the line correctly but forget that area gives displacement.",
  },
  {
    id: "motion-a-001",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Applications",
    difficulty: "Standard",
    marks: 3,
    timeEstimate: "~3 min",
    question: "A train accelerates from 5.0 m s^-1 to 25 m s^-1 in 10 s. Calculate the distance travelled during this time.",
    answer: "150",
    answerUnit: "m",
    solution: [
      { title: "Find average velocity", equation: "average velocity = (u + v) / 2", note: "For uniform acceleration, average velocity is the mean of initial and final velocity." },
      { title: "Substitute velocities", equation: "average velocity = (5.0 + 25) / 2 = 15 m s^-1", note: "The train's average velocity is 15 m s^-1." },
      { title: "Find distance", equation: "s = vt = 15 x 10 = 150 m", note: "The distance travelled is 150 m." },
    ],
    commonMistake: "Students often use the final velocity for the whole journey instead of the average velocity.",
  },
  {
    id: "motion-a-002",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Applications",
    difficulty: "Standard",
    marks: 3,
    timeEstimate: "~3 min",
    question: "A vehicle starts from rest and accelerates at 2.5 m s^-2 for 6.0 s. Calculate the distance travelled.",
    answer: "45",
    answerUnit: "m",
    solution: [
      { title: "Identify known values", equation: "u = 0 m s^-1, a = 2.5 m s^-2, t = 6.0 s", note: "The vehicle begins from rest." },
      { title: "Use the displacement equation", equation: "s = ut + 1/2at^2", note: "This equation works when acceleration is constant." },
      { title: "Substitute values", equation: "s = 0 + 1/2 x 2.5 x 6.0^2 = 45 m", note: "The distance travelled is 45 m." },
    ],
    commonMistake: "A common mistake is forgetting to square the time.",
  },
  {
    id: "motion-a-003",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Applications",
    difficulty: "Standard",
    marks: 3,
    timeEstimate: "~3 min",
    question: "A ball is thrown upwards at 18 m s^-1. Taking acceleration as -9.8 m s^-2, calculate the time to reach maximum height.",
    answer: "1.8",
    answerUnit: "s",
    solution: [
      { title: "Identify known values", equation: "u = 18 m s^-1, v = 0 m s^-1, a = -9.8 m s^-2", note: "At maximum height, vertical velocity is zero." },
      { title: "Use the acceleration relationship", equation: "v = u + at", note: "Rearrange to find time." },
      { title: "Substitute values", equation: "0 = 18 - 9.8t, so t = 18 / 9.8 = 1.8 s", note: "The time is approximately 1.8 s." },
    ],
    commonMistake: "Students sometimes forget that the final velocity at maximum height is zero.",
  },
  {
    id: "motion-a-004",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Applications",
    difficulty: "Standard",
    marks: 3,
    timeEstimate: "~3 min",
    question: "A car brakes uniformly from 20 m s^-1 to rest in 4.0 s. Calculate the braking distance.",
    answer: "40",
    answerUnit: "m",
    solution: [
      { title: "Find average velocity", equation: "average velocity = (20 + 0) / 2 = 10 m s^-1", note: "Uniform braking means average velocity can be found from u and v." },
      { title: "Use distance formula", equation: "s = average velocity x time", note: "Distance is area under the velocity-time graph." },
      { title: "Substitute values", equation: "s = 10 x 4.0 = 40 m", note: "The braking distance is 40 m." },
    ],
    commonMistake: "Students sometimes use the initial velocity for the full 4.0 s.",
  },
  {
    id: "motion-a-005",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Applications",
    difficulty: "Standard",
    marks: 3,
    timeEstimate: "~3 min",
    question: "A cyclist travels 60 m while accelerating uniformly from 2.0 m s^-1 to 10 m s^-1. Calculate the time taken.",
    answer: "10",
    answerUnit: "s",
    solution: [
      { title: "Find average velocity", equation: "average velocity = (2.0 + 10) / 2 = 6.0 m s^-1", note: "Use the mean velocity for uniform acceleration." },
      { title: "Use distance relationship", equation: "s = vt", note: "Here v is the average velocity." },
      { title: "Rearrange and substitute", equation: "t = s / v = 60 / 6.0 = 10 s", note: "The time taken is 10 s." },
    ],
    commonMistake: "Students often use final velocity instead of average velocity.",
  },
  {
    id: "motion-ppq-001",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Past Paper Questions",
    difficulty: "Challenge",
    marks: 4,
    timeEstimate: "~5 min",
    question: "A rocket accelerates vertically from rest at 12 m s^-2 for 8.0 s. Calculate its height after 8.0 s.",
    answer: "384",
    answerUnit: "m",
    solution: [
      { title: "Identify known values", equation: "u = 0 m s^-1, a = 12 m s^-2, t = 8.0 s", note: "The rocket starts from rest." },
      { title: "Use displacement equation", equation: "s = ut + 1/2at^2", note: "Acceleration is constant over the 8.0 s." },
      { title: "Substitute values", equation: "s = 0 + 1/2 x 12 x 8.0^2 = 384 m", note: "The height is 384 m." },
    ],
    commonMistake: "Students often forget the half in the displacement equation.",
  },
  {
    id: "motion-ppq-002",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Past Paper Questions",
    difficulty: "Challenge",
    marks: 4,
    timeEstimate: "~5 min",
    question: "A train slows uniformly from 30 m s^-1 to 12 m s^-1 over a distance of 189 m. Calculate its acceleration.",
    answer: "-2.0",
    answerUnit: "m s^-2",
    solution: [
      { title: "Identify known values", equation: "u = 30 m s^-1, v = 12 m s^-1, s = 189 m", note: "The train is slowing down, so acceleration should be negative." },
      { title: "Use the equation without time", equation: "v^2 = u^2 + 2as", note: "This equation is useful because time is not given." },
      { title: "Rearrange and substitute", equation: "a = (v^2 - u^2) / 2s = (144 - 900) / 378 = -2.0 m s^-2", note: "The acceleration is -2.0 m s^-2." },
    ],
    commonMistake: "Students sometimes drop the negative sign even though the object is decelerating.",
  },
  {
    id: "motion-ppq-003",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Past Paper Questions",
    difficulty: "Challenge",
    marks: 4,
    timeEstimate: "~5 min",
    question: "A stone is dropped from rest and falls for 3.0 s. Taking acceleration as 9.8 m s^-2, calculate the distance fallen.",
    answer: "44.1",
    answerUnit: "m",
    solution: [
      { title: "Identify known values", equation: "u = 0 m s^-1, a = 9.8 m s^-2, t = 3.0 s", note: "Dropped means the initial velocity is zero." },
      { title: "Use displacement equation", equation: "s = ut + 1/2at^2", note: "The acceleration is due to gravity." },
      { title: "Substitute values", equation: "s = 0 + 1/2 x 9.8 x 3.0^2 = 44.1 m", note: "The stone falls 44.1 m." },
    ],
    commonMistake: "Students often calculate 9.8 x 3.0 instead of using 1/2at^2.",
  },
  {
    id: "motion-ppq-004",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Past Paper Questions",
    difficulty: "Challenge",
    marks: 4,
    timeEstimate: "~5 min",
    question: "A car accelerates uniformly from 8.0 m s^-1 to 22 m s^-1 over 70 m. Calculate the acceleration.",
    answer: "3.0",
    answerUnit: "m s^-2",
    solution: [
      { title: "Identify known values", equation: "u = 8.0 m s^-1, v = 22 m s^-1, s = 70 m", note: "Time is not given, so choose an equation without time." },
      { title: "Use the equation", equation: "v^2 = u^2 + 2as", note: "Rearrange for acceleration." },
      { title: "Substitute values", equation: "a = (22^2 - 8.0^2) / (2 x 70) = 3.0 m s^-2", note: "The acceleration is 3.0 m s^-2." },
    ],
    commonMistake: "Students sometimes forget to square both velocities.",
  },
  {
    id: "motion-ppq-005",
    subject: "Higher Physics",
    courseArea: "Our dynamic Universe",
    specArea: "Motion - equations and graphs",
    stage: "Past Paper Questions",
    difficulty: "Challenge",
    marks: 4,
    timeEstimate: "~5 min",
    question: "A velocity-time graph shows velocity increasing uniformly from 0 to 16 m s^-1 in 5.0 s, then remaining constant for 4.0 s. Calculate the total displacement.",
    answer: "104",
    answerUnit: "m",
    solution: [
      { title: "Split the graph", equation: "Triangle + rectangle", note: "Displacement is the total area under the velocity-time graph." },
      { title: "Find both areas", equation: "triangle = 1/2 x 5.0 x 16 = 40 m, rectangle = 4.0 x 16 = 64 m", note: "Add the separate areas." },
      { title: "Add areas", equation: "total displacement = 40 + 64 = 104 m", note: "The total displacement is 104 m." },
    ],
    commonMistake: "Students often calculate only the triangle and miss the constant-velocity section.",
  },
];

export function getQuestionById(id: string) {
  return questions.find((question) => question.id === id);
}

export function getQuestionsByStage(stage: QuestionStage) {
  return questions.filter((question) => question.stage === stage);
}

export function getFirstQuestionForStage(stage: QuestionStage) {
  return getQuestionsByStage(stage)[0];
}

export function getQuestionPosition(id: string) {
  const index = questions.findIndex((question) => question.id === id);
  return {
    index,
    current: index >= 0 ? index + 1 : 0,
    total: questions.length,
    previous: index > 0 ? questions[index - 1] : undefined,
    next: index >= 0 && index < questions.length - 1 ? questions[index + 1] : undefined,
  };
}



