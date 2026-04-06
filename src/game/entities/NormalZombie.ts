// ============================================================
// NormalZombie.ts — Standard zombie type
// Inheritance: extends Enemy (which extends GameObject)
// Liskov Substitution: can be used anywhere Enemy is expected
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';

/**
 * Standard zombie — balanced speed and health.
 * Inherits all behavior from Enemy, provides its own visual style.
 */
export class NormalZombie extends Enemy {
  constructor(x: number, y: number, healthMultiplier: number = 1, speedMultiplier: number = 1) {
    super(
      x, y,
      16,                          // size (radius)
      50 * healthMultiplier,       // health — scales with wave
      80 * speedMultiplier,        // speed — moderate
      10,                          // contact damage
      10,                          // score value
    );
  }

  getColor(): string {
    return '#5cb85c'; // zombie green
  }

  protected getGlowColor(): string {
    return 'rgba(92, 184, 92, 0.15)';
  }

  getType(): ZombieType {
    return ZombieType.NORMAL;
  }
}
