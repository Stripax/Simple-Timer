/* Pure timer state. The injected monotonic clock also makes boundary cases testable. */
class Timer {
  constructor(durationMs = 60000, clock = () => performance.now()) {
    this.clock = clock;
    this.durationMs = durationMs;
    this.accumulated = 0;
    this.startedAt = 0;
    this.state = 'idle';
  }
  read() {
    let elapsed = this.accumulated;
    if (this.state === 'running') elapsed += Math.max(0, this.clock() - this.startedAt);
    if (elapsed >= this.durationMs) {
      elapsed = this.durationMs;
      this.accumulated = elapsed;
      this.state = 'finished';
    }
    return { elapsed, remaining: this.durationMs - elapsed, state: this.state };
  }
  start() {
    this.read();
    if (this.state === 'running') return;
    if (this.state !== 'paused') this.accumulated = 0;
    this.startedAt = this.clock();
    this.state = 'running';
  }
  pause() {
    const value = this.read();
    if (value.state !== 'running') return;
    this.accumulated = value.elapsed;
    this.state = 'paused';
  }
  stop() {
    const value = this.read();
    if (!['running', 'paused'].includes(value.state)) return;
    this.accumulated = value.elapsed;
    this.state = 'stopped';
  }
  reset(durationMs = this.durationMs) {
    if (!Number.isFinite(durationMs) || durationMs <= 0) throw new RangeError('Ajan täytyy olla positiivinen.');
    this.durationMs = durationMs;
    this.accumulated = 0;
    this.state = 'idle';
  }
}
if (typeof module !== 'undefined') module.exports = { Timer };
