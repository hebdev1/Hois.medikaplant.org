/**
 * Resolve `p`, or `fallback` after `ms` — whichever comes first. A rejected `p`
 * also yields `fallback`.
 *
 * WHY not just an AbortSignal: Next's patched fetch does not reliably honor the
 * signal during static generation. On 2026-10-04 an IO-starved database made a
 * 3s-"timeout" homepage fetch run past Next's 60s limit at build time. A timer
 * race bounds the await unconditionally, so a stalled database can never hang a
 * render or the build. Keep passing an AbortSignal too, so the socket is still
 * released whenever the abort does work.
 */
export function withTimeout<T>(p: PromiseLike<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([Promise.resolve(p).catch(() => fallback), timeout]).finally(() =>
    clearTimeout(timer)
  );
}
