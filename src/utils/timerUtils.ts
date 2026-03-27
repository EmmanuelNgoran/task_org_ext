/**
 * Calculate total elapsed seconds for a running task.
 * Adds the seconds accumulated since the timer was last started to the
 * already-stored elapsed seconds.
 */
export function calcElapsedSeconds(elapsedSeconds: number, startedAt: number, now: number): number {
  return elapsedSeconds + Math.floor((now - startedAt) / 1000);
}
