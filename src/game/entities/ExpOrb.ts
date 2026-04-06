// ============================================================
// ExpOrb.ts — EXP orb dropped by enemies on death
// ============================================================

import { GameObject } from './GameObject';

export class ExpOrb extends GameObject {
  private expValue: number;
  private lifetime: number = 0;
  private maxLifetime: number = 24;
  private pulsePhase: number;

  constructor(x: number, y: number, expValue: number) {
    super(x, y, 8);
    this.expValue = expValue;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  getExpValue(): number { return this.expValue; }

  update(deltaTime: number): void {
    this.lifetime += deltaTime;
    if (this.lifetime >= this.maxLifetime) this.destroy();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const pulse = 1 + Math.sin(Date.now() * 0.006 + this.pulsePhase) * 0.2;
    const r = this.size * pulse;

    const remaining = this.maxLifetime - this.lifetime;
    if (remaining < 3) {
      ctx.globalAlpha = 0.3 + (Math.sin(Date.now() * 0.012) * 0.5 + 0.5) * 0.7;
    }

    // Glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
    glow.addColorStop(0, 'rgba(100, 220, 255, 0.4)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    grad.addColorStop(0, '#e0f7ff');
    grad.addColorStop(0.5, '#29b6f6');
    grad.addColorStop(1, '#0277bd');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}
