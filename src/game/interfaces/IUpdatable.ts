// ============================================================
// IUpdatable.ts — Interface Segregation Principle
// Only classes that need per-frame updates implement this.
// ============================================================

/**
 * Contract for any object that updates its state each frame.
 * @param deltaTime - Time in seconds since last frame, for
 *                     frame-rate-independent movement.
 */
export interface IUpdatable {
  update(deltaTime: number): void;
}
