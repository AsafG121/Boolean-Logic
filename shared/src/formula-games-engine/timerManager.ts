/**
 * Timer Manager — measures response time for a formula game round.
 *
 * Records the wall-clock start and stop times and exposes elapsed seconds.
 * Does not manage countdowns or UI state; those are handled by the client.
 */
export class TimerManager {
  private startMs: number | null = null;
  private stopMs:  number | null = null;

  /** Starts the timer. Resets any previous measurement. */
  start(): void {
    this.startMs = Date.now();
    this.stopMs  = null;
  }

  /**
   * Stops the timer and records the stop time.
   * @throws if the timer has not been started.
   */
  stop(): void {
    if (this.startMs === null) {
      throw new Error('Timer has not been started');
    }
    this.stopMs = Date.now();
  }

  /**
   * Returns the elapsed time in seconds.
   * If the timer is still running, returns time elapsed so far.
   * Returns 0 if the timer has never been started.
   */
  getElapsedSeconds(): number {
    if (this.startMs === null) return 0;
    const endMs = this.stopMs ?? Date.now();
    return (endMs - this.startMs) / 1000;
  }

  /** Returns true if the timer has been started but not yet stopped. */
  isRunning(): boolean {
    return this.startMs !== null && this.stopMs === null;
  }

  /** Resets the timer to its initial state. */
  reset(): void {
    this.startMs = null;
    this.stopMs  = null;
  }
}
