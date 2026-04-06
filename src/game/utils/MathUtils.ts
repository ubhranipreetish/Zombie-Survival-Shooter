// ============================================================
// MathUtils.ts — Pure utility functions for math operations
// Single Responsibility: only math helpers, no game logic
// ============================================================

/**
 * Clamps a value between min and max (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Returns a random number between min (inclusive) and max (exclusive).
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Returns a random integer between min and max (inclusive).
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

/**
 * Returns the Euclidean distance between two points.
 */
export function distance(
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Linear interpolation between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Converts degrees to radians.
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Returns a random element from an array.
 */
export function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates a random spawn position along the edges of the canvas.
 * Used to spawn zombies outside the visible area.
 */
export function randomEdgePosition(
  canvasWidth: number,
  canvasHeight: number,
  margin: number = 50,
): { x: number; y: number } {
  const side = randomInt(0, 3); // 0=top, 1=right, 2=bottom, 3=left
  switch (side) {
    case 0: // top
      return { x: randomBetween(0, canvasWidth), y: -margin };
    case 1: // right
      return { x: canvasWidth + margin, y: randomBetween(0, canvasHeight) };
    case 2: // bottom
      return { x: randomBetween(0, canvasWidth), y: canvasHeight + margin };
    case 3: // left
      return { x: -margin, y: randomBetween(0, canvasHeight) };
    default:
      return { x: -margin, y: -margin };
  }
}
