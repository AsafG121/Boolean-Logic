import { describe, it, expect } from 'vitest';
import { submitEvaluationAnswer } from '../formulaEvaluationMode';
import { generateEvaluationRound } from '../formulaGenerator';

describe('submitEvaluationAnswer', () => {
  it('correct answer returns userAnswer matching correctAnswer and score = remaining seconds', () => {
    const round = generateEvaluationRound('easy');
    const result = submitEvaluationAnswer(round, round.correctAnswer, 10);
    expect(result.userAnswer).toBe(round.correctAnswer);
    expect(result.score).toBe(110);
    expect(result.correctAnswer).toBe(round.correctAnswer);
  });

  it('wrong answer returns userAnswer differing from correctAnswer and score=0', () => {
    const round = generateEvaluationRound('easy');
    const result = submitEvaluationAnswer(round, !round.correctAnswer, 10);
    expect(result.userAnswer).toBe(!round.correctAnswer);
    expect(result.score).toBe(0);
  });

  it('correct answer at elapsed=0 gives maximum score (120)', () => {
    const round = generateEvaluationRound('easy');
    const result = submitEvaluationAnswer(round, round.correctAnswer, 0);
    expect(result.score).toBe(120);
  });

  it('correct answer at elapsed=120 gives score=0', () => {
    const round = generateEvaluationRound('easy');
    const result = submitEvaluationAnswer(round, round.correctAnswer, 120);
    expect(result.score).toBe(0);
  });

  it('correctAnswer field reflects the round ground truth', () => {
    const round = generateEvaluationRound('medium');
    const resultA = submitEvaluationAnswer(round, true,  5);
    const resultB = submitEvaluationAnswer(round, false, 5);
    expect(resultA.correctAnswer).toBe(round.correctAnswer);
    expect(resultB.correctAnswer).toBe(round.correctAnswer);
    // userAnswer reflects what was submitted
    expect(resultA.userAnswer).toBe(true);
    expect(resultB.userAnswer).toBe(false);
    // Exactly one of them is correct
    const aCorrect = resultA.userAnswer === resultA.correctAnswer;
    const bCorrect = resultB.userAnswer === resultB.correctAnswer;
    expect(aCorrect !== bCorrect).toBe(true);
  });
});
