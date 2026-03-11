import type { EvaluationRound, EvaluationResult } from './types.js';
import { calculateScore } from './scoringManager.js';

/**
 * Formula Evaluation Mode — validates a player's answer for one evaluation round
 * and returns the result with the computed score.
 *
 * @param round          The current round containing the formula, assignment, and correct answer.
 * @param playerAnswer   The boolean value the player selected (0 = false, 1 = true).
 * @param elapsedSeconds Seconds elapsed from round start to the moment the player submitted.
 */
export function submitEvaluationAnswer(
  round: EvaluationRound,
  playerAnswer: boolean,
  elapsedSeconds: number,
): EvaluationResult {
  const isCorrect = playerAnswer === round.correctAnswer;
  const score  = calculateScore(isCorrect, elapsedSeconds);
  return { userAnswer: playerAnswer, correctAnswer: round.correctAnswer, score };
}
