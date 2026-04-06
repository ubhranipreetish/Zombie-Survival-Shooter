// ============================================================
// Enemy.ts — Abstract base class for all zombie types
// Demonstrates: Inheritance, Abstraction, Polymorphism
// Implements: IDamageable (only entities that take damage)
// Open/Closed: New zombie types extend this, no modification needed
// ============================================================

import { GameObject } from './GameObject';
import { IDamageable } from '../interfaces/IDamageable';
import { Vector2D } from '../utils/Vector2D';
import { ZombieType } from '../interfaces/types';

/**
 * Abstract base class for all zombie enemies.
 *
 * - Inheritance: NormalZombie, FastZombie, TankZombie extend this
 * - Abstraction: getColor() and getType() are abstract
 * - Polymorphism: each subclass renders differently
 * - Open/Closed: add new zombie types without modifying this class
 */
export abstract class Enemy extends GameObject implements IDamageable {
  protected health: number;
  protected maxHealth: number;
  protected speed: number;
  protected damage: number;
  protected scoreValue: number;
  protected playerPosition: Vector2D;
  protected hitFlashTimer: number;
  private wobbleOffset: number;
  private wobbleSpeed: number;
  protected knockbackVelocity: Vector2D = Vector2D.zero();

  // Skull checkpoint system (bosses only)
  protected skullThresholds: number[] = [0.66, 0.33]; // fractions of maxHealth
  protected skullsTriggered: number = 0;
  protected bossInvincibilityTimer: number = 0;
  protected isPerformingSignature: boolean = false;

  constructor(
    x: number,
    y: number,
    size: number,
    health: number,
    speed: number,
    damage: number,
    scoreValue: number,
  ) {
    super(x, y, size);
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.damage = damage;
    this.scoreValue = scoreValue;
    this.playerPosition = Vector2D.zero();
    this.hitFlashTimer = 0;
    this.wobbleOffset = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 3 + Math.random() * 2;
  }

  applyKnockback(push: Vector2D): void {
    this.knockbackVelocity = this.knockbackVelocity.add(push);
  }

  setDamageMultiplier(mult: number): void {
    this.damage *= mult;
  }

  // ----- IDamageable implementation -----

  takeDamage(amount: number): void {
    // Boss invincibility during skull phase
    if (this.bossInvincibilityTimer > 0) return;

    this.health -= amount;
    this.hitFlashTimer = 0.1; // flash white for 100ms

    // Skull threshold check (bosses only)
    if (this.getIsBoss()) {
      while (
        this.skullsTriggered < this.skullThresholds.length &&
        this.health <= this.maxHealth * this.skullThresholds[this.skullsTriggered] &&
        this.health > 0
      ) {
        this.skullsTriggered++;
        this.bossInvincibilityTimer = 3.0; // 3 seconds invincible
        this.isPerformingSignature = true;
        this.performSignatureMove();
      }
    }

    if (this.health <= 0) {
      this.health = 0;
      this.destroy();
    }
  }

  isAlive(): boolean {
    return this.health > 0 && this.active;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  // ----- Getters -----

  getDamage(): number {
    return this.damage;
  }

  getScoreValue(): number {
    return this.scoreValue;
  }

  /** EXP dropped on death — defaults to scoreValue, bosses override */
  getExpValue(): number {
    return this.scoreValue;
  }

  /** Whether this enemy is a boss — override in boss subclasses */
  getIsBoss(): boolean {
    return false;
  }

  /** Boss signature move — override in boss subclasses */
  protected performSignatureMove(): void {
    // No-op for non-bosses
  }

  /** Whether the boss is currently invincible (skull phase) */
  isBossInvincible(): boolean {
    return this.bossInvincibilityTimer > 0;
  }

  getSkullsTriggered(): number {
    return this.skullsTriggered;
  }

  getTotalSkulls(): number {
    return this.skullThresholds.length;
  }

  // ----- Game Logic -----

  /** Called each frame to update the target player position */
  setPlayerPosition(pos: Vector2D): void {
    this.playerPosition = pos;
  }

  update(deltaTime: number): void {
    // Chase the player
    const toPlayer = this.playerPosition.subtract(this.position).normalize();
    this.velocity = toPlayer.scale(this.speed);
    
    // Combine base chasing velocity with knockback velocity
    const finalVelocity = this.velocity.add(this.knockbackVelocity);
    this.position = this.position.add(finalVelocity.scale(deltaTime));

    // Smoothly decay knockback over time (frame-rate independent)
    const decay = Math.exp(-15 * deltaTime); // fast decay for snappy bounce
    this.knockbackVelocity = this.knockbackVelocity.scale(decay);
    if (this.knockbackVelocity.magnitude() < 10) {
      this.knockbackVelocity = Vector2D.zero();
    }

    // Update hit flash
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= deltaTime;
    }

    // Boss invincibility tick
    if (this.bossInvincibilityTimer > 0) {
      this.bossInvincibilityTimer -= deltaTime;
      if (this.bossInvincibilityTimer <= 0) {
        this.bossInvincibilityTimer = 0;
        this.isPerformingSignature = false;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const wobble = Math.sin(Date.now() * 0.001 * this.wobbleSpeed + this.wobbleOffset) * 2;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + this.size * 0.8, this.size * 0.8, this.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const isHit = this.hitFlashTimer > 0;
    const bodyColor = isHit ? '#ffffff' : this.getColor();

    // Outer glow
    const glow = ctx.createRadialGradient(x, y + wobble, 0, x, y + wobble, this.size * 1.4);
    glow.addColorStop(0, 'transparent');
    glow.addColorStop(0.7, 'transparent');
    glow.addColorStop(1, this.getGlowColor());
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y + wobble, this.size * 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(x, y + wobble, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Inner shading
    const innerGradient = ctx.createRadialGradient(
      x - this.size * 0.3, y + wobble - this.size * 0.3, 0,
      x, y + wobble, this.size,
    );
    innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(x, y + wobble, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeOffset = this.size * 0.3;
    const eyeSize = this.size * 0.2;
    const toPlayer = this.playerPosition.subtract(this.position).normalize();

    ctx.fillStyle = isHit ? '#ff0000' : '#ff3333';
    ctx.beginPath();
    ctx.arc(
      x - eyeOffset + toPlayer.x * 2,
      y + wobble - eyeSize + toPlayer.y * 2,
      eyeSize,
      0, Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      x + eyeOffset + toPlayer.x * 2,
      y + wobble - eyeSize + toPlayer.y * 2,
      eyeSize,
      0, Math.PI * 2,
    );
    ctx.fill();

    // Health bar (only if damaged)
    if (this.health < this.maxHealth) {
      const barWidth = this.size * 2;
      const barHeight = 4;
      const barX = x - barWidth / 2;
      const barY = y - this.size - 10 + wobble;
      const healthPercent = this.health / this.maxHealth;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      const healthColor = healthPercent > 0.5 ? '#44ff44' :
                          healthPercent > 0.25 ? '#ffaa00' : '#ff3333';
      ctx.fillStyle = healthColor;
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

      // Skull markers on boss health bars
      if (this.getIsBoss()) {
        for (let i = 0; i < this.skullThresholds.length; i++) {
          const threshold = this.skullThresholds[i];
          const markerX = barX + barWidth * threshold;
          const triggered = i < this.skullsTriggered;
          ctx.fillStyle = triggered ? '#555' : '#ffffff';
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💀', markerX, barY - 1);
        }

        // Invincibility flash glow
        if (this.bossInvincibilityTimer > 0) {
          ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + Math.sin(Date.now() * 0.01) * 0.3})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y + wobble, this.size + 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }

  // ----- Abstract methods for Polymorphism -----

  /** Each zombie type has a unique color */
  abstract getColor(): string;

  /** Optional glow effect color */
  protected getGlowColor(): string {
    return 'rgba(0, 0, 0, 0)';
  }

  /** Get the zombie type enum */
  abstract getType(): ZombieType;
}
