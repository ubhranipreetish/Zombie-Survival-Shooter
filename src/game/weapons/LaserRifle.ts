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
  readonly fireRate = 50;       // 50 shots per second! Literally a line!
  readonly damage = 3;          // very low per hit, since it hits constantly
  readonly maxAmmo = 500;
  readonly color = '#00e5ff';   // cyan

  fire(origin: Vector2D, direction: Vector2D): BulletConfig[] {
    const bullets: BulletConfig[] = [];
    const perpendicular = new Vector2D(-direction.y, direction.x);
    const offset = 2; // parallel beam spacing very tight

    for (const side of [-1, 1]) {
      const ox = origin.x + perpendicular.x * offset * side + direction.x * 12;
      const oy = origin.y + perpendicular.y * offset * side + direction.y * 12;

      bullets.push({
        x: ox,
        y: oy,
        dirX: direction.x,
        dirY: direction.y,
        speed: 2500, // lightning fast!
        damage: this.damage,
        size: 1.5,
        color: '#00e5ff',
      });
    }

    return bullets;
  }

  getFireInterval(): number {
    return 1000 / this.fireRate;
  }
}
