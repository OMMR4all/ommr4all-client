/**
 * Levenshtein edit distance between two strings.
 *
 * Replaces the `leven` package, which ships CommonJS only and caused an Angular
 * optimization-bailout warning on every build.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) { return 0; }
  if (a.length === 0) { return b.length; }
  if (b.length === 0) { return a.length; }

  // Only the previous row is needed, so keep one row instead of the full matrix.
  let previous = new Array<number>(b.length + 1);
  let current = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j++) { previous[j] = j; }

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1] + (ca === b.charCodeAt(j - 1) ? 0 : 1);
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
    }
    const swap = previous;
    previous = current;
    current = swap;
  }

  return previous[b.length];
}
