// ============================================================
// BossTroopUndead.ts — Necromancer's special boss troop
// Low HP shambling undead with eerie green glow
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';

export class BossTroopUndead extends Enemy {
  private glowPhase: number;

  constructor(x: number, y: number, healthMultiplier: number, speedMultiplier: number) {
    super(
      x, y,
      11,                            // slightly small
      20 * healthMultiplier,         // low HP — swarm unit
      65 * speedMultiplier,          // moderate speed
      8,                             // low damage
      15,                            // low score
    );
    this.glowPhase = Math.random() * Math.PI * 2;
  }

  getColor(): string { return '#558b2f'; }
  protected getGlowColor(): string { return 'rgba(85, 139, 47, 0.3)'; }
  getType(): ZombieType { return ZombieType.BOSS_TROOP_UNDEAD; }

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.glowPhase += deltaTime * 3;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Eerie green aura
    const auraSize = this.size * 1.8 + Math.sin(this.glowPhase) * 3;
    const aura = ctx.createRadialGradient(x, y, 0, x, y, auraSize);
    aura.addColorStop(0, 'rgba(76, 175, 80, 0.12)');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();

    // Call base render for body, eyes, health bar
    super.render(ctx);

    // Bone fragments sticking out
    ctx.strokeStyle = '#e8e8e0';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const angle = this.glowPhase * 0.2 + (i / 3) * Math.PI * 2;
      const bx = x + Math.cos(angle) * this.size * 0.7;
      const by = y + Math.sin(angle) * this.size * 0.7;
      const ex = x + Math.cos(angle) * (this.size + 5);
      const ey = y + Math.sin(angle) * (this.size + 5);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }
}
