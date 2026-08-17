/**
 * Compact wall-clock durations for progress displays: '12s', '3m 07s', '1h 04m'.
 * Returns an empty string for unknown durations (the server reports -1 for those).
 */
export function formatDuration(seconds: number): string {
  if (seconds === undefined || seconds === null || !isFinite(seconds) || seconds < 0) { return ''; }
  const total = Math.floor(seconds);
  if (total < 60) { return total + 's'; }
  const pad = (v: number) => (v < 10 ? '0' + v : '' + v);
  if (total < 3600) {
    return Math.floor(total / 60) + 'm ' + pad(total % 60) + 's';
  }
  return Math.floor(total / 3600) + 'h ' + pad(Math.floor((total % 3600) / 60)) + 'm';
}
