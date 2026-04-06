// ============================================================
// ShieldZombie.ts — Frontal shield that blocks bullets
// Demonstrates: Polymorphism (override takeDamage behavior)
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';
import { Vector2D } from '../utils/Vector2D';

/**
 * A zombie with a frontal shield that blocks incoming bullets.
 * Must be shot from behind or the sides to deal full damage.
 * Introduced at wave 6 to add tactical depth.
 */
export class ShieldZombie extends Enemy {
  private shieldHealth: number;
  private maxShieldHealth: number;
  private shieldAngle: number; // direction the shield faces

  constructor(x: number, y: number, healthMultiplier: number = 1, speedMultiplier: number = 1) {
    super(
      x, y,
      18,                            // medium-large size
      80 * healthMultiplier,         // good health
      55 * speedMultiplier,          // slow
      12,                            // moderate contact damage
      20,                            // good score
    );
    this.shieldHealth = 60 * healthMultiplier;
    this.maxShieldHealth = 60 * healthMultiplier;
    this.shieldAngle = 0;
  }

  getColor(): string {
    return '#26a69a'; // teal
  }

  protected getGlowColor(): string {
    return 'rgba(38, 166, 154, 0.2)';
  }

  getType(): ZombieType {
    return ZombieType.SHIELD;
  }

  /**
   * Override takeDamage to factor in shield.
   * Shield blocks damage from the front.
   */
  takeDamageFrom(amount: number, bulletPosition: Vector2D): void {
    if (this.shieldHealth > 0) {
      // Check if bullet is hitting the shield (front)
      const toAttacker = bulletPosition.subtract(this.position).normalize();
      const facingDir = Vector2D.fromAngle(this.shieldAngle);
      const dot = facingDir.dot(toAttacker);

      if (dot > 0.3) {
        // Hit the shield — reduced damage
        const blocked = Math.min(this.shieldHealth, amount * 0.8);
        this.shieldHealth -= blocked;
        const passthrough = amount * 0.2;
        super.takeDamage(passthrough);
        this.hitFlashTimer = 0.1;
        return;
      }
    }

    // Hit from side/back — full damage
    super.takeDamage(amount);
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    // Shield faces toward the player
    this.shieldAngle = this.position.angleTo(this.playerPosition);
  }

  render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);

    // Draw shield arc in front
    if (this.shieldHealth > 0) {
      const x = this.position.x;
      const y = this.position.y;
      const shieldPercent = this.shieldHealth / this.maxShieldHealth;

      ctx.strokeStyle = `rgba(38, 166, 154, ${0.5 + shieldPercent * 0.5})`;
      ctx.lineWidth = 3 + shieldPercent * 2;
      ctx.beginPath();
      ctx.arc(
        x, y,
        this.size + 4,
        this.shieldAngle - 0.8,
        this.shieldAngle + 0.8,
      );
      ctx.stroke();

      // Shield glow
      ctx.strokeStyle = `rgba(178, 255, 247, ${shieldPercent * 0.3})`;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(
        x, y,
        this.size + 6,
        this.shieldAngle - 0.6,
        this.shieldAngle + 0.6,
      );
      ctx.stroke();
    }
  }

  hasShield(): boolean {
    return this.shieldHealth > 0;
  }

  getShieldAngle(): number {
    return this.shieldAngle;
  }
}
