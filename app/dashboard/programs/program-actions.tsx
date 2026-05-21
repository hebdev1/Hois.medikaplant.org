'use client';

import React from 'react';
import { Pause, Play, CheckCheck, Loader2, AlertCircle, Download } from 'lucide-react';
import {
  pauseActiveProgram,
  resumeActiveProgram,
  finishActiveProgram,
} from './actions';

type ActionVariant = 'pause' | 'resume' | 'finish';

export default function ProgramActions({
  isPaused,
  resourceUrl,
}: {
  isPaused: boolean;
  resourceUrl?: string | null;
}) {
  const [pending, setPending] = React.useState<ActionVariant | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run(variant: ActionVariant) {
    setError(null);
    setPending(variant);
    const fn =
      variant === 'pause'
        ? pauseActiveProgram
        : variant === 'resume'
          ? resumeActiveProgram
          : finishActiveProgram;
    const res = await fn();
    setPending(null);
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {isPaused ? (
          <button
            type="button"
            onClick={() => run('resume')}
            disabled={pending !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-700 hover:bg-forest-800 disabled:opacity-60 text-cream-50 rounded-lg transition"
          >
            {pending === 'resume' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
            ) : (
              <Play className="w-3.5 h-3.5" strokeWidth={2.2} />
            )}
            Repran plan an
          </button>
        ) : (
          <button
            type="button"
            onClick={() => run('pause')}
            disabled={pending !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-cream-50 border border-cream-200 disabled:opacity-60 text-earth-700 hover:text-ink rounded-lg transition"
          >
            {pending === 'pause' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
            ) : (
              <Pause className="w-3.5 h-3.5" strokeWidth={2.2} />
            )}
            Pose plan an
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                'Èske w sèten ou vle make plan an kòm fini? Sa ap libere yon nouvo pwogram pou kòmanse.'
              )
            ) {
              run('finish');
            }
          }}
          disabled={pending !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-forest-50 hover:bg-forest-100 border border-forest-100 disabled:opacity-60 text-forest-700 rounded-lg transition"
        >
          {pending === 'finish' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.2} />
          ) : (
            <CheckCheck className="w-3.5 h-3.5" strokeWidth={2.2} />
          )}
          Make kòm fini
        </button>
        {resourceUrl && (
          <a
            href={resourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gold-50 hover:bg-gold-100 border border-gold-200 text-gold-700 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2.2} />
            Telechaje gid
          </a>
        )}
      </div>
      {error && (
        <div className="inline-flex items-center gap-1 text-[11px] text-rose-700">
          <AlertCircle className="w-3 h-3" strokeWidth={2.4} />
          {error}
        </div>
      )}
    </div>
  );
}
