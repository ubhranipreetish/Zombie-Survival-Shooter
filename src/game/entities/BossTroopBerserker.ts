// ============================================================
// BossTroopBerserker.ts — Juggernaut's special boss troop
// Armored fast charger with red glow, medium HP
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';
import { Vector2D } from '../utils/Vector2D';

export class BossTroopBerserker extends Enemy {
  private chargeTimer: number;
  private isCharging: boolean;
  private chargeDir: Vector2D;
  private chargeElapsed: number;
  private armorFlash: number;

  constructor(x: number, y: number, healthMultiplier: number, speedMultiplier: number) {
    super(
      x, y,
      14,                             // medium size
      50 * healthMultiplier,          // medium HP
      80 * speedMultiplier,           // fast
      15,                             // decent damage
      25,                             // medium score
    );
    this.chargeTimer = 2 + Math.random() * 2;
    this.isCharging = false;
    this.chargeDir = Vector2D.zero();
    this.chargeElapsed = 0;
    this.armorFlash = 0;
  }

  getColor(): string { return '#c62828'; }
  protected getGlowColor(): string { return 'rgba(198, 40, 40, 0.3)'; }
  getType(): ZombieType { return ZombieType.BOSS_TROOP_BERSERKER; }

  update(deltaTime: number): void {
    this.armorFlash += deltaTime;

    if (this.isCharging) {
      this.chargeElapsed += deltaTime;
      this.position = this.position.add(this.chargeDir.scale(350 * deltaTime));
      if (this.chargeElapsed >= 0.6) {
        this.isCharging = false;
        this.chargeTimer = 2 + Math.random();
      }
    } else {
      super.update(deltaTime);
      this.chargeTimer -= deltaTime;
      if (this.chargeTimer <= 0) {
        this.isCharging = true;
        this.chargeElapsed = 0;
        this.chargeDir = this.playerPosition.subtract(this.position).normalize();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Charge trail
    if (this.isCharging) {
      for (let i = 1; i <= 3; i++) {
        const tx = x - this.chargeDir.x * i * 10;
        const ty = y - this.chargeDir.y * i * 10;
        ctx.fillStyle = `rgba(255, 87, 34, ${0.25 - i * 0.06})`;
        ctx.beginPath();
        ctx.arc(tx, ty, this.size - i, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Base render
    super.render(ctx);

    // Armor plates
    const shine = 0.15 + Math.sin(this.armorFlash * 2) * 0.05;
    ctx.strokeStyle = `rgba(255, 205, 210, ${shine})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, this.size - 2, -0.5, 0.8);
    ctx.stroke();

    // Charge indicator
    if (!this.isCharging && this.chargeTimer < 1) {
      ctx.strokeStyle = `rgba(255, 87, 34, ${(1 - this.chargeTimer) * 0.8})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, this.size + 4, 0, Math.PI * 2 * (1 - this.chargeTimer));
      ctx.stroke();
    }
  }
}
