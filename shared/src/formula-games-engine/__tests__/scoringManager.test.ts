import { describe, it, expect } from 'vitest';
import { calculateScore } from '../scoringManager';
import { ROUND_DURATION_SECONDS } from '../types';

describe('calculateScore', () => {
  describe('wrong answer always gives 0', () => {
    it.each([0, 10, 60, 119, 120, 200])(
      'wrong answer after %ds → 0',
      (elapsed) => {
        expect(calculateScore(false, elapsed)).toBe(0);
      },
    );
  });

  describe('correct answer gives remaining seconds', () => {
    it('correct at 0s → full score (120)', () => {
      expect(calculateScore(true, 0)).toBe(ROUND_DURATION_SECONDS);
    });

    it('correct at 10s → 110', () => {
      expect(calculateScore(true, 10)).toBe(110);
    });

    it('correct at 60s → 60', () => {
      expect(calculateScore(true, 60)).toBe(60);
    });

    it('correct at 119s → 1', () => {
      expect(calculateScore(true, 119)).toBe(1);
    });

    it('correct at exactly 120s → 0 (time expired)', () => {
      expect(calculateScore(true, 120)).toBe(0);
    });

    it('correct after 120s → 0 (never negative)', () => {
      expect(calculateScore(true, 150)).toBe(0);
    });

    it('floors fractional remaining seconds', () => {
      // elapsed = 10.7 → remaining = 109.3 → floor = 109
      expect(calculateScore(true, 10.7)).toBe(109);
    });
  });
});
