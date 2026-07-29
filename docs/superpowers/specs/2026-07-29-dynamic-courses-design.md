# Dynamic Interactive Courses — Design

## Goal

Let the founder author interactive, self-paced courses (modules → lessons →
quizzes, with a saved student progress bar) entirely through admin **forms** —
no hand-written HTML, no Claude round-trip, no per-course iframe bundle. The
"Kou Nitrisyon Kreyòl" design is the reference structure; this system
reproduces its logic natively so any subject can be built the same way.

The deliverable is the **system** (data model + admin authoring + reusable
renderer + progress), not one specific course.

## Non-goals (YAGNI)

- No quiz *scoring/grading* or pass-gates — quizzes are formative (immediate
  correct/incorrect feedback only), exactly like the reference design.
- No certificates, no timed exams, no leaderboards. (Can come later.)
- Video courses keep working unchanged; this is an additive course *kind*.

## Data model

Reuse `courses` and `course_modules`; add structured content + progress.

- **`courses.kind`** `text` default `'video'` — `'video' | 'interactive'`.
  Chooses which renderer the member course page uses.
- **`course_modules.content`** `jsonb` (nullable) — the rich module body for
  interactive courses. Shape:

  ```jsonc
  {
    "objective": "Sa w ap kapab fè apre modil sa a…",   // "objektif" box
    "lessons": [
      {
        "title": "…", "time": "12 min",
        "blocks": [                                       // ordered content
          { "type": "p", "text": "…" },
          { "type": "list", "items": ["…", "…"] },
          { "type": "keybox", "title": "Lide kle", "text": "…" },
          { "type": "mythbox", "myth": "…", "truth": "…" }
        ]
      }
    ],
    "activity": { "title": "Egzèsis refleksyon", "text": "…" },
    "quiz": [
      { "q": "…", "choices": ["…","…","…"], "correct": 1, "feedback": "…" }
    ]
  }
  ```

  JSON (not separate lesson/quiz tables) keeps authoring simple and editing
  cheap, and matches the reference design's "structured data" requirement.

- **`courses.overview`** `jsonb` (nullable) — the overview/"Apèsi" content:
  `{ intro, howItWorks[], objectives[], parts[], disclaimer }`. `parts[]`
  groups modules and carries the accent colour per part (Pati 1 / Pati 2 /
  Bonis).

- **`course_module_progress`** (new table) — one row per (member, module) when
  marked complete:
  - `user_id uuid`, `module_id uuid`, `course_id uuid`, `completed_at timestamptz`
  - PK `(user_id, module_id)`. RLS: a member reads/writes **only their own**
    rows; `course_id` denormalised so the progress bar is one indexed query.

## Admin authoring — integrated into the Klas page (no new pages)

Per the founder's request, all authoring stays inside the existing Klas admin
(`app/admin/(protected)/klas/`), not new top-level pages.

- **Course form** (`course-form.tsx`): add a **Kind** toggle (Videyo /
  Entèraktif) and, for interactive courses, an **Apèsi** editor (intro,
  how-it-works cards, objectives, parts + accent colour, disclaimer).
- **Modules manager** (`modules-manager.tsx`): when the course is interactive,
  each module gains a **content builder** — repeatable forms for:
  - Objective text.
  - Lessons: title, time, and an ordered list of blocks (paragraph / bullet
    list / keybox / mythbox) added via a small "add block" control.
  - Activity: title + text.
  - Quiz: repeatable questions (prompt, 2–5 choices, mark the correct one,
    feedback text).
- Saved through the existing course/module server actions (extended to accept
  `content` / `overview` / `kind`). Everything in Kreyòl.

## Renderer — `components/klas/interactive-course.tsx` (client)

A single reusable client component driven by the course + modules + progress:

- **Hero**: brand logo, platform name, title, lede, chips (total time, module
  count, level).
- **Sticky progress bar**: `completed / total` modules → % fill, updates live.
- **Module tabs** (+ an "Apèsi" tab first): each tab numbered, shows a check
  when its module is complete.
- **Apèsi tab**: how-it-works cards, objectives, parts list, disclaimer.
- **Per module**: plate (number/title/time), objective box, lessons
  (paragraphs, lists, keybox, mythbox), activity, and **quiz** — clicking a
  choice locks the question and shows green/red + feedback (`answers` state).
- **Modnav**: previous / **"Make fini"** / next. "Make fini" writes a
  `course_module_progress` row (server action) and advances the bar.
- **Footer**: brand + links.
- State mirrors the reference design: `activeTab`, `completed`, `answers`.
  Styling uses the brand tokens (serif display font for headings, sans for
  body, left-accent cards, soft radius/shadow, per-part accent colours) — **no
  new colours invented**.

## Where it renders

- **Member player** `app/dashboard/kou/[slug]`: interactive courses render
  `<InteractiveCourse>` here for enrolled/logged-in members, so progress saves.
- **Public** `app/klas/[slug]`: stays the marketing/enrol page. The full
  interactive experience requires login (progress needs a member).
- The Nutrition course migrates from the `page_html` iframe to this native
  system as the first real example. Interactive courses do not use `page_html`;
  the existing `page_html` iframe stays available only for one-off, fully-custom
  pages that are not module/quiz based.

## Data flow

1. Admin authors course (`kind='interactive'`, `overview`) + modules
   (`content`) via Klas forms → server actions upsert `courses` /
   `course_modules`.
2. Member opens `/dashboard/kou/[slug]` → server loads course, modules, and the
   member's `course_module_progress` in one parallel batch → passes to
   `<InteractiveCourse>`.
3. Member clicks **Make fini** → server action upserts progress → bar updates.
4. Quiz answers are client-only (formative); not persisted.

## Testing / acceptance

- Author a 2-module interactive course with a quiz entirely through the admin
  forms; it renders with working tabs, quiz feedback, and progress bar.
- Marking a module complete persists across reload (progress row written).
- A second member sees their own progress, never another member's (RLS).
- Video courses are unaffected (`kind='video'` path unchanged).
