// ============================================================
// Flamethrower.ts — Short-range cone-of-fire weapon
// Card-only unlock, card-only ammo. High DPS, short range.
// Strategy Pattern — swappable via Player.setWeapon()
// ============================================================

import { Weapons, BulletConfig } from '../interfaces/Weapons';
import { Vector2D } from '../utils/Vector2D';

/**
 * Flamethrower — sprays a cone of flame particles.
 * Very high fire rate, low per-hit damage, short range.
 * Flame particles auto-destroy quickly (handled by short bullet lifetime).
 */
export class Flamethrower implements Weapons {
  readonly name: string = 'Flamethrower';
  readonly fireRate: number = 20;       // 20 shots per second
  readonly damage: number = 8;          // per flame particle
  readonly maxAmmo: number = 200;
  readonly color: string = '#ff6b35';   // fiery orange

  fire(origin: Vector2D, direction: Vector2D): BulletConfig[] {
    const bullets: BulletConfig[] = [];
    const particleCount = 3;

    for (let i = 0; i < particleCount; i++) {
      // Wide cone spread
      const spread = (Math.random() - 0.5) * 0.5;
      const flameDir = direction.rotate(spread);

      // Varying speed for organic feel
      const speed = 250 + Math.random() * 100;

      // Varying sizes for visual richness
      const size = 3 + Math.random() * 3;

      // Randomize flame color slightly
      const colors = ['#ff6b35', '#ff8f00', '#ffab00', '#ff5722', '#ff3d00'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      bullets.push({
        x: origin.x + direction.x * 18,
        y: origin.y + direction.y * 18,
        dirX: flameDir.x,
        dirY: flameDir.y,
        speed,
        damage: this.damage,
        size,
        color,
      });
    }

    return bullets;
  }

  getFireInterval(): number {
    return 1000 / this.fireRate;
  }
}
