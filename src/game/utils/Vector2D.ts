// ============================================================
// Vector2D.ts — Immutable 2D vector utility class
// Encapsulation: internal x,y state with method-based API
// ============================================================

/**
 * Represents a 2D vector with x and y components.
 * Used for positions, velocities, and directions throughout the game.
 *
 * Demonstrates Encapsulation — state (x, y) is accessed through
 * well-defined methods that ensure valid operations.
 */
export class Vector2D {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  /** Returns a new vector = this + other */
  add(other: Vector2D): Vector2D {
    return new Vector2D(this.x + other.x, this.y + other.y);
  }

  /** Returns a new vector = this - other */
  subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  /** Returns a new vector scaled by the given factor */
  scale(factor: number): Vector2D {
    return new Vector2D(this.x * factor, this.y * factor);
  }

  /** Returns the magnitude (length) of the vector */
  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /** Returns a unit vector in the same direction, or zero vector if magnitude is 0 */
  normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / mag, this.y / mag);
  }

  /** Returns the distance to another vector */
  distanceTo(other: Vector2D): number {
    return this.subtract(other).magnitude();
  }

  /** Returns the angle in radians from this vector to another */
  angleTo(other: Vector2D): number {
    const diff = other.subtract(this);
    return Math.atan2(diff.y, diff.x);
  }

  /** Creates a vector from an angle (radians) and magnitude */
  static fromAngle(angle: number, magnitude: number = 1): Vector2D {
    return new Vector2D(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude,
    );
  }

  /** Returns a zero vector */
  static zero(): Vector2D {
    return new Vector2D(0, 0);
  }

  /** Returns dot product of this vector with another */
  dot(other: Vector2D): number {
    return this.x * other.x + this.y * other.y;
  }

  /** Rotates the vector by the given angle in radians */
  rotate(angle: number): Vector2D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
    );
  }
}
