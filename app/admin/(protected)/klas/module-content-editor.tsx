'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type {
  ModuleContent,
  Lesson,
  Block,
  QuizQuestion,
} from '@/lib/klas/course-content';

const inputCls =
  'w-full px-2.5 py-1.5 text-sm bg-white border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-200';
const labelCls =
  'text-[11px] font-bold uppercase tracking-wider text-earth-600';

// A form-based builder for one module's interactive content. It keeps the
// whole ModuleContent object in state and mirrors it into a hidden `content`
// field (JSON) that the saveModule server action persists — no HTML, no JSON
// typed by hand.
export default function ModuleContentEditor({
  initial,
}: {
  initial: ModuleContent | null;
}) {
  const [objective, setObjective] = React.useState(initial?.objective ?? '');
  const [lessons, setLessons] = React.useState<Lesson[]>(
    initial?.lessons ?? []
  );
  const [activityTitle, setActivityTitle] = React.useState(
    initial?.activity?.title ?? ''
  );
  const [activityText, setActivityText] = React.useState(
    initial?.activity?.text ?? ''
  );
  const [quiz, setQuiz] = React.useState<QuizQuestion[]>(initial?.quiz ?? []);

  const content: ModuleContent = {
    objective: objective || undefined,
    lessons,
    activity: activityText ? { title: activityTitle || undefined, text: activityText } : null,
    quiz,
  };

  // ── lesson helpers ──
  const addLesson = () =>
    setLessons((l) => [...l, { title: '', time: '', blocks: [] }]);
  const rmLesson = (i: number) =>
    setLessons((l) => l.filter((_, x) => x !== i));
  const setLesson = (i: number, patch: Partial<Lesson>) =>
    setLessons((l) => l.map((les, x) => (x === i ? { ...les, ...patch } : les)));
  const addBlock = (i: number, type: Block['type']) =>
    setLesson(i, { blocks: [...lessons[i].blocks, blankBlock(type)] });
  const setBlock = (i: number, bi: number, block: Block) =>
    setLesson(i, {
      blocks: lessons[i].blocks.map((b, x) => (x === bi ? block : b)),
    });
  const rmBlock = (i: number, bi: number) =>
    setLesson(i, { blocks: lessons[i].blocks.filter((_, x) => x !== bi) });

  // ── quiz helpers ──
  const addQ = () =>
    setQuiz((q) => [
      ...q,
      { type: 'single', q: '', choices: ['', ''], correct: 0, feedback: '' },
    ]);
  const setQ = (i: number, patch: Partial<QuizQuestion>) =>
    setQuiz((q) => q.map((qq, x) => (x === i ? { ...qq, ...patch } : qq)));
  const rmQ = (i: number) => setQuiz((q) => q.filter((_, x) => x !== i));

  return (
    <div className="space-y-4">
      <input type="hidden" name="content" value={JSON.stringify(content)} />

      <div>
        <label className={labelCls}>Objektif modil la</label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          rows={2}
          className={inputCls}
          placeholder="Sa elèv la ap kapab fè apre modil sa a…"
        />
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={labelCls}>Leson yo</span>
          <AddBtn onClick={addLesson}>Ajoute leson</AddBtn>
        </div>
        {lessons.map((les, i) => (
          <div key={i} className="rounded-xl border border-cream-200 p-3 space-y-2 bg-cream-50">
            <div className="flex gap-2">
              <input
                value={les.title}
                onChange={(e) => setLesson(i, { title: e.target.value })}
                className={inputCls}
                placeholder="Tit leson an"
              />
              <input
                value={les.time ?? ''}
                onChange={(e) => setLesson(i, { time: e.target.value })}
                className={inputCls + ' max-w-[110px]'}
                placeholder="12 min"
              />
              <RmBtn onClick={() => rmLesson(i)} />
            </div>
            {/* Blocks */}
            {les.blocks.map((b, bi) => (
              <BlockEditor
                key={bi}
                block={b}
                onChange={(nb) => setBlock(i, bi, nb)}
                onRemove={() => rmBlock(i, bi)}
              />
            ))}
            <div className="flex flex-wrap gap-1.5">
              {(['p', 'list', 'keybox', 'mythbox'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addBlock(i, t)}
                  className="text-[11px] px-2 py-1 rounded-md bg-white border border-cream-200 hover:border-forest-300 text-earth-700"
                >
                  + {BLOCK_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Activity */}
      <div className="rounded-xl border border-cream-200 p-3 space-y-2">
        <span className={labelCls}>Aktivite (opsyonèl)</span>
        <input
          value={activityTitle}
          onChange={(e) => setActivityTitle(e.target.value)}
          className={inputCls}
          placeholder="Tit (egz. Egzèsis refleksyon)"
        />
        <textarea
          value={activityText}
          onChange={(e) => setActivityText(e.target.value)}
          rows={2}
          className={inputCls}
          placeholder="Konsiy egzèsis la…"
        />
      </div>

      {/* Quiz */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className={labelCls}>Quiz</span>
          <AddBtn onClick={addQ}>Ajoute kesyon</AddBtn>
        </div>
        {quiz.map((q, i) => {
          const qtype = q.type ?? 'single';
          const isChoice = qtype === 'single' || qtype === 'multiple';
          return (
            <div
              key={i}
              className="rounded-xl border border-cream-200 p-3 space-y-2 bg-cream-50"
            >
              <div className="flex gap-2">
                <select
                  value={qtype}
                  onChange={(e) =>
                    setQ(i, { type: e.target.value as QuizQuestion['type'] })
                  }
                  className={inputCls + ' max-w-[150px]'}
                >
                  <option value="single">Chwa inik</option>
                  <option value="multiple">Chwa miltip</option>
                  <option value="short">Repons kout</option>
                </select>
                <input
                  value={q.q}
                  onChange={(e) => setQ(i, { q: e.target.value })}
                  className={inputCls}
                  placeholder="Kesyon an"
                />
                <RmBtn onClick={() => rmQ(i)} />
              </div>

              {isChoice && (
                <>
                  <label className="text-[11px] text-earth-600">
                    Chwa (yon pa liy)
                  </label>
                  <textarea
                    value={(q.choices ?? []).join('\n')}
                    onChange={(e) =>
                      setQ(i, { choices: e.target.value.split('\n') })
                    }
                    rows={3}
                    className={inputCls}
                    placeholder={'Repons 1\nRepons 2\nRepons 3'}
                  />
                </>
              )}
              {qtype === 'single' && (
                <div className="flex gap-2 items-center">
                  <label className="text-[11px] text-earth-600">Bon repons #</label>
                  <input
                    type="number"
                    min={1}
                    max={(q.choices ?? []).length}
                    value={(q.correct ?? 0) + 1}
                    onChange={(e) =>
                      setQ(i, {
                        correct: Math.max(0, Number(e.target.value) - 1),
                      })
                    }
                    className={inputCls + ' max-w-[70px]'}
                  />
                </div>
              )}
              {qtype === 'multiple' && (
                <div>
                  <label className="text-[11px] text-earth-600">
                    Bon repons # yo (separe ak vigil, egz. 1,3)
                  </label>
                  <input
                    value={(q.correctSet ?? []).map((n) => n + 1).join(',')}
                    onChange={(e) =>
                      setQ(i, {
                        correctSet: e.target.value
                          .split(',')
                          .map((s) => Number(s.trim()) - 1)
                          .filter((n) => Number.isInteger(n) && n >= 0),
                      })
                    }
                    className={inputCls}
                    placeholder="1,3"
                  />
                </div>
              )}
              {qtype === 'short' && (
                <div>
                  <label className="text-[11px] text-earth-600">
                    Bon repons (separe ak « | » si plizyè aksepte)
                  </label>
                  <input
                    value={q.answer ?? ''}
                    onChange={(e) => setQ(i, { answer: e.target.value })}
                    className={inputCls}
                    placeholder="egz. glisid | idrat kabòn"
                  />
                </div>
              )}

              <input
                value={q.feedback ?? ''}
                onChange={(e) => setQ(i, { feedback: e.target.value })}
                className={inputCls}
                placeholder="Fidbak (poukisa)"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const BLOCK_LABEL: Record<Block['type'], string> = {
  p: 'Paragraf',
  list: 'Lis',
  keybox: 'Lide kle',
  mythbox: 'Kraze manti',
};

function blankBlock(type: Block['type']): Block {
  switch (type) {
    case 'p':
      return { type: 'p', text: '' };
    case 'list':
      return { type: 'list', items: [''] };
    case 'keybox':
      return { type: 'keybox', title: '', text: '' };
    case 'mythbox':
      return { type: 'mythbox', myth: '', truth: '' };
  }
}

function BlockEditor({
  block,
  onChange,
  onRemove,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg bg-white border border-cream-200 p-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700">
          {BLOCK_LABEL[block.type]}
        </span>
        <RmBtn onClick={onRemove} />
      </div>
      {block.type === 'p' && (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ type: 'p', text: e.target.value })}
          rows={2}
          className={inputCls}
          placeholder="Tèks paragraf la…"
        />
      )}
      {block.type === 'list' && (
        <textarea
          value={block.items.join('\n')}
          onChange={(e) =>
            onChange({ type: 'list', items: e.target.value.split('\n') })
          }
          rows={3}
          className={inputCls}
          placeholder={'Eleman 1\nEleman 2'}
        />
      )}
      {block.type === 'keybox' && (
        <>
          <input
            value={block.title ?? ''}
            onChange={(e) =>
              onChange({ ...block, type: 'keybox', title: e.target.value })
            }
            className={inputCls}
            placeholder="Tit (egz. Lide kle)"
          />
          <textarea
            value={block.text}
            onChange={(e) =>
              onChange({ ...block, type: 'keybox', text: e.target.value })
            }
            rows={2}
            className={inputCls}
            placeholder="Lide kle a…"
          />
        </>
      )}
      {block.type === 'mythbox' && (
        <>
          <input
            value={block.myth}
            onChange={(e) =>
              onChange({ ...block, type: 'mythbox', myth: e.target.value })
            }
            className={inputCls}
            placeholder="Manti a…"
          />
          <input
            value={block.truth}
            onChange={(e) =>
              onChange({ ...block, type: 'mythbox', truth: e.target.value })
            }
            className={inputCls}
            placeholder="Verite a…"
          />
        </>
      )}
    </div>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-forest-700 text-cream-50 hover:bg-forest-800"
    >
      <Plus className="w-3 h-3" strokeWidth={2.4} />
      {children}
    </button>
  );
}

function RmBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 grid place-items-center w-7 h-7 rounded-md text-rose-600 hover:bg-rose-50"
      aria-label="Retire"
    >
      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.2} />
    </button>
  );
}
