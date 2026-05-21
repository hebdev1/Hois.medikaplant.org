// Plain helpers shared between the server page and the client RangeChips
// component. KEEP THIS FILE FREE OF 'use client' — if it carried the
// directive, Next.js would mark every export as a client reference, and
// calling rangeFromSearch() from a server component would throw
// "TypeError: c is not a function" at runtime.

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export const DEFAULT_RANGE: Range = 30;

export function rangeFromSearch(value: string | undefined): Range {
  const n = Number(value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : DEFAULT_RANGE;
}
