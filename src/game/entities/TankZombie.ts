// ============================================================
// TankZombie.ts — Slow but durable zombie type
// Inheritance: extends Enemy
// Polymorphism: different rendering (larger, darker)
// Liskov Substitution: fully substitutable for Enemy
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';

/**
 * Tank zombie — slow movement, very high health, deals more damage.
 * Introduced at wave 5. A major threat that requires focused fire.
 */
export class TankZombie extends Enemy {
  constructor(x: number, y: number, healthMultiplier: number = 1, speedMultiplier: number = 1) {
    super(
      x, y,
      24,                            // large size
      150 * healthMultiplier,        // very high health
      45 * speedMultiplier,          // very slow
      20,                            // heavy damage
      25,                            // high score value
    );
  }

  getColor(): string {
    return '#d9534f'; // danger red
  }

  protected getGlowColor(): string {
    return 'rgba(217, 83, 79, 0.2)';
  }

  getType(): ZombieType {
    return ZombieType.TANK;
  }

  /** Override render to add armored visual */
  render(ctx: CanvasRenderingContext2D): void {
    // Draw base zombie
    super.render(ctx);

    // Draw armor ring to visually distinguish tank
    const x = this.position.x;
    const y = this.position.y;
    const wobble = Math.sin(Date.now() * 0.003 + 1) * 2;

    ctx.strokeStyle = 'rgba(100, 20, 20, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y + wobble, this.size + 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw spikes
    const spikeCount = 6;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2 + Date.now() * 0.001;
      const spikeX = x + Math.cos(angle) * (this.size + 5);
      const spikeY = y + wobble + Math.sin(angle) * (this.size + 5);

      ctx.fillStyle = '#8b0000';
      ctx.beginPath();
      ctx.arc(spikeX, spikeY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
