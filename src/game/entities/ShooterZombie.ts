// ============================================================
// ShooterZombie.ts — Ranged enemy that fires projectiles at player
// Demonstrates: Polymorphism (different update/render behavior)
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';
import { Vector2D } from '../utils/Vector2D';
import { EventBus } from '../events/EventBus';
import { GameEvent } from '../interfaces/types';

/**
 * A zombie that stops at range and shoots projectiles at the player.
 * Introduced at wave 4 to force the player to move and dodge.
 */
export class ShooterZombie extends Enemy {
  private shootCooldown: number;
  private shootTimer: number;
  private attackRange: number;
  private projectileSpeed: number;

  constructor(x: number, y: number, healthMultiplier: number = 1, speedMultiplier: number = 1) {
    super(
      x, y,
      15,                            // medium size
      60 * healthMultiplier,         // moderate health
      60 * speedMultiplier,          // slow — stays at range
      5,                             // low contact damage
      20,                            // high score (tough)
    );
    this.shootCooldown = 2.0;        // seconds between shots
    this.shootTimer = 1.0;           // start ready sooner
    this.attackRange = 250;
    this.projectileSpeed = 300;
  }

  getColor(): string {
    return '#7e57c2'; // purple
  }

  protected getGlowColor(): string {
    return 'rgba(126, 87, 194, 0.2)';
  }

  getType(): ZombieType {
    return ZombieType.SHOOTER;
  }

  update(deltaTime: number): void {
    const distToPlayer = this.position.distanceTo(this.playerPosition);

    if (distToPlayer > this.attackRange) {
      // Chase player until in range
      super.update(deltaTime);
    } else {
      // In range — stop and shoot
      this.shootTimer += deltaTime;

      if (this.shootTimer >= this.shootCooldown) {
        this.shootTimer = 0;
        // Emit event for GameEngine to create the bullet
        const dir = this.playerPosition.subtract(this.position).normalize();
        EventBus.getInstance().emit(GameEvent.ENEMY_SHOOT, {
          x: this.position.x + dir.x * (this.size + 5),
          y: this.position.y + dir.y * (this.size + 5),
          dirX: dir.x,
          dirY: dir.y,
          speed: this.projectileSpeed,
          damage: 15,
        });
      }

      // Update hit flash
      if (this.hitFlashTimer > 0) {
        this.hitFlashTimer -= deltaTime;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);

    // Draw "gun" indicator
    const x = this.position.x;
    const y = this.position.y;
    const toPlayer = this.playerPosition.subtract(this.position).normalize();

    // Charging indicator
    const chargePercent = Math.min(1, this.shootTimer / this.shootCooldown);
    if (chargePercent > 0.7) {
      ctx.globalAlpha = (chargePercent - 0.7) * 3.3;
      ctx.fillStyle = '#b388ff';
      ctx.beginPath();
      ctx.arc(
        x + toPlayer.x * (this.size + 8),
        y + toPlayer.y * (this.size + 8),
        4,
        0, Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Range indicator ring
    ctx.strokeStyle = 'rgba(126, 87, 194, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(x, y, this.attackRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
