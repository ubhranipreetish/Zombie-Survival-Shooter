// ============================================================
// PhantomBoss.ts — Ghostly boss that phases in/out
// Appears at wave 20, 35... Invisible phases + homing shots
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';
import { EventBus } from '../events/EventBus';
import { GameEvent } from '../interfaces/types';

export class PhantomBoss extends Enemy {
  private phaseTimer: number;
  private isInvisible: boolean;
  private visibleDuration: number;
  private invisibleDuration: number;
  private shootTimer: number;
  private shootCooldown: number;
  private ghostPhase: number;
  private trailPositions: { x: number; y: number; alpha: number }[];
  private baseSpeed: number;
  private isBoss = true;

  constructor(x: number, y: number, healthMultiplier: number, _speedMultiplier: number) {
    super(
      x, y,
      30,
      1000 * healthMultiplier,
      50,       // slow when visible
      20,
      250,
    );
    this.phaseTimer = 0;
    this.isInvisible = false;
    this.visibleDuration = 5;
    this.invisibleDuration = 3;
    this.shootTimer = 0;
    this.shootCooldown = 1.2;
    this.ghostPhase = 0;
    this.trailPositions = [];
    this.baseSpeed = 50;
  }

  getColor(): string { return '#7e57c2'; }
  protected getGlowColor(): string { return 'rgba(126, 87, 194, 0.3)'; }
  getType(): ZombieType { return ZombieType.BOSS_PHANTOM; }
  getIsBoss(): boolean { return this.isBoss; }
  getIsInvisible(): boolean { return this.isInvisible; }

  takeDamage(amount: number): void {
    // Immune while invisible
    if (this.isInvisible) return;
    super.takeDamage(amount);
  }

  // Signature move: rapid-fire spread of projectiles at the player
  protected performSignatureMove(): void {
    const toPlayer = this.playerPosition.subtract(this.position).normalize();
    for (let i = -3; i <= 4; i++) {
        const spread = i * 0.15;
        const dir = toPlayer.rotate(spread);
        
        EventBus.getInstance().emit(GameEvent.ENEMY_SHOOT, {
          x: this.position.x + dir.x * (this.size + 8),
          y: this.position.y + dir.y * (this.size + 8),
          dirX: dir.x,
          dirY: dir.y,
          speed: 200 + Math.random() * 100, // slightly varied speeds
          damage: 20,
        });
    }
  }

  update(deltaTime: number): void {
    this.ghostPhase += deltaTime * 2;
    this.phaseTimer += deltaTime;

    // Phase transition
    if (this.isInvisible) {
      this.speed = this.baseSpeed * 2.5;  // faster while invisible
      if (this.phaseTimer >= this.invisibleDuration) {
        this.isInvisible = false;
        this.phaseTimer = 0;
      }
    } else {
      this.speed = this.baseSpeed;
      if (this.phaseTimer >= this.visibleDuration) {
        this.isInvisible = true;
        this.phaseTimer = 0;
      }

      // Shoot homing projectiles when visible
      this.shootTimer += deltaTime;
      if (this.shootTimer >= this.shootCooldown) {
        this.shootTimer = 0;
        const toPlayer = this.playerPosition.subtract(this.position).normalize();
        // Fire 2 projectiles with slight spread
        for (let i = -1; i <= 1; i += 2) {
          const dir = toPlayer.rotate(i * 0.2);
          EventBus.getInstance().emit(GameEvent.ENEMY_SHOOT, {
            x: this.position.x + dir.x * (this.size + 8),
            y: this.position.y + dir.y * (this.size + 8),
            dirX: dir.x,
            dirY: dir.y,
            speed: 200,
            damage: 15,
          });
        }
      }
    }

    super.update(deltaTime);

    // Ghost trail
    this.trailPositions.push({
      x: this.position.x,
      y: this.position.y,
      alpha: this.isInvisible ? 0.15 : 0.4,
    });
    if (this.trailPositions.length > 12) this.trailPositions.shift();
    this.trailPositions.forEach(t => { t.alpha *= 0.95; });

    this.emitHealthUpdate();
  }

  private emitHealthUpdate(): void {
    EventBus.getInstance().emit(GameEvent.BOSS_HEALTH_CHANGED, {
      name: 'PHANTOM',
      health: this.health,
      maxHealth: this.maxHealth,
      color: '#7e57c2',
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const alpha = this.isInvisible ? 0.15 : 1.0;

    // Ghost trail
    for (const t of this.trailPositions) {
      if (t.alpha <= 0.02) continue;
      ctx.globalAlpha = t.alpha * 0.3;
      ctx.fillStyle = '#b39ddb';
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = alpha;

    // Ethereal aura
    const auraSize = this.size * 3 + Math.sin(this.ghostPhase * 1.5) * 8;
    const aura = ctx.createRadialGradient(x, y, this.size * 0.5, x, y, auraSize);
    aura.addColorStop(0, 'rgba(126, 87, 194, 0.2)');
    aura.addColorStop(0.5, 'rgba(94, 53, 177, 0.08)');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x, y + this.size, this.size * 1.2, this.size * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body — ghostly body
    const bodyGrad = ctx.createRadialGradient(x, y - 4, 0, x, y, this.size);
    bodyGrad.addColorStop(0, '#d1c4e9');
    bodyGrad.addColorStop(0.5, '#7e57c2');
    bodyGrad.addColorStop(1, '#4527a0');
    ctx.fillStyle = this.hitFlashTimer > 0 ? '#ffffff' : bodyGrad;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Wispy tendrils at bottom
    for (let i = 0; i < 5; i++) {
      const tendrilAngle = Math.PI / 2 + (i - 2) * 0.3;
      const wobble = Math.sin(this.ghostPhase * 2 + i) * 6;
      const tx = x + Math.cos(tendrilAngle) * (this.size + 5) + wobble;
      const ty = y + Math.sin(tendrilAngle) * (this.size + 8);

      ctx.strokeStyle = `rgba(209, 196, 233, ${0.4 - i * 0.06})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(tendrilAngle) * this.size * 0.5, y + Math.sin(tendrilAngle) * this.size * 0.5);
      ctx.quadraticCurveTo(
        tx + wobble * 0.5, ty - 5,
        tx, ty + 5,
      );
      ctx.stroke();
    }

    // Eyes — glowing purple cyan
    const eyeGlow = this.isInvisible ? '#b388ff' : '#ea80fc';
    ctx.fillStyle = eyeGlow;
    ctx.shadowColor = eyeGlow;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x - 8, y - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 8, y - 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // Eye pupils
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - 8, y - 4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 8, y - 4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Phase indicator
    if (this.isInvisible) {
      ctx.strokeStyle = 'rgba(179, 157, 219, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, this.size + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Health bar
    if (this.health < this.maxHealth) {
      const barW = this.size * 2.5;
      const barH = 5;
      const barX = x - barW / 2;
      const barY = y - this.size - 16;
      const pct = this.health / this.maxHealth;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#b39ddb';
      ctx.fillRect(barX, barY, barW * pct, barH);
    }

    ctx.globalAlpha = 1;
  }
}
