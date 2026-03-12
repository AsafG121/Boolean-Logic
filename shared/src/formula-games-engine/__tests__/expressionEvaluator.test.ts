import { describe, it, expect } from 'vitest';
import { evaluateFormula, checkEquivalence } from '../expressionEvaluator';
import { parseFormula } from '../formulaParser';
import type { FormulaNode, Formula } from '../types';

// Helper to build a Formula from a root node (no variable collection needed for tests)
function formula(root: FormulaNode, variables: string[] = []): Formula {
  return { root, variables };
}

describe('evaluateFormula', () => {
  describe('variable node', () => {
    it('returns the assigned value', () => {
      const node: FormulaNode = { type: 'variable', name: 'x' };
      expect(evaluateFormula(node, { x: true  })).toBe(true);
      expect(evaluateFormula(node, { x: false })).toBe(false);
    });

    it('throws when the variable is missing from the assignment', () => {
      const node: FormulaNode = { type: 'variable', name: 'x' };
      expect(() => evaluateFormula(node, {})).toThrow("No assignment provided for variable 'x'");
    });
  });

  describe('NOT', () => {
    it('NOT false → true',  () => {
      const node: FormulaNode = { type: 'not', operand: { type: 'variable', name: 'x' } };
      expect(evaluateFormula(node, { x: false })).toBe(true);
    });
    it('NOT true → false', () => {
      const node: FormulaNode = { type: 'not', operand: { type: 'variable', name: 'x' } };
      expect(evaluateFormula(node, { x: true })).toBe(false);
    });
  });

  describe('binary operators via formula strings', () => {
    const cases: [string, Record<string, boolean>, boolean][] = [
      // AND
      ['x AND y', { x: false, y: false }, false],
      ['x AND y', { x: true,  y: false }, false],
      ['x AND y', { x: true,  y: true  }, true],
      // OR
      ['x OR y',  { x: false, y: false }, false],
      ['x OR y',  { x: false, y: true  }, true],
      ['x OR y',  { x: true,  y: true  }, true],
      // XOR
      ['x XOR y', { x: false, y: false }, false],
      ['x XOR y', { x: false, y: true  }, true],
      ['x XOR y', { x: true,  y: true  }, false],
      // NAND
      ['x NAND y', { x: true,  y: true  }, false],
      ['x NAND y', { x: false, y: true  }, true],
      // NOR
      ['x NOR y',  { x: false, y: false }, true],
      ['x NOR y',  { x: true,  y: false }, false],
      // XNOR
      ['x XNOR y', { x: false, y: false }, true],
      ['x XNOR y', { x: false, y: true  }, false],
      ['x XNOR y', { x: true,  y: true  }, true],
    ];

    it.each(cases)('%s with %o → %s', (formulaStr, assignment, expected) => {
      const f = parseFormula(formulaStr);
      expect(evaluateFormula(f.root, assignment)).toBe(expected);
    });
  });

  describe('compound formulas', () => {
    it('evaluates (x AND y) OR z correctly', () => {
      const f = parseFormula('x AND y OR z');
      expect(evaluateFormula(f.root, { x: false, y: true,  z: true  })).toBe(true);
      expect(evaluateFormula(f.root, { x: false, y: true,  z: false })).toBe(false);
      expect(evaluateFormula(f.root, { x: true,  y: true,  z: false })).toBe(true);
    });

    it('evaluates NOT x AND NOT y correctly', () => {
      const f = parseFormula('NOT x AND NOT y');
      expect(evaluateFormula(f.root, { x: false, y: false })).toBe(true);
      expect(evaluateFormula(f.root, { x: true,  y: false })).toBe(false);
    });
  });
});

describe('checkEquivalence', () => {
  it('reports identical formulas as equivalent', () => {
    const f = parseFormula('x AND y');
    expect(checkEquivalence(f, f)).toBe(true);
  });

  it('x AND y  ≡  y AND x  (commutativity)', () => {
    const a = parseFormula('x AND y');
    const b = parseFormula('y AND x');
    expect(checkEquivalence(a, b)).toBe(true);
  });

  it('De Morgan: NOT (x AND y)  ≡  NOT x OR NOT y', () => {
    const a = parseFormula('NOT (x AND y)');
    const b = parseFormula('NOT x OR NOT y');
    expect(checkEquivalence(a, b)).toBe(true);
  });

  it('De Morgan: NOT (x OR y)  ≡  NOT x AND NOT y', () => {
    const a = parseFormula('NOT (x OR y)');
    const b = parseFormula('NOT x AND NOT y');
    expect(checkEquivalence(a, b)).toBe(true);
  });

  it('x AND y  is NOT equivalent to  x OR y', () => {
    const a = parseFormula('x AND y');
    const b = parseFormula('x OR y');
    expect(checkEquivalence(a, b)).toBe(false);
  });

  it('handles formulas with different variable sets', () => {
    // x AND y  vs  x AND z  — differ when y≠z
    const a = parseFormula('x AND y');
    const b = parseFormula('x AND z');
    expect(checkEquivalence(a, b)).toBe(false);
  });

  it('double negation: NOT NOT x  ≡  x', () => {
    const a = parseFormula('NOT NOT x');
    const b = parseFormula('x');
    expect(checkEquivalence(a, b)).toBe(true);
  });

  it('x XNOR y  ≡  (x AND y) OR (NOT x AND NOT y)', () => {
    const a = parseFormula('x XNOR y');
    const b = parseFormula('(x AND y) OR (NOT x AND NOT y)');
    expect(checkEquivalence(a, b)).toBe(true);
  });
});
