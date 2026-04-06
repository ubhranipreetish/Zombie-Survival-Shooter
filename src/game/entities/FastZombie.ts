// ============================================================
// FastZombie.ts — Quick but fragile zombie type
// Inheritance: extends Enemy
// Polymorphism: different color, size, stats than NormalZombie
// Liskov Substitution: substitutable for Enemy anywhere
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';
import { Vector2D } from '../utils/Vector2D';

/**
 * Fast zombie — high speed, low health, smaller size.
 * Introduced at wave 3 to increase difficulty variety.
 */
export class FastZombie extends Enemy {
  constructor(x: number, y: number, healthMultiplier: number = 1, speedMultiplier: number = 1) {
    super(
      x, y,
      12,                            // smaller size
      30 * healthMultiplier,         // low health
      150 * speedMultiplier,         // very fast
      8,                             // lower damage
      15,                            // higher score (harder to hit)
    );
  }

  getColor(): string {
    return '#f0ad4e'; // warning yellow
  }

  protected getGlowColor(): string {
    return 'rgba(240, 173, 78, 0.2)';
  }

  getType(): ZombieType {
    return ZombieType.FAST;
  }

  /** Override update to add erratic zigzag movement */
  update(deltaTime: number): void {
    super.update(deltaTime);
    // Add slight zigzag to make them harder to hit
    const zigzag = Math.sin(Date.now() * 0.008) * 30 * deltaTime;
    const direction = this.playerPosition.subtract(this.position).normalize();
    const perpendicular = new Vector2D(-direction.y, direction.x);
    this.position = this.position.add(perpendicular.scale(zigzag));
  }
}
