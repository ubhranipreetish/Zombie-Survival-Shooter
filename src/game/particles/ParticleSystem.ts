// ============================================================
// ParticleSystem.ts — Manages particle effects
// Single Responsibility: only handles visual particles
// ============================================================

import { Particle } from './Particle';
import { randomBetween } from '../utils/MathUtils';

/**
 * Manages the lifecycle of visual particles.
 * Creates effects like:
 * - Zombie death explosions
 * - Bullet impact sparks
 * - Damage indicators
 */
export class ParticleSystem {
  private particles: Particle[];

  constructor() {
    this.particles = [];
  }

  /** Create a burst of particles at a position (e.g., zombie death) */
  createExplosion(
    x: number, y: number,
    color: string,
    count: number = 12,
    speed: number = 150,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + randomBetween(-0.3, 0.3);
      const spd = randomBetween(speed * 0.5, speed * 1.5);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const size = randomBetween(2, 6);
      const lifetime = randomBetween(0.3, 0.8);

      this.particles.push(new Particle(x, y, vx, vy, color, size, lifetime));
    }
  }

  /** Create sparks at bullet impact point */
  createImpact(x: number, y: number, color: string): void {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = randomBetween(0, Math.PI * 2);
      const spd = randomBetween(50, 120);
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;

      this.particles.push(
        new Particle(x, y, vx, vy, color, randomBetween(1.5, 3), randomBetween(0.15, 0.4)),
      );
    }
  }

  /** Create a small text-like floating indicator (e.g., +10 score) */
  createFloatingText(x: number, y: number, color: string): void {
    this.particles.push(
      new Particle(x, y, randomBetween(-10, 10), -60, color, 4, 0.6),
    );
  }

  update(deltaTime: number): void {
    // Update all particles
    this.particles.forEach((p) => p.update(deltaTime));

    // Remove dead particles
    this.particles = this.particles.filter((p) => p.isAlive());
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach((p) => p.render(ctx));
  }

  /** Clear all active particles */
  clear(): void {
    this.particles = [];
  }

  /** Get current particle count (for debugging) */
  getCount(): number {
    return this.particles.length;
  }
}
