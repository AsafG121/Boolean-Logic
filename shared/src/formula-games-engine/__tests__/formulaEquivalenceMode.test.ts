import { describe, it, expect } from 'vitest';
import { submitEquivalenceAnswer } from '../formulaEquivalenceMode';
import { generateEquivalenceRound } from '../formulaGenerator';

describe('submitEquivalenceAnswer', () => {
  it('correct "equivalent" answer: userAnswer=true and positive score', () => {
    const round = generateEquivalenceRound('easy', true);
    const result = submitEquivalenceAnswer(round, true, 20);
    expect(result.userAnswer).toBe(true);
    expect(result.score).toBe(100); // 120 - 20
    expect(result.areEquivalent).toBe(true);
  });

  it('wrong answer on equivalent pair: userAnswer=false and score=0', () => {
    const round = generateEquivalenceRound('easy', true);
    const result = submitEquivalenceAnswer(round, false, 20);
    expect(result.userAnswer).toBe(false);
    expect(result.score).toBe(0);
  });

  it('correct "not equivalent" answer: userAnswer=false and positive score', () => {
    const round = generateEquivalenceRound('easy', false);
    const result = submitEquivalenceAnswer(round, false, 30);
    expect(result.userAnswer).toBe(false);
    expect(result.score).toBe(90); // 120 - 30
    expect(result.areEquivalent).toBe(false);
  });

  it('wrong answer on non-equivalent pair: userAnswer=true and score=0', () => {
    const round = generateEquivalenceRound('easy', false);
    const result = submitEquivalenceAnswer(round, true, 30);
    expect(result.userAnswer).toBe(true);
    expect(result.score).toBe(0);
  });

  it('areEquivalent field reflects the round ground truth', () => {
    const roundEq    = generateEquivalenceRound('medium', true);
    const roundNotEq = generateEquivalenceRound('medium', false);
    expect(submitEquivalenceAnswer(roundEq,    true,  5).areEquivalent).toBe(true);
    expect(submitEquivalenceAnswer(roundNotEq, false, 5).areEquivalent).toBe(false);
  });

  it('maximum score when answered at elapsed=0', () => {
    const round = generateEquivalenceRound('easy', true);
    const result = submitEquivalenceAnswer(round, true, 0);
    expect(result.score).toBe(120);
  });

  it('score=0 when answered at elapsed=120 even if correct', () => {
    const round = generateEquivalenceRound('easy', true);
    const result = submitEquivalenceAnswer(round, true, 120);
    expect(result.score).toBe(0);
  });
});
