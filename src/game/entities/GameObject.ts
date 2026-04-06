// ============================================================
// GameObject.ts — Abstract base class for all game entities
// Demonstrates: Abstraction, Encapsulation, Inheritance
// Implements: IRenderable, IUpdatable (Interface Segregation)
// ============================================================

import { IRenderable } from '../interfaces/IRenderable';
import { IUpdatable } from '../interfaces/IUpdatable';
import { Vector2D } from '../utils/Vector2D';

/**
 * Abstract base class for all game objects (Player, Enemy, Bullet, PowerUp).
 *
 * - Encapsulation: position, velocity, size are managed internally
 * - Abstraction: subclasses must implement render() and update()
 * - Inheritance: Player, Enemy, Bullet all inherit common state
 */
export abstract class GameObject implements IRenderable, IUpdatable {
  protected position: Vector2D;
  protected velocity: Vector2D;
  protected size: number;      // radius for circular objects
  protected active: boolean;   // whether this object should be updated/rendered

  constructor(x: number, y: number, size: number) {
    this.position = new Vector2D(x, y);
    this.velocity = Vector2D.zero();
    this.size = size;
    this.active = true;
  }

  /** Get current position */
  getPosition(): Vector2D {
    return this.position;
  }

  /** Get collision radius */
  getSize(): number {
    return this.size;
  }

  /** Check if this object is active (should be updated/rendered) */
  isActive(): boolean {
    return this.active;
  }

  /** Deactivate this object (mark for removal) */
  destroy(): void {
    this.active = false;
  }

  /**
   * Check circle-circle collision with another GameObject.
   * Both objects are treated as circles with radius = size.
   */
  collidesWith(other: GameObject): boolean {
    const dist = this.position.distanceTo(other.position);
    return dist < this.size + other.size;
  }

  // Abstract methods — each subclass implements its own behavior (Polymorphism)
  abstract update(deltaTime: number): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
}
