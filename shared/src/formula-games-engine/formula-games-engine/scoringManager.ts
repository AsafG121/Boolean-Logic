import { ROUND_DURATION_SECONDS } from './types.js';

/**
 * Calculates the score for a single round.
 *
 * Rules:
 *   - Correct answer  →  the score is the remaining seconds in the timer
 *   - Wrong answer    →  0
 *   - If the timer runs out  →  0 (time expired)
 *
 * @param isCorrect     Whether the player's answer was correct.
 * @param elapsedSeconds  Seconds elapsed from round start to answer submission.
 */
export function calculateScore(isCorrect: boolean, elapsedSeconds: number): number {
  if (!isCorrect) return 0;
  const remaining = ROUND_DURATION_SECONDS - elapsedSeconds;
  return Math.max(0, Math.floor(remaining));
}
