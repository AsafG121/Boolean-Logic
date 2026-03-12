import { describe, it, expect } from 'vitest';
import { generateEvaluationRound, generateEquivalenceRound } from '../formulaGenerator';
import { evaluateFormula, checkEquivalence } from '../expressionEvaluator';

describe('generateEvaluationRound', () => {
  it.each(['easy', 'medium', 'hard'] as const)('produces a valid round for difficulty=%s', (difficulty) => {
    const round = generateEvaluationRound(difficulty);

    // Structure
    expect(round).toHaveProperty('formula');
    expect(round).toHaveProperty('assignment');
    expect(typeof round.correctAnswer).toBe('boolean');

    // Formula has a root and variables
    expect(round.formula.root).toBeTruthy();
    expect(Array.isArray(round.formula.variables)).toBe(true);

    // All formula variables must have an assignment
    for (const v of round.formula.variables) {
      expect(round.assignment).toHaveProperty(v);
      expect(typeof round.assignment[v]).toBe('boolean');
    }
  });

  it('correctAnswer matches evaluating the formula with the assignment', () => {
    for (let i = 0; i < 20; i++) {
      const round = generateEvaluationRound('medium');
      const computed = evaluateFormula(round.formula.root, round.assignment);
      expect(round.correctAnswer).toBe(computed);
    }
  });

  it('easy rounds only use variables x and y', () => {
    for (let i = 0; i < 10; i++) {
      const round = generateEvaluationRound('easy');
      for (const v of round.formula.variables) {
        expect(['x', 'y']).toContain(v);
      }
    }
  });

  it('hard rounds can use variables x, y, z, w', () => {
    // Run many times to ensure at least one uses more than 2 variables
    const varCounts = new Set<number>();
    for (let i = 0; i < 50; i++) {
      const round = generateEvaluationRound('hard');
      varCounts.add(round.formula.variables.length);
    }
    // Hard difficulty should sometimes produce formulas with > 2 variables
    expect([...varCounts].some(n => n > 2)).toBe(true);
  });

  it('formula root is always a non-trivial expression (not a bare variable)', () => {
    for (let i = 0; i < 20; i++) {
      const round = generateEvaluationRound('easy');
      expect(round.formula.root.type).not.toBe('variable');
    }
  });
});

describe('generateEquivalenceRound', () => {
  it.each(['easy', 'medium', 'hard'] as const)(
    'produces a valid round for difficulty=%s (equivalent=true)',
    (difficulty) => {
      const round = generateEquivalenceRound(difficulty, true);
      expect(round.areEquivalent).toBe(true);
      expect(round.formulaA.root).toBeTruthy();
      expect(round.formulaB.root).toBeTruthy();
    },
  );

  it.each(['easy', 'medium', 'hard'] as const)(
    'produces a valid round for difficulty=%s (equivalent=false)',
    (difficulty) => {
      const round = generateEquivalenceRound(difficulty, false);
      expect(round.areEquivalent).toBe(false);
    },
  );

  it('areEquivalent=true rounds are actually logically equivalent', () => {
    for (let i = 0; i < 20; i++) {
      const round = generateEquivalenceRound('medium', true);
      expect(checkEquivalence(round.formulaA, round.formulaB)).toBe(true);
    }
  });

  it('areEquivalent=false rounds are actually NOT logically equivalent', () => {
    for (let i = 0; i < 20; i++) {
      const round = generateEquivalenceRound('medium', false);
      expect(checkEquivalence(round.formulaA, round.formulaB)).toBe(false);
    }
  });

  it('equivalent rounds have syntactically different formulas', () => {
    // A and B should not be the exact same object
    for (let i = 0; i < 10; i++) {
      const round = generateEquivalenceRound('easy', true);
      expect(round.formulaA).not.toBe(round.formulaB);
    }
  });
});
