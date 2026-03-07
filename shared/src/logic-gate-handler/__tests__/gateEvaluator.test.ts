import { describe, it, expect } from 'vitest';
import { evaluateGate } from '../gateEvaluator';

describe('evaluateGate', () => {
  describe('AND', () => {
    it.each([
      [false, false, false],
      [false, true,  false],
      [true,  false, false],
      [true,  true,  true],
    ])('AND(%s, %s) === %s', (a, b, expected) => {
      expect(evaluateGate('AND', [a, b])).toBe(expected);
    });
  });

  describe('OR', () => {
    it.each([
      [false, false, false],
      [false, true,  true],
      [true,  false, true],
      [true,  true,  true],
    ])('OR(%s, %s) === %s', (a, b, expected) => {
      expect(evaluateGate('OR', [a, b])).toBe(expected);
    });
  });

  describe('XOR', () => {
    it.each([
      [false, false, false],
      [false, true,  true],
      [true,  false, true],
      [true,  true,  false],
    ])('XOR(%s, %s) === %s', (a, b, expected) => {
      expect(evaluateGate('XOR', [a, b])).toBe(expected);
    });
  });

  describe('NOT', () => {
    it('NOT(false) === true',  () => expect(evaluateGate('NOT', [false])).toBe(true));
    it('NOT(true)  === false', () => expect(evaluateGate('NOT', [true])).toBe(false));
  });

  describe('NAND', () => {
    it.each([
      [false, false, true],
      [false, true,  true],
      [true,  false, true],
      [true,  true,  false],
    ])('NAND(%s, %s) === %s', (a, b, expected) => {
      expect(evaluateGate('NAND', [a, b])).toBe(expected);
    });
  });

  describe('NOR', () => {
    it.each([
      [false, false, true],
      [false, true,  false],
      [true,  false, false],
      [true,  true,  false],
    ])('NOR(%s, %s) === %s', (a, b, expected) => {
      expect(evaluateGate('NOR', [a, b])).toBe(expected);
    });
  });

  describe('XNOR', () => {
    it.each([
      [false, false, true],
      [false, true,  false],
      [true,  false, false],
      [true,  true,  true],
    ])('XNOR(%s, %s) === %s', (a, b, expected) => {
      expect(evaluateGate('XNOR', [a, b])).toBe(expected);
    });
  });

  describe('input validation', () => {
    it('throws if NOT receives 0 inputs', () => {
      expect(() => evaluateGate('NOT', [])).toThrow('NOT gate requires exactly 1 input, got 0');
    });

    it('throws if NOT receives 2 inputs', () => {
      expect(() => evaluateGate('NOT', [true, false])).toThrow('NOT gate requires exactly 1 input, got 2');
    });

    it('throws if AND receives 1 input', () => {
      expect(() => evaluateGate('AND', [true])).toThrow('AND gate requires exactly 2 inputs, got 1');
    });

    it('throws if OR receives 3 inputs', () => {
      expect(() => evaluateGate('OR', [true, false, true])).toThrow('OR gate requires exactly 2 inputs, got 3');
    });

    it('throws if NAND receives 0 inputs', () => {
      expect(() => evaluateGate('NAND', [])).toThrow('NAND gate requires exactly 2 inputs, got 0');
    });
  });
});
