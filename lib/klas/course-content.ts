// Structured content for dynamic interactive courses. Stored as JSON in
// course_modules.content and courses.overview, authored via admin forms and
// rendered natively by <InteractiveCourse>.

export type Block =
  | { type: 'p'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'keybox'; title?: string; text: string }
  | { type: 'mythbox'; myth: string; truth: string };

export type Lesson = { title: string; time?: string; blocks: Block[] };

export type QuizQuestion = {
  q: string;
  choices: string[];
  correct: number; // index into choices
  feedback?: string;
};

export type ModuleContent = {
  objective?: string;
  lessons?: Lesson[];
  activity?: { title?: string; text: string } | null;
  quiz?: QuizQuestion[];
};

export type CoursePart = {
  title: string;
  accent?: string; // brand token name, e.g. 'forest' | 'gold' | 'earth'
  moduleIds?: string[];
};

export type CourseOverview = {
  intro?: string;
  howItWorks?: { title: string; text: string }[];
  objectives?: string[];
  parts?: CoursePart[];
  disclaimer?: string;
};

export type InteractiveModule = {
  id: string;
  title: string;
  duration_text: string | null;
  display_order: number;
  content: ModuleContent | null;
};
