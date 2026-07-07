export type AvailabilityStatus = "available" | "coming-soon" | "locked";
export type ProgressStatus = "not_started" | "in_progress" | "completed" | "mastered" | "locked";

export type LearningStageName = "Foundations" | "Applications" | "Past Paper-style Questions";
export type ContentVariant = "default" | "tip" | "warning" | "exam";

export type ContentBase = {
  id: string;
  title: string;
  status?: AvailabilityStatus;
  progressStatus?: ProgressStatus;
  displayOrder?: number;
};

export type NoteBlock = ContentBase & {
  body: string;
  mathContent?: string;
  variant?: ContentVariant;
};

export type FormulaCard = ContentBase & {
  formula: string;
  description: string;
  example?: string;
};

export type WorkedExample = ContentBase & {
  prompt: string;
  steps: string[];
  finalAnswer: string;
  explanation: string;
  commonMistake?: string;
  solution?: string;
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  hint?: string;
  title?: string;
  status?: AvailabilityStatus;
  progressStatus?: ProgressStatus;
  displayOrder?: number;
};

export type PracticeSet = ContentBase & {
  description: string;
  stage: LearningStageName;
  questionCount: number;
  estimatedMinutes: number;
  href: string;
};

export type LearningStage = {
  id: string;
  title: string;
  label: LearningStageName;
  name: LearningStageName;
  description: string;
  questionIds: string[];
  questions: number;
  completed: number;
  button: string;
  accent: "green" | "blue" | "orange";
  status: AvailabilityStatus;
  estimatedMinutes: number;
  progressStatus?: ProgressStatus;
  href?: string;
};

export type RecommendedAction = {
  title: string;
  copy: string;
  href: string;
  label: string;
};

export type SidebarLink = {
  label: string;
  href: string;
};

// Learning content should be added through data using this hierarchy: Subject -> Course Area -> Topic/Spec Area -> Skill Path -> Stage -> Question.
export type SkillPath = {
  slug: string;
  name: string;
  description: string;
  href: string;
  status: AvailabilityStatus;
  isAvailable: boolean;
  progress: number;
  completed: number;
  questions: number;
  progressStatus?: ProgressStatus;
  masteryStatus?: string;
  currentPathLabel?: string;
  recommendedAction?: RecommendedAction;
  sidebarLinks?: SidebarLink[];
  notes?: NoteBlock[];
  formulaCards?: FormulaCard[];
  workedExamples?: WorkedExample[];
  flashcards?: Flashcard[];
  practiceSets?: PracticeSet[];
  learningStages?: LearningStage[];
};

export type Topic = {
  slug: string;
  name: string;
  description: string;
  href: string;
  progress: number;
  completed: number;
  questions: number;
  status?: AvailabilityStatus;
  isAvailable?: boolean;
  progressStatus?: ProgressStatus;
  skillPaths?: SkillPath[];
};

export type SpecArea = Topic;

export type CourseArea = {
  slug: string;
  name: string;
  description: string;
  href: string;
  available: boolean;
  progress: number;
  questionsCompleted: number;
  progressStatus?: ProgressStatus;
  specAreas: SpecArea[];
  topics?: Topic[];
};

export type Subject = {
  subjectSlug: string;
  subjectName: string;
  subject: string;
  level: string;
  status: AvailabilityStatus;
  isAvailable: boolean;
  description: string;
  longDescription: string;
  href: string;
  topicCount: number;
  progress: number;
  questionsCompleted: number;
  progressStatus?: ProgressStatus;
  courseAreas: CourseArea[];
  learningStages: LearningStage[];
};

export type AnswerType = "multiple_choice" | "numerical" | "algebraic" | "written" | "multi_step";

export type QuestionOption = {
  label: string;
  value: string;
};

export type Question = {
  id: string;
  subject: string;
  courseArea: string;
  specArea: string;
  skillPath?: string;
  skillPathId?: string;
  stageId?: string;
  stage: LearningStageName;
  skill: string;
  title: string;
  questionText: string;
  marks: number;
  answerType: AnswerType;
  correctAnswer: string;
  acceptedAnswers: string[];
  options?: QuestionOption[];
  unit?: string;
  workedSolution: string;
  finalAnswer: string;
  hint: string;
  commonMistake: string;
  calculatorAllowed: boolean;
  source: string;
  status: "draft" | "ready";
  progressStatus?: ProgressStatus;
  displayOrder: number;
};

export type QuestionProgress = {
  questionId: string;
  status: ProgressStatus;
};

export type ContentResource = NoteBlock | FormulaCard | WorkedExample | Flashcard | PracticeSet;




