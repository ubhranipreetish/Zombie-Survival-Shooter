// ============================================================
// Rifle.ts — Fast fire rate weapon with slight spread
// Strategy Pattern — swappable at runtime via Player.setWeapon()
// ============================================================

import { IWeaponStrategy, BulletConfig } from '../interfaces/IWeaponStrategy';
import { Vector2D } from '../utils/Vector2D';

/**
 * Assault Rifle — high fire rate with slight bullet spread.
 * Sprays bullets in a cone, great against groups.
 */
export class Rifle implements IWeaponStrategy {
  readonly name = 'Rifle';
  readonly fireRate = 10.4;     // 1.3x faster (was 8)
  readonly damage = 18;          // +0.2x buff
  readonly maxAmmo = 90;
  readonly color = '#ce93d8';

  fire(origin: Vector2D, direction: Vector2D): BulletConfig[] {
    // Noticeable random spread for spray-style shooting
    const spread = (Math.random() - 0.5) * 0.18;   // wider spread (was 0.04)
    const aimDir = direction.rotate(spread);

    return [{
      x: origin.x + direction.x * 22,
      y: origin.y + direction.y * 22,
      dirX: aimDir.x,
      dirY: aimDir.y,
      speed: 800,
      damage: this.damage,
      size: 2,
      color: '#ce93d8',
    }];
  }

  getFireInterval(): number {
    return 1000 / this.fireRate;
  }
}
