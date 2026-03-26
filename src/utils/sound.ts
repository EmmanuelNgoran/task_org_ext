/**
 * Play a short completion sound using the Web Audio API.
 */
export function playCompletionSound(): void {
  try {
    const ctx = new AudioContext();

    const playTone = (
      frequency: number,
      startTime: number,
      duration: number,
      gainValue: number,
    ) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(gainValue, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(523.25, now, 0.25, 0.4);         // C5
    playTone(659.25, now + 0.15, 0.25, 0.4);  // E5
    playTone(783.99, now + 0.3, 0.4, 0.5);    // G5

    // Close context after sound ends
    setTimeout(() => ctx.close(), 1200);
  } catch {
    // Audio API not available — silently ignore
  }
}
