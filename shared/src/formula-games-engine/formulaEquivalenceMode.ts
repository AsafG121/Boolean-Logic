import type { EquivalenceRound, EquivalenceResult } from './types.js';
import { calculateScore } from './scoringManager.js';

/**
 * Formula Equivalence Mode — validates a player's answer for one equivalence round
 * and returns the result with the computed score.
 *
 * @param round          The current round containing the two formulas and the ground truth.
 * @param playerAnswer   true  = player claims the formulas ARE equivalent,
 *                       false = player claims they are NOT equivalent.
 * @param elapsedSeconds Seconds elapsed from round start to the moment the player submitted.
 */
export function submitEquivalenceAnswer(
  round: EquivalenceRound,
  playerAnswer: boolean,
  elapsedSeconds: number,
): EquivalenceResult {
  const isCorrect = playerAnswer === round.areEquivalent;
  const score     = calculateScore(isCorrect, elapsedSeconds);
  return { userAnswer: playerAnswer, areEquivalent: round.areEquivalent, score };
}
