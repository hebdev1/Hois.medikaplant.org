'use client';

// Top-level error boundary for routes outside /dashboard (which has its
// own boundary at app/dashboard/error.tsx). Same escape valve for
// chunk-load errors — a fresh deploy invalidates cached JS URLs the
// browser is trying to fetch, React catches the ChunkLoadError, and
// we hard-reload so the browser picks up the new manifest transparently.
//
// global-error.tsx MUST render its own <html> + <body> because it
// replaces the root layout when the error escapes far enough to hit
// the top level.

import React from 'react';

function isChunkLoadError(err: Error): boolean {
  const name = err?.name ?? '';
  const msg = err?.message ?? '';
  return (
    name === 'ChunkLoadError' ||
    /loading chunk \d+ failed/i.test(msg) ||
    /failed to fetch dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg)
  );
}

function isDomMutationError(err: Error): boolean {
  const msg = err?.message ?? '';
  return (
    /insertBefore.*not a child/i.test(msg) ||
    /removeChild.*not a child/i.test(msg) ||
    /the node before which the new node is to be inserted is not a child/i.test(msg)
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[global error]', error);
    if (isChunkLoadError(error) || isDomMutationError(error)) {
      window.location.reload();
    }
  }, [error]);

  return (
    <html lang="ht">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: '#faf6ed',
          color: '#050040',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            background: 'white',
            border: '1px solid #f1ead7',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 12px 40px -16px rgba(5,0,64,0.18)',
          }}
        >
          <h1
            style={{
              margin: '0 0 8px',
              fontSize: 22,
              fontWeight: 700,
              color: '#050040',
            }}
          >
            Yon erè rive
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: '#5c3d2e' }}>
            Paj la pa ka chaje. Eseye reload — souvan sa rezoud pwoblèm nan
            imedyatman (yon nouvo deplwa ka fè navigatè w bezwen refèchi).
          </p>
          <details
            style={{
              background: '#faf6ed',
              border: '1px solid #f1ead7',
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: 12,
              color: '#5c3d2e',
              marginBottom: 16,
            }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
              Detay teknik
            </summary>
            <pre
              style={{
                marginTop: 8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: 11,
              }}
            >
              {error.message || 'Erè san mesaj'}
              {error.digest ? `\n\nDigest: ${error.digest}` : ''}
            </pre>
          </details>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: '#435b12',
                color: '#fefcf6',
                border: 'none',
                padding: '10px 16px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Eseye ankò
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: 'white',
                color: '#050040',
                border: '1px solid #f1ead7',
                padding: '10px 16px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Reload paj la
            </button>
            <a
              href="/"
              style={{
                background: 'white',
                color: '#050040',
                border: '1px solid #f1ead7',
                padding: '10px 16px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Lakay
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
