import { describe, it, expect } from 'vitest';
import { evaluateFormula, checkEquivalence } from '../expressionEvaluator';
import type { FormulaNode, Formula } from '../types';

// ─── Tree-building helpers ────────────────────────────────────────────────────

const x: FormulaNode = { type: 'variable', name: 'x' };
const y: FormulaNode = { type: 'variable', name: 'y' };
const z: FormulaNode = { type: 'variable', name: 'z' };

function and(l: FormulaNode, r: FormulaNode): FormulaNode {
  return { type: 'binary', operator: 'AND', left: l, right: r };
}
function or(l: FormulaNode, r: FormulaNode): FormulaNode {
  return { type: 'binary', operator: 'OR', left: l, right: r };
}
function xor(l: FormulaNode, r: FormulaNode): FormulaNode {
  return { type: 'binary', operator: 'XOR', left: l, right: r };
}
function not(o: FormulaNode): FormulaNode {
  return { type: 'not', operand: o };
}
function formula(root: FormulaNode, variables: string[] = []): Formula {
  return { root, variables };
}

// ─── evaluateFormula ──────────────────────────────────────────────────────────

describe('evaluateFormula', () => {
  describe('variable node', () => {
    it('returns the assigned value', () => {
      expect(evaluateFormula(x, { x: true  })).toBe(true);
      expect(evaluateFormula(x, { x: false })).toBe(false);
    });

    it('throws when the variable is missing from the assignment', () => {
      expect(() => evaluateFormula(x, {})).toThrow("No assignment provided for variable 'x'");
    });
  });

  describe('NOT', () => {
    it('NOT false → true',  () => {
      expect(evaluateFormula(not(x), { x: false })).toBe(true);
    });
    it('NOT true → false', () => {
      expect(evaluateFormula(not(x), { x: true })).toBe(false);
    });
  });

  describe('binary operators', () => {
    const cases: [string, FormulaNode, Record<string, boolean>, boolean][] = [
      // AND
      ['x AND y (ff)', and(x, y), { x: false, y: false }, false],
      ['x AND y (tf)', and(x, y), { x: true,  y: false }, false],
      ['x AND y (tt)', and(x, y), { x: true,  y: true  }, true ],
      // OR
      ['x OR y (ff)',  or(x, y),  { x: false, y: false }, false],
      ['x OR y (ft)',  or(x, y),  { x: false, y: true  }, true ],
      ['x OR y (tt)',  or(x, y),  { x: true,  y: true  }, true ],
      // XOR
      ['x XOR y (ff)', xor(x, y), { x: false, y: false }, false],
      ['x XOR y (ft)', xor(x, y), { x: false, y: true  }, true ],
      ['x XOR y (tt)', xor(x, y), { x: true,  y: true  }, false],
      // NAND  (= NOT AND)
      ['x NAND y (tt)', not(and(x, y)), { x: true,  y: true  }, false],
      ['x NAND y (ft)', not(and(x, y)), { x: false, y: true  }, true ],
      // NOR   (= NOT OR)
      ['x NOR y (ff)', not(or(x, y)), { x: false, y: false }, true ],
      ['x NOR y (tf)', not(or(x, y)), { x: true,  y: false }, false],
      // XNOR  (= NOT XOR)
      ['x XNOR y (ff)', not(xor(x, y)), { x: false, y: false }, true ],
      ['x XNOR y (ft)', not(xor(x, y)), { x: false, y: true  }, false],
      ['x XNOR y (tt)', not(xor(x, y)), { x: true,  y: true  }, true ],
    ];

    it.each(cases)('%s', (_label, node, assignment, expected) => {
      expect(evaluateFormula(node, assignment)).toBe(expected);
    });
  });

  describe('compound formulas', () => {
    it('evaluates (x AND y) OR z correctly', () => {
      const node = or(and(x, y), z);
      expect(evaluateFormula(node, { x: false, y: true,  z: true  })).toBe(true);
      expect(evaluateFormula(node, { x: false, y: true,  z: false })).toBe(false);
      expect(evaluateFormula(node, { x: true,  y: true,  z: false })).toBe(true);
    });

    it('evaluates (NOT x) AND (NOT y) correctly', () => {
      const node = and(not(x), not(y));
      expect(evaluateFormula(node, { x: false, y: false })).toBe(true);
      expect(evaluateFormula(node, { x: true,  y: false })).toBe(false);
    });
  });
});

// ─── checkEquivalence ─────────────────────────────────────────────────────────

describe('checkEquivalence', () => {
  it('reports identical formulas as equivalent', () => {
    const f = formula(and(x, y), ['x', 'y']);
    expect(checkEquivalence(f, f)).toBe(true);
  });

  it('x AND y  ≡  y AND x  (commutativity)', () => {
    const a = formula(and(x, y), ['x', 'y']);
    const b = formula(and(y, x), ['x', 'y']);
    expect(checkEquivalence(a, b)).toBe(true);
  });

  it('De Morgan: NOT (x AND y)  ≡  NOT x OR NOT y', () => {
    const a = formula(not(and(x, y)),    ['x', 'y']);
    const b = formula(or(not(x), not(y)), ['x', 'y']);
    expect(checkEquivalence(a, b)).toBe(true);
  });

  it('De Morgan: NOT (x OR y)  ≡  NOT x AND NOT y', () => {
    const a = formula(not(or(x, y)),      ['x', 'y']);
    const b = formula(and(not(x), not(y)), ['x', 'y']);
    expect(checkEquivalence(a, b)).toBe(true);
  });

  it('x AND y  is NOT equivalent to  x OR y', () => {
    const a = formula(and(x, y), ['x', 'y']);
    const b = formula(or(x, y),  ['x', 'y']);
    expect(checkEquivalence(a, b)).toBe(false);
  });

  it('handles formulas with different variable sets', () => {
    const a = formula(and(x, y), ['x', 'y']);
    const b = formula(and(x, z), ['x', 'z']);
    expect(checkEquivalence(a, b)).toBe(false);
  });

  it('double negation: NOT NOT x  ≡  x', () => {
    const a = formula(not(not(x)), ['x']);
    const b = formula(x,           ['x']);
    expect(checkEquivalence(a, b)).toBe(true);
  });

  it('x XNOR y  ≡  (x AND y) OR (NOT x AND NOT y)', () => {
    const a = formula(not(xor(x, y)),                         ['x', 'y']);
    const b = formula(or(and(x, y), and(not(x), not(y))),     ['x', 'y']);
    expect(checkEquivalence(a, b)).toBe(true);
  });
});
