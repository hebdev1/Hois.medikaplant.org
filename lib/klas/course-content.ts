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
  type?: 'single' | 'multiple' | 'short'; // default 'single'
  q: string;
  choices?: string[]; // single/multiple: the options
  correct?: number; // single: index of the correct option
  correctSet?: number[]; // multiple: indexes of all correct options
  answer?: string; // short: accepted answer(s), separated by "|"
  feedback?: string;
};

// Remove every answer key before content is sent to the browser, so a student
// cannot read the answers from the page source. Grading runs server-side
// (gradeAnswer) against the full content, which stays on the server.
export function stripQuizAnswers(
  content: ModuleContent | null
): ModuleContent | null {
  if (!content?.quiz) return content;
  return {
    ...content,
    quiz: content.quiz.map((q) => ({
      type: q.type,
      q: q.q,
      choices: q.choices,
    })),
  };
}

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
  preview?: boolean;
};
