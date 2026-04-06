// ============================================================
// Shotgun.ts — Spread weapon, Strategy Pattern implementation
// Same interface as Pistol but completely different behavior
// ============================================================

import { IWeaponStrategy, BulletConfig } from "../interfaces/IWeaponStrategy";
import { Vector2D } from "../utils/Vector2D";

/**
 * Shotgun — fires 5 pellets in a spread pattern.
 * Slow fire rate, devastating at close range.
 * Demonstrates Polymorphism: same fire() signature, different behavior.
 */
export class Shotgun implements IWeaponStrategy {
  readonly name = "Shotgun";
  readonly fireRate = 1; // 0.7 shots per second
  readonly damage = 20; // per pellet
  readonly maxAmmo = 30;
  readonly color = "#ff8a65"; // orange

  fire(origin: Vector2D, direction: Vector2D): BulletConfig[] {
    const pelletCount = 6;
    const spreadAngle = 0.4; // radians total spread
    const bullets: BulletConfig[] = [];

    for (let i = 0; i < pelletCount; i++) {
      // Distribute pellets evenly across the spread
      const offsetAngle =
        -spreadAngle / 2 + (spreadAngle / (pelletCount - 1)) * i;
      const pelletDir = direction.rotate(offsetAngle);

      // Add slight randomness to each pellet
      const randomOffset = (Math.random() - 0.5) * 0.05;
      const finalDir = pelletDir.rotate(randomOffset);

      bullets.push({
        x: origin.x + direction.x * 20,
        y: origin.y + direction.y * 20,
        dirX: finalDir.x,
        dirY: finalDir.y,
        speed: 500 + Math.random() * 100,
        damage: this.damage,
        size: 2,
        color: "#ff8a65",
      });
    }

    return bullets;
  }

  getFireInterval(): number {
    return 1000 / this.fireRate;
  }
}
