// ============================================================
// Crossbow.ts — Slow, hard-hitting bolt weapon
// Card-only unlock. Very slow fire rate, massive single-hit damage.
// Strategy Pattern — swappable via Player.setWeapon()
// ============================================================

import { IWeaponStrategy, BulletConfig } from '../interfaces/IWeaponStrategy';
import { Vector2D } from '../utils/Vector2D';

/**
 * Crossbow — fires a single heavy bolt.
 * Very slow fire rate, devastating per-hit damage.
 * Bolt is large, slow-moving, and brown/gold colored.
 */
export class Crossbow implements IWeaponStrategy {
  readonly name = 'Crossbow';
  readonly fireRate = 0.8;      // 0.8 shots per second (very slow)
  readonly damage = 80;         // massive per bolt
  readonly maxAmmo = 40;
  readonly color = '#8d6e63';   // brown/gold

  fire(origin: Vector2D, direction: Vector2D): BulletConfig[] {
    return [{
      x: origin.x + direction.x * 22,
      y: origin.y + direction.y * 22,
      dirX: direction.x,
      dirY: direction.y,
      speed: 450,
      damage: this.damage,
      size: 5,
      color: '#8d6e63',
    }];
  }

  getFireInterval(): number {
    return 1000 / this.fireRate;
  }
}
