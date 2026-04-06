// ============================================================
// JuggernautBoss.ts — Massive armored boss that charges
// Appears at wave 10, 20... Ground slam AoE + charge attack
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';
import { Vector2D } from '../utils/Vector2D';
import { EventBus } from '../events/EventBus';
import { GameEvent } from '../interfaces/types';

export class JuggernautBoss extends Enemy {
  private chargeTimer: number;
  private chargeCooldown: number;
  private isCharging: boolean;
  private chargeDirection: Vector2D;
  private chargeSpeed: number;
  private chargeDuration: number;
  private chargeElapsed: number;
  private slamTimer: number;
  private slamCooldown: number;
  private slamFlash: number;
  private armorPhase: number;
  private isBoss = true;

  constructor(x: number, y: number, healthMultiplier: number, _speedMultiplier: number) {
    super(
      x, y,
      32,
      600 * healthMultiplier,
      30,
      25,
      150,
    );
    this.chargeTimer = 3;
    this.chargeCooldown = 6;
    this.isCharging = false;
    this.chargeDirection = Vector2D.zero();
    this.chargeSpeed = 400;
    this.chargeDuration = 1.0;
    this.chargeElapsed = 0;
    this.slamTimer = 0;
    this.slamCooldown = 8;
    this.slamFlash = 0;
    this.armorPhase = 0;
  }

  getColor(): string { return '#d32f2f'; }
  protected getGlowColor(): string { return 'rgba(211, 47, 47, 0.3)'; }
  getType(): ZombieType { return ZombieType.BOSS_JUGGERNAUT; }
  getIsBoss(): boolean { return this.isBoss; }

  update(deltaTime: number): void {
    this.armorPhase += deltaTime;
    if (this.slamFlash > 0) this.slamFlash -= deltaTime;

    if (this.isCharging) {
      this.chargeElapsed += deltaTime;
      this.position = this.position.add(this.chargeDirection.scale(this.chargeSpeed * deltaTime));
      if (this.chargeElapsed >= this.chargeDuration) {
        this.isCharging = false;
        this.chargeTimer = 0;
      }
    } else {
      super.update(deltaTime);
      this.chargeTimer += deltaTime;
      if (this.chargeTimer >= this.chargeCooldown) {
        this.isCharging = true;
        this.chargeElapsed = 0;
        this.chargeDirection = this.playerPosition.subtract(this.position).normalize();
      }
    }

    // Ground slam
    this.slamTimer += deltaTime;
    if (this.slamTimer >= this.slamCooldown && !this.isCharging) {
      this.slamTimer = 0;
      this.slamFlash = 0.5;
      EventBus.getInstance().emit(GameEvent.ENEMY_SHOOT, {
        x: this.position.x,
        y: this.position.y,
        dirX: 0, dirY: 0,
        speed: 0,
        damage: 30,
        isSlam: true,
        radius: 120,
      });
    }

    this.emitHealthUpdate();
  }

  private emitHealthUpdate(): void {
    EventBus.getInstance().emit(GameEvent.BOSS_HEALTH_CHANGED, {
      name: 'JUGGERNAUT',
      health: this.health,
      maxHealth: this.maxHealth,
      color: '#d32f2f',
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Charge trail
    if (this.isCharging) {
      for (let i = 1; i <= 4; i++) {
        const trailX = x - this.chargeDirection.x * i * 15;
        const trailY = y - this.chargeDirection.y * i * 15;
        ctx.fillStyle = `rgba(255, 87, 34, ${0.3 - i * 0.06})`;
        ctx.beginPath();
        ctx.arc(trailX, trailY, this.size - i * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Slam shockwave
    if (this.slamFlash > 0) {
      const shockSize = (0.5 - this.slamFlash) * 300;
      ctx.strokeStyle = `rgba(255, 87, 34, ${this.slamFlash * 2})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, shockSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(x, y + this.size, this.size * 1.3, this.size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armor plating effect
    const armorShine = 0.1 + Math.sin(this.armorPhase * 1.5) * 0.05;

    // Main body — layered armor
    const bodyGrad = ctx.createRadialGradient(x - 6, y - 6, 0, x, y, this.size);
    bodyGrad.addColorStop(0, '#ef5350');
    bodyGrad.addColorStop(0.5, '#c62828');
    bodyGrad.addColorStop(1, '#6a0000');
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Armor highlight ring
    ctx.strokeStyle = `rgba(255, 205, 210, ${armorShine + 0.15})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, this.size - 4, -0.3, 1.2);
    ctx.stroke();

    // Cross armor plate
    ctx.strokeStyle = '#ffcdd2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - this.size * 0.5, y);
    ctx.lineTo(x + this.size * 0.5, y);
    ctx.moveTo(x, y - this.size * 0.5);
    ctx.lineTo(x, y + this.size * 0.3);
    ctx.stroke();

    // Eyes — angry red with glow
    ctx.fillStyle = '#ff1744';
    ctx.shadowColor = '#ff1744';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 8, y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Eye inner
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 8, y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 8, y - 5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Charge indicator
    if (!this.isCharging) {
      const chargePct = this.chargeTimer / this.chargeCooldown;
      if (chargePct > 0.6) {
        ctx.strokeStyle = `rgba(255, 87, 34, ${(chargePct - 0.6) * 2.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, this.size + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargePct);
        ctx.stroke();
      }
    }

    // Health bar
    if (this.health < this.maxHealth) {
      const barW = this.size * 2.5;
      const barH = 5;
      const barX = x - barW / 2;
      const barY = y - this.size - 16;
      const pct = this.health / this.maxHealth;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ef5350';
      ctx.fillRect(barX, barY, barW * pct, barH);
    }
  }
}
