// ============================================================
// LaserRifle.ts — Fast-firing dual beam weapon
// Card-only unlock. High fire rate, moderate damage, long range.
// Strategy Pattern — swappable via Player.setWeapon()
// ============================================================

import { IWeaponStrategy, BulletConfig } from '../interfaces/IWeaponStrategy';
import { Vector2D } from '../utils/Vector2D';

/**
 * Laser Rifle — fires 2 parallel laser beams.
 * High fire rate, moderate per-hit damage, long range.
 * Beams are thin, fast, and cyan-colored.
 */
export class LaserRifle implements IWeaponStrategy {
  readonly name = 'LaserRifle';
  readonly fireRate = 8;        // 8 shots per second
  readonly damage = 12;         // per beam
  readonly maxAmmo = 150;
  readonly color = '#00e5ff';   // cyan

  fire(origin: Vector2D, direction: Vector2D): BulletConfig[] {
    const bullets: BulletConfig[] = [];
    const perpendicular = new Vector2D(-direction.y, direction.x);
    const offset = 5; // parallel beam spacing

    for (const side of [-1, 1]) {
      const ox = origin.x + perpendicular.x * offset * side + direction.x * 18;
      const oy = origin.y + perpendicular.y * offset * side + direction.y * 18;

      bullets.push({
        x: ox,
        y: oy,
        dirX: direction.x,
        dirY: direction.y,
        speed: 900,
        damage: this.damage,
        size: 2,
        color: '#00e5ff',
      });
    }

    return bullets;
  }

  getFireInterval(): number {
    return 1000 / this.fireRate;
  }
}
