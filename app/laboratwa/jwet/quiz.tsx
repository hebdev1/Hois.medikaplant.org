'use client';

import * as React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Qty } from '../lab-ui';

export type Question = { q: string; options: string[]; answer: number; explain: string };

export default function Quiz({ questions }: { questions: Question[] }) {
  const [idx, setIdx] = React.useState(0);
  const [picked, setPicked] = React.useState<number | null>(null);
  const [score, setScore] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const q = questions[idx];
  const answered = picked !== null;

  function choose(i: number) {
    if (answered) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  }
  function next() {
    if (idx + 1 >= questions.length) setDone(true);
    else { setIdx((n) => n + 1); setPicked(null); }
  }
  function restart() {
    setIdx(0); setPicked(null); setScore(0); setDone(false);
  }

  if (done) {
    return (
      <div className="lab-feed" style={{ textAlign: 'center' }}>
        <div className="lab-label" style={{ marginBottom: 6 }}>Fini</div>
        <div style={{ fontFamily: 'var(--ff-disp)', fontSize: 22, fontWeight: 600 }}>
          Ou jwenn <Qty>{score}</Qty> sou <Qty>{questions.length}</Qty>
        </div>
        <button className="lab-btn out" onClick={restart} style={{ marginTop: 14 }}>
          <RotateCcw size={16} strokeWidth={2} aria-hidden /> Rekòmanse
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="lab-label" aria-live="polite">
        Kesyon <Qty>{idx + 1}</Qty> sou <Qty>{questions.length}</Qty>
      </div>
      <div className="lab-gamebar"><i style={{ width: `${(idx / questions.length) * 100}%` }} /></div>

      <div className="lab-q">{q.q}</div>
      <div className="lab-answers">
        {q.options.map((opt, i) => {
          let cls = 'lab-ans';
          if (answered) {
            if (i === q.answer) cls += ' good';
            else if (i === picked) cls += ' bad';
          } else if (i === picked) cls += ' pick';
          return (
            <button key={i} type="button" className={cls} onClick={() => choose(i)} disabled={answered}>
              {answered && i === q.answer && <Check size={16} strokeWidth={2.6} aria-hidden />}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="lab-feed">
          <b>{picked === q.answer ? 'Byen fè' : 'Prèske'}</b>
          <p style={{ margin: '4px 0 12px', fontSize: 13.5 }}>{q.explain}</p>
          <button className="lab-btn pri" onClick={next}>
            {idx + 1 >= questions.length ? 'Wè rezilta' : 'Kontinye'}
          </button>
        </div>
      )}
    </div>
  );
}
