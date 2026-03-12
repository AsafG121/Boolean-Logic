import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimerManager } from '../timerManager';

describe('TimerManager', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(()  => { vi.useRealTimers(); });

  it('returns 0 elapsed before start', () => {
    const t = new TimerManager();
    expect(t.getElapsedSeconds()).toBe(0);
  });

  it('isRunning is false before start', () => {
    expect(new TimerManager().isRunning()).toBe(false);
  });

  it('isRunning is true after start', () => {
    const t = new TimerManager();
    t.start();
    expect(t.isRunning()).toBe(true);
  });

  it('isRunning is false after stop', () => {
    const t = new TimerManager();
    t.start();
    t.stop();
    expect(t.isRunning()).toBe(false);
  });

  it('measures elapsed seconds correctly', () => {
    const t = new TimerManager();
    t.start();
    vi.advanceTimersByTime(5000);
    t.stop();
    expect(t.getElapsedSeconds()).toBeCloseTo(5, 5);
  });

  it('getElapsedSeconds returns live elapsed while running', () => {
    const t = new TimerManager();
    t.start();
    vi.advanceTimersByTime(3000);
    expect(t.getElapsedSeconds()).toBeCloseTo(3, 5);
    vi.advanceTimersByTime(2000);
    expect(t.getElapsedSeconds()).toBeCloseTo(5, 5);
  });

  it('getElapsedSeconds is stable after stop', () => {
    const t = new TimerManager();
    t.start();
    vi.advanceTimersByTime(7000);
    t.stop();
    vi.advanceTimersByTime(10000); // advance more — should not affect result
    expect(t.getElapsedSeconds()).toBeCloseTo(7, 5);
  });

  it('throws when stop is called before start', () => {
    const t = new TimerManager();
    expect(() => t.stop()).toThrow('Timer has not been started');
  });

  it('reset clears all state', () => {
    const t = new TimerManager();
    t.start();
    vi.advanceTimersByTime(4000);
    t.stop();
    t.reset();
    expect(t.isRunning()).toBe(false);
    expect(t.getElapsedSeconds()).toBe(0);
  });

  it('can be restarted after reset', () => {
    const t = new TimerManager();
    t.start();
    vi.advanceTimersByTime(2000);
    t.stop();
    t.reset();
    t.start();
    vi.advanceTimersByTime(6000);
    t.stop();
    expect(t.getElapsedSeconds()).toBeCloseTo(6, 5);
  });
});
