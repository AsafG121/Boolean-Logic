import { describe, it, expect } from 'vitest';
import { parseFormula, serializeFormula } from '../formulaParser';

describe('parseFormula', () => {
  describe('single variable', () => {
    it('parses a single variable', () => {
      const f = parseFormula('x');
      expect(f.root).toEqual({ type: 'variable', name: 'x' });
      expect(f.variables).toEqual(['x']);
    });

    it('normalizes variable names to lowercase', () => {
      const f = parseFormula('X');
      expect(f.root).toEqual({ type: 'variable', name: 'x' });
    });
  });

  describe('NOT', () => {
    it('parses NOT x', () => {
      const f = parseFormula('NOT x');
      expect(f.root).toEqual({ type: 'not', operand: { type: 'variable', name: 'x' } });
    });

    it('parses double NOT', () => {
      const f = parseFormula('NOT NOT x');
      expect(f.root).toEqual({
        type: 'not',
        operand: { type: 'not', operand: { type: 'variable', name: 'x' } },
      });
    });
  });

  describe('binary operators', () => {
    it.each([
      ['AND', 'x AND y'],
      ['OR',  'x OR y'],
      ['XOR', 'x XOR y'],
    ])('parses %s', (op, input) => {
      const f = parseFormula(input);
      expect(f.root).toEqual({
        type: 'binary', operator: op,
        left:  { type: 'variable', name: 'x' },
        right: { type: 'variable', name: 'y' },
      });
      expect(f.variables).toEqual(['x', 'y']);
    });

    it.each([
      ['NAND', 'x NAND y', 'AND'],
      ['NOR',  'x NOR y',  'OR'],
      ['XNOR', 'x XNOR y', 'XOR'],
    ])('%s desugars to NOT(inner op)', (_keyword, input, innerOp) => {
      const f = parseFormula(input);
      expect(f.root).toEqual({
        type: 'not',
        operand: {
          type: 'binary', operator: innerOp,
          left:  { type: 'variable', name: 'x' },
          right: { type: 'variable', name: 'y' },
        },
      });
      expect(f.variables).toEqual(['x', 'y']);
    });
  });

  describe('precedence', () => {
    it('AND binds tighter than OR', () => {
      // x AND y OR z  →  (x AND y) OR z
      const f = parseFormula('x AND y OR z');
      expect(f.root).toEqual({
        type: 'binary', operator: 'OR',
        left: {
          type: 'binary', operator: 'AND',
          left:  { type: 'variable', name: 'x' },
          right: { type: 'variable', name: 'y' },
        },
        right: { type: 'variable', name: 'z' },
      });
    });

    it('NOT binds tighter than AND', () => {
      // NOT x AND y  →  (NOT x) AND y
      const f = parseFormula('NOT x AND y');
      expect(f.root).toEqual({
        type: 'binary', operator: 'AND',
        left:  { type: 'not', operand: { type: 'variable', name: 'x' } },
        right: { type: 'variable', name: 'y' },
      });
    });

    it('XOR is between AND and OR in precedence', () => {
      // x AND y XOR z  →  (x AND y) XOR z
      const f = parseFormula('x AND y XOR z');
      expect(f.root).toEqual({
        type: 'binary', operator: 'XOR',
        left: {
          type: 'binary', operator: 'AND',
          left:  { type: 'variable', name: 'x' },
          right: { type: 'variable', name: 'y' },
        },
        right: { type: 'variable', name: 'z' },
      });
    });

    it('x XOR y OR z  →  (x XOR y) OR z', () => {
      const f = parseFormula('x XOR y OR z');
      expect(f.root.type).toBe('binary');
      if (f.root.type === 'binary') {
        expect(f.root.operator).toBe('OR');
        expect(f.root.left).toEqual({
          type: 'binary', operator: 'XOR',
          left:  { type: 'variable', name: 'x' },
          right: { type: 'variable', name: 'y' },
        });
      }
    });
  });

  describe('parentheses', () => {
    it('parentheses override precedence', () => {
      // x AND (y OR z)
      const f = parseFormula('x AND (y OR z)');
      expect(f.root).toEqual({
        type: 'binary', operator: 'AND',
        left: { type: 'variable', name: 'x' },
        right: {
          type: 'binary', operator: 'OR',
          left:  { type: 'variable', name: 'y' },
          right: { type: 'variable', name: 'z' },
        },
      });
    });

    it('nested parentheses', () => {
      const f = parseFormula('(x AND (y OR z))');
      expect(f.root.type).toBe('binary');
    });
  });

  describe('variables list', () => {
    it('collects all variables sorted', () => {
      const f = parseFormula('z AND x OR y');
      expect(f.variables).toEqual(['x', 'y', 'z']);
    });

    it('deduplicates repeated variables', () => {
      const f = parseFormula('x AND x');
      expect(f.variables).toEqual(['x']);
    });
  });

  describe('error handling', () => {
    it('throws on empty input', () => {
      expect(() => parseFormula('')).toThrow();
      expect(() => parseFormula('   ')).toThrow();
    });

    it('throws on unexpected character', () => {
      expect(() => parseFormula('x @ y')).toThrow();
    });

    it('throws on keyword in variable position', () => {
      expect(() => parseFormula('AND')).toThrow();
    });

    it('throws on unmatched opening parenthesis', () => {
      expect(() => parseFormula('(x AND y')).toThrow();
    });

    it('throws on trailing tokens', () => {
      expect(() => parseFormula('x y')).toThrow();
    });
  });
});

describe('serializeFormula', () => {
  it('round-trips a simple formula', () => {
    const f = parseFormula('x AND y');
    expect(serializeFormula(f.root)).toBe('x AND y');
  });

  it('round-trips NOT', () => {
    const f = parseFormula('NOT x');
    expect(serializeFormula(f.root)).toBe('NOT x');
  });

  it('adds parentheses to preserve precedence when re-parsed', () => {
    // x AND (y OR z) must NOT serialize as  x AND y OR z  (wrong precedence)
    const f = parseFormula('x AND (y OR z)');
    const s = serializeFormula(f.root);
    const f2 = parseFormula(s);
    // The re-parsed tree must be identical to the original
    expect(f2.root).toEqual(f.root);
  });


});
