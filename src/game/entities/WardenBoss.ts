// ============================================================
// WardenBoss.ts — Massive fortress boss with shield walls
// Appears at wave 25, 40... Laser sweep + shield walls + summon
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';
import { EventBus } from '../events/EventBus';
import { GameEvent } from '../interfaces/types';

export class WardenBoss extends Enemy {
  private shieldAngle: number;
  private shieldCount: number;
  private laserTimer: number;
  private laserCooldown: number;
  private laserAngle: number;
  private isLaserFiring: boolean;
  private laserDuration: number;
  private laserElapsed: number;
  private summonTimer: number;
  private summonCooldown: number;
  private pulsePhase: number;
  private isBoss = true;

  constructor(x: number, y: number, healthMultiplier: number, _speedMultiplier: number) {
    super(
      x, y,
      38,
      1200 * healthMultiplier,
      30,        // very slow — fortress style
      25,
      300,
    );
    this.shieldAngle = 0;
    this.shieldCount = 4;
    this.laserTimer = 0;
    this.laserCooldown = 7;
    this.laserAngle = 0;
    this.isLaserFiring = false;
    this.laserDuration = 2.5;
    this.laserElapsed = 0;
    this.summonTimer = 0;
    this.summonCooldown = 8;
    this.pulsePhase = 0;
  }

  getColor(): string { return '#37474f'; }
  protected getGlowColor(): string { return 'rgba(55, 71, 79, 0.3)'; }
  getType(): ZombieType { return ZombieType.BOSS_WARDEN; }
  getIsBoss(): boolean { return this.isBoss; }

  // Signature move: accelerated 360 degree laser sweep
  protected performSignatureMove(): void {
    this.isLaserFiring = true;
    this.laserElapsed = 0;
    this.laserDuration = 3.0; // match invulnerability window
    this.laserAngle = this.position.angleTo(this.playerPosition);
    this.laserTimer = 0;
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.shieldAngle += deltaTime * 0.8;
    this.pulsePhase += deltaTime * 2;

    // Laser sweep
    this.laserTimer += deltaTime;
    if (this.isLaserFiring) {
      this.laserElapsed += deltaTime;
      const sweepSpeed = this.bossInvincibilityTimer > 0 ? 3.5 : 1.5; // much faster during signature move
      this.laserAngle += deltaTime * sweepSpeed; 
      if (this.laserElapsed >= this.laserDuration) {
        this.isLaserFiring = false;
        this.laserTimer = 0;
      }
    } else if (this.laserTimer >= this.laserCooldown) {
      this.isLaserFiring = true;
      this.laserElapsed = 0;
      // Aim laser toward player
      this.laserAngle = this.position.angleTo(this.playerPosition);
    }

    // Summon berserker troops
    this.summonTimer += deltaTime;
    if (this.summonTimer >= this.summonCooldown) {
      this.summonTimer = 0;
      // Spawn in cardinal directions
      const offsets = [
        { x: 80, y: 0 }, { x: -80, y: 0 },
        { x: 0, y: 80 }, { x: 0, y: -80 },
      ];
      for (const offset of offsets) {
        EventBus.getInstance().emit(GameEvent.SPAWN_MINION, {
          x: this.position.x + offset.x,
          y: this.position.y + offset.y,
          type: 'BERSERKER',
        });
      }
    }

    this.emitHealthUpdate();
  }

  getIsLaserFiring(): boolean { return this.isLaserFiring; }
  getLaserAngle(): number { return this.laserAngle; }

  private emitHealthUpdate(): void {
    EventBus.getInstance().emit(GameEvent.BOSS_HEALTH_CHANGED, {
      name: 'WARDEN',
      health: this.health,
      maxHealth: this.maxHealth,
      color: '#546e7a',
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Shield walls (rotating barrier segments)
    for (let i = 0; i < this.shieldCount; i++) {
      const angle = this.shieldAngle + (i / this.shieldCount) * Math.PI * 2;
      const shieldDist = this.size * 2.2;
      const sx = x + Math.cos(angle) * shieldDist;
      const sy = y + Math.sin(angle) * shieldDist;

      // Shield segment
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle + Math.PI / 2);

      // Shield glow
      const shieldGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 15);
      shieldGlow.addColorStop(0, 'rgba(96, 125, 139, 0.3)');
      shieldGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = shieldGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();

      // Shield plate
      ctx.fillStyle = '#78909c';
      ctx.fillRect(-12, -4, 24, 8);
      ctx.strokeStyle = '#b0bec5';
      ctx.lineWidth = 1;
      ctx.strokeRect(-12, -4, 24, 8);

      ctx.restore();
    }

    // Laser beam
    if (this.isLaserFiring) {
      const laserLen = 500;
      const lx = x + Math.cos(this.laserAngle) * laserLen;
      const ly = y + Math.sin(this.laserAngle) * laserLen;

      // Laser glow
      ctx.strokeStyle = 'rgba(244, 67, 54, 0.15)';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(lx, ly);
      ctx.stroke();

      // Core beam
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f44336';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(lx, ly);
      ctx.stroke();

      // Inner white core
      ctx.strokeStyle = '#ffcdd2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(lx, ly);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(x, y + this.size * 0.9, this.size * 1.4, this.size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body — fortress
    const bodyGrad = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, this.size);
    bodyGrad.addColorStop(0, '#78909c');
    bodyGrad.addColorStop(0.5, '#455a64');
    bodyGrad.addColorStop(1, '#263238');
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Fortress pattern — thick cross
    ctx.strokeStyle = '#90a4ae';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - this.size * 0.6, y);
    ctx.lineTo(x + this.size * 0.6, y);
    ctx.moveTo(x, y - this.size * 0.6);
    ctx.lineTo(x, y + this.size * 0.6);
    ctx.stroke();

    // Corner bolts
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const bx = x + Math.cos(a) * this.size * 0.7;
      const by = y + Math.sin(a) * this.size * 0.7;
      ctx.fillStyle = '#b0bec5';
      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Eye — single central red eye
    const eyePulse = 4 + Math.sin(this.pulsePhase * 2) * 1;
    ctx.fillStyle = '#f44336';
    ctx.shadowColor = '#f44336';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x, y - 2, eyePulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Laser charge indicator
    if (!this.isLaserFiring && this.laserTimer > this.laserCooldown * 0.6) {
      const chargePct = (this.laserTimer - this.laserCooldown * 0.6) / (this.laserCooldown * 0.4);
      ctx.strokeStyle = `rgba(244, 67, 54, ${chargePct * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, this.size + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargePct);
      ctx.stroke();
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
      ctx.fillStyle = '#78909c';
      ctx.fillRect(barX, barY, barW * pct, barH);
    }
  }
}
