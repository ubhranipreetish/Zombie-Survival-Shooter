// ============================================================
// NecromancerBoss.ts — Dark sorcerer boss that raises undead
// Appears at wave 5, 15, 25... Teleports and spawns minions
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';
import { Vector2D } from '../utils/Vector2D';
import { EventBus } from '../events/EventBus';
import { GameEvent } from '../interfaces/types';

export class NecromancerBoss extends Enemy {
  private teleportTimer: number;
  private teleportCooldown: number;
  private summonTimer: number;
  private summonCooldown: number;
  private orbPhase: number;
  private auraPhase: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private isBoss = true;

  constructor(x: number, y: number, healthMultiplier: number, _speedMultiplier: number, canvasW: number, canvasH: number) {
    super(
      x, y,
      28,
      600 * healthMultiplier,
      40,
      20,
      100,
    );
    this.teleportTimer = 0;
    this.teleportCooldown = 5;
    this.summonTimer = 0;
    this.summonCooldown = 3;
    this.orbPhase = 0;
    this.auraPhase = 0;
    this.canvasWidth = canvasW;
    this.canvasHeight = canvasH;
  }

  getColor(): string { return '#9c27b0'; }
  protected getGlowColor(): string { return 'rgba(156, 39, 176, 0.35)'; }
  getType(): ZombieType { return ZombieType.BOSS_NECROMANCER; }
  getIsBoss(): boolean { return this.isBoss; }

  takeDamage(amount: number): void {
    super.takeDamage(amount);
    if (this.health <= 0) {
      EventBus.getInstance().emit(GameEvent.BOSS_DEFEATED, { type: ZombieType.BOSS_NECROMANCER });
    }
  }

  // Signature move: mass summon 6 minions in a circle
  protected performSignatureMove(): void {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      EventBus.getInstance().emit(GameEvent.SPAWN_MINION, {
        x: this.position.x + Math.cos(angle) * 80,
        y: this.position.y + Math.sin(angle) * 80,
      });
    }
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.orbPhase += deltaTime * 2;
    this.auraPhase += deltaTime;

    this.teleportTimer += deltaTime;
    if (this.teleportTimer >= this.teleportCooldown) {
      this.teleportTimer = 0;
      const margin = 100;
      this.position = new Vector2D(
        margin + Math.random() * (this.canvasWidth - margin * 2),
        margin + Math.random() * (this.canvasHeight - margin * 2),
      );
    }

    this.summonTimer += deltaTime;
    if (this.summonTimer >= this.summonCooldown) {
      this.summonTimer = 0;
      for (let i = 0; i < 3; i++) {
        EventBus.getInstance().emit(GameEvent.SPAWN_MINION, {
          x: this.position.x + (Math.random() - 0.5) * 60,
          y: this.position.y + (Math.random() - 0.5) * 60,
        });
      }
    }

    this.emitHealthUpdate();
  }

  private emitHealthUpdate(): void {
    EventBus.getInstance().emit(GameEvent.BOSS_HEALTH_CHANGED, {
      name: 'NECROMANCER',
      health: this.health,
      maxHealth: this.maxHealth,
      color: '#9c27b0',
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Dark aura
    const auraSize = this.size * 3 + Math.sin(this.auraPhase * 2) * 6;
    const aura = ctx.createRadialGradient(x, y, this.size, x, y, auraSize);
    aura.addColorStop(0, 'rgba(156, 39, 176, 0.15)');
    aura.addColorStop(0.5, 'rgba(74, 20, 140, 0.08)');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();

    // Floating dark orbs
    for (let i = 0; i < 5; i++) {
      const angle = this.orbPhase + (i / 5) * Math.PI * 2;
      const orbDist = this.size * 1.8 + Math.sin(this.orbPhase * 1.5 + i) * 5;
      const ox = x + Math.cos(angle) * orbDist;
      const oy = y + Math.sin(angle) * orbDist;

      const orbGlow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 6);
      orbGlow.addColorStop(0, '#e040fb');
      orbGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGlow;
      ctx.beginPath();
      ctx.arc(ox, oy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ba68c8';
      ctx.beginPath();
      ctx.arc(ox, oy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(x, y + this.size * 0.9, this.size * 1.2, this.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body — dark with inner glow
    const bodyGrad = ctx.createRadialGradient(x, y - 4, 0, x, y, this.size);
    bodyGrad.addColorStop(0, '#ce93d8');
    bodyGrad.addColorStop(0.6, '#7b1fa2');
    bodyGrad.addColorStop(1, '#4a148c');
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Crown / horns
    ctx.strokeStyle = '#e040fb';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const baseAngle = -Math.PI / 2 + i * 0.5;
      const hx = x + Math.cos(baseAngle) * this.size;
      const hy = y + Math.sin(baseAngle) * this.size;
      const tipX = x + Math.cos(baseAngle) * (this.size + 12);
      const tipY = y + Math.sin(baseAngle) * (this.size + 12);
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
    }

    // Eyes — glowing purple
    const eyeOffset = this.size * 0.25;
    ctx.fillStyle = '#e040fb';
    ctx.shadowColor = '#e040fb';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x - eyeOffset, y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + eyeOffset, y - 3, 4, 0, Math.PI * 2);
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
      ctx.fillStyle = '#ce93d8';
      ctx.fillRect(barX, barY, barW * pct, barH);
    }
  }
}
