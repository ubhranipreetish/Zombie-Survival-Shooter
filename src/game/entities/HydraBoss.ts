// ============================================================
// HydraBoss.ts — Multi-headed boss that shoots in all directions
// Appears at wave 15, 25... Multiple attack patterns
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';
import { EventBus } from '../events/EventBus';
import { GameEvent } from '../interfaces/types';

export class HydraBoss extends Enemy {
  private headCount: number;
  private shootTimer: number;
  private shootCooldown: number;
  private burstTimer: number;
  private burstCooldown: number;
  private headPhase: number;
  private pulsePhase: number;
  private isBoss = true;

  constructor(x: number, y: number, healthMultiplier: number, _speedMultiplier: number) {
    super(
      x, y,
      35,
      1200 * healthMultiplier,
      25,
      20,
      200,
    );
    this.headCount = 7;
    this.shootTimer = 0;
    this.shootCooldown = 1.5;
    this.burstTimer = 0;
    this.burstCooldown = 6;
    this.headPhase = 0;
    this.pulsePhase = 0;
  }

  getColor(): string { return '#00bfa5'; }
  protected getGlowColor(): string { return 'rgba(0, 191, 165, 0.3)'; }
  getType(): ZombieType { return ZombieType.BOSS_HYDRA; }
  getIsBoss(): boolean { return this.isBoss; }

  takeDamage(amount: number): void {
    super.takeDamage(amount);
    if (this.health <= 0) {
      EventBus.getInstance().emit(GameEvent.BOSS_DEFEATED, {
        type: ZombieType.BOSS_HYDRA,
      });
    }
  }

  // Signature move: massive 360° bullet burst
  protected performSignatureMove(): void {
    const count = this.headCount * 4; // Double normal burst pattern
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        EventBus.getInstance().emit(GameEvent.ENEMY_SHOOT, {
          x: this.position.x + dx * (this.size + 10),
          y: this.position.y + dy * (this.size + 10),
          dirX: dx,
          dirY: dy,
          speed: 250,
          damage: 15,
        });
    }
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.headPhase += deltaTime * 1.5;
    this.pulsePhase += deltaTime;

    // Targeted shots from heads
    this.shootTimer += deltaTime;
    if (this.shootTimer >= this.shootCooldown) {
      this.shootTimer = 0;
      const toPlayer = this.playerPosition.subtract(this.position).normalize();
      for (let i = 0; i < 3; i++) {
        const spread = (i - 1) * 0.3;
        const dir = toPlayer.rotate(spread);
        EventBus.getInstance().emit(GameEvent.ENEMY_SHOOT, {
          x: this.position.x + dir.x * (this.size + 10),
          y: this.position.y + dir.y * (this.size + 10),
          dirX: dir.x,
          dirY: dir.y,
          speed: 250,
          damage: 12,
        });
      }
    }

    // Radial burst
    this.burstTimer += deltaTime;
    if (this.burstTimer >= this.burstCooldown) {
      this.burstTimer = 0;
      const count = this.headCount * 2;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        EventBus.getInstance().emit(GameEvent.ENEMY_SHOOT, {
          x: this.position.x + dx * (this.size + 5),
          y: this.position.y + dy * (this.size + 5),
          dirX: dx,
          dirY: dy,
          speed: 200,
          damage: 10,
        });
      }
    }

    this.emitHealthUpdate();
  }

  private emitHealthUpdate(): void {
    EventBus.getInstance().emit(GameEvent.BOSS_HEALTH_CHANGED, {
      name: 'HYDRA',
      health: this.health,
      maxHealth: this.maxHealth,
      color: '#00bfa5',
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Toxic aura
    const auraSize = this.size * 2.5 + Math.sin(this.pulsePhase * 2) * 5;
    const aura = ctx.createRadialGradient(x, y, this.size, x, y, auraSize);
    aura.addColorStop(0, 'rgba(0, 191, 165, 0.12)');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();

    // Heads (snaking tendrils with head bulbs)
    for (let i = 0; i < this.headCount; i++) {
      const baseAngle = (i / this.headCount) * Math.PI * 2;
      const wobble = Math.sin(this.headPhase + i * 1.3) * 0.2;
      const angle = baseAngle + wobble;
      const headDist = this.size * 1.6 + Math.sin(this.headPhase * 1.2 + i) * 4;

      const hx = x + Math.cos(angle) * headDist;
      const hy = y + Math.sin(angle) * headDist;

      // Tendril
      ctx.strokeStyle = '#4db6ac';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const ctrlDist = headDist * 0.6;
      const cx = x + Math.cos(angle + 0.3) * ctrlDist;
      const cy = y + Math.sin(angle + 0.3) * ctrlDist;
      ctx.moveTo(x + Math.cos(angle) * this.size * 0.6, y + Math.sin(angle) * this.size * 0.6);
      ctx.quadraticCurveTo(cx, cy, hx, hy);
      ctx.stroke();

      // Head
      const headGrad = ctx.createRadialGradient(hx - 2, hy - 2, 0, hx, hy, 8);
      headGrad.addColorStop(0, '#80cbc4');
      headGrad.addColorStop(1, '#00897b');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      ctx.fill();

      // Head eye
      ctx.fillStyle = '#e0f2f1';
      ctx.beginPath();
      ctx.arc(hx + Math.cos(angle) * 2, hy + Math.sin(angle) * 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(x, y + this.size, this.size * 1.4, this.size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    const bodyGrad = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, this.size);
    bodyGrad.addColorStop(0, '#80cbc4');
    bodyGrad.addColorStop(0.5, '#00897b');
    bodyGrad.addColorStop(1, '#004d40');
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Pattern — hex scales
    ctx.strokeStyle = 'rgba(178, 223, 219, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a1 = (i / 6) * Math.PI * 2;
      const a2 = ((i + 1) / 6) * Math.PI * 2;
      const r = this.size * 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r);
      ctx.lineTo(x + Math.cos(a2) * r, y + Math.sin(a2) * r);
      ctx.closePath();
      ctx.stroke();
    }

    // Center eye
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Health bar
    if (this.health < this.maxHealth) {
      const barW = this.size * 2.5;
      const barH = 5;
      const barX = x - barW / 2;
      const barY = y - this.size - 16;
      const pct = this.health / this.maxHealth;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#26a69a';
      ctx.fillRect(barX, barY, barW * pct, barH);
    }
  }
}
