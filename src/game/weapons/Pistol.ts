// ============================================================
// Pistol.ts — Default weapon, Strategy Pattern implementation
// Heavy hitting, slow fire rate — like a hand cannon
// ============================================================

import { Weapons, BulletConfig } from '../interfaces/Weapons';
import { Vector2D } from '../utils/Vector2D';

/**
 * Pistol — reliable default weapon with infinite ammo.
 * Slow fire rate but high damage per shot.
 */
export class Pistol implements Weapons {
  readonly name: string = 'Pistol';
  readonly fireRate: number = 1.33;     // ~1.33 shots/sec (3x slower: was 4)
  readonly damage: number = 40;         // 2x damage (was 20)
  readonly maxAmmo: number = Infinity;
  readonly color: string = '#90caf9';

  fire(origin: Vector2D, direction: Vector2D): BulletConfig[] {
    return [{
      x: origin.x + direction.x * 20,
      y: origin.y + direction.y * 20,
      dirX: direction.x,
      dirY: direction.y,
      speed: 600,
      damage: this.damage,
      size: 4,               // bigger bullet for heavy pistol
      color: '#90caf9',
    }];
  }

  getFireInterval(): number {
    return 1000 / this.fireRate;
  }
}
