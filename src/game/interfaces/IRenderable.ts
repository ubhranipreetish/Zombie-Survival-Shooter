// ============================================================
// IRenderable.ts — Interface Segregation Principle
// Only classes that need rendering implement this interface.
// ============================================================

/**
 * Contract for any object that can be drawn on the canvas.
 * Part of Interface Segregation — keeps rendering separate from
 * update logic (IUpdatable) and damage logic (IDamageable).
 */
export interface IRenderable {
  render(ctx: CanvasRenderingContext2D): void;
}
