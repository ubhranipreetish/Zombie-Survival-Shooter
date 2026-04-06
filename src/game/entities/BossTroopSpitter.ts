// ============================================================
// BossTroopSpitter.ts — Hydra's special boss troop
// Ranged toxic spitter with teal glow, shoots slow projectiles
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';
import { EventBus } from '../events/EventBus';
import { GameEvent } from '../interfaces/types';

export class BossTroopSpitter extends Enemy {
  private shootTimer: number;
  private shootCooldown: number;
  private toxicPhase: number;

  constructor(x: number, y: number, healthMultiplier: number, speedMultiplier: number) {
    super(
      x, y,
      13,                             // medium-small
      35 * healthMultiplier,          // low-medium HP
      45 * speedMultiplier,           // slow — ranged unit
      10,                             // contact damage
      20,                             // medium score
    );
    this.shootTimer = 1 + Math.random() * 2;
    this.shootCooldown = 2.5;
    this.toxicPhase = Math.random() * Math.PI * 2;
  }

  getColor(): string { return '#00897b'; }
  protected getGlowColor(): string { return 'rgba(0, 137, 123, 0.3)'; }
  getType(): ZombieType { return ZombieType.BOSS_TROOP_SPITTER; }

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.toxicPhase += deltaTime * 2;

    this.shootTimer -= deltaTime;
    if (this.shootTimer <= 0) {
      this.shootTimer = this.shootCooldown;
      const toPlayer = this.playerPosition.subtract(this.position).normalize();
      EventBus.getInstance().emit(GameEvent.ENEMY_SHOOT, {
        x: this.position.x + toPlayer.x * (this.size + 5),
        y: this.position.y + toPlayer.y * (this.size + 5),
        dirX: toPlayer.x,
        dirY: toPlayer.y,
        speed: 150,
        damage: 8,
      });
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Toxic drip particles
    const dripCount = 3;
    for (let i = 0; i < dripCount; i++) {
      const angle = this.toxicPhase + (i / dripCount) * Math.PI * 2;
      const dist = this.size * 1.3 + Math.sin(angle * 2) * 3;
      const dx = x + Math.cos(angle) * dist;
      const dy = y + Math.sin(angle) * dist;
      ctx.fillStyle = `rgba(0, 230, 118, ${0.3 + Math.sin(angle) * 0.15})`;
      ctx.beginPath();
      ctx.arc(dx, dy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Base render
    super.render(ctx);

    // Mouth / spitter orifice
    const toPlayer = this.playerPosition.subtract(this.position).normalize();
    const mx = x + toPlayer.x * this.size * 0.6;
    const my = y + toPlayer.y * this.size * 0.6;
    ctx.fillStyle = '#00e676';
    ctx.beginPath();
    ctx.arc(mx, my, 3, 0, Math.PI * 2);
    ctx.fill();

    // Shoot charge indicator
    if (this.shootTimer < 0.5) {
      ctx.fillStyle = `rgba(0, 230, 118, ${(0.5 - this.shootTimer) * 1.5})`;
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
