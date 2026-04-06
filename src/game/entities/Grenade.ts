// ============================================================
// Grenade.ts — Projectile that flies to target and explodes
// Used by the Grenade ability (spacebar after first boss)
// ============================================================

import { GameObject } from './GameObject';
import { Vector2D } from '../utils/Vector2D';

export class Grenade extends GameObject {
  private targetPos: Vector2D;
  private startPos: Vector2D;
  private flightTime: number = 0;
  private maxFlightTime: number;
  private hasExploded: boolean = false;
  private explosionDamage: number;
  private explosionRadius: number;
  private trail: { x: number; y: number; alpha: number }[];
  private spinAngle: number = 0;

  constructor(
    startX: number, startY: number,
    targetX: number, targetY: number,
    damage: number, radius: number,
  ) {
    super(startX, startY, 6);
    this.startPos = new Vector2D(startX, startY);
    this.targetPos = new Vector2D(targetX, targetY);
    this.explosionDamage = damage;
    this.explosionRadius = radius;
    this.trail = [];

    // Flight time based on distance (min 0.3s, max 0.6s)
    const dist = this.startPos.distanceTo(this.targetPos);
    this.maxFlightTime = Math.min(0.6, Math.max(0.3, dist / 800));
  }

  getExplosionDamage(): number { return this.explosionDamage; }
  getExplosionRadius(): number { return this.explosionRadius; }
  hasReachedTarget(): boolean { return this.flightTime >= this.maxFlightTime; }
  didExplode(): boolean { return this.hasExploded; }
  markExploded(): void { this.hasExploded = true; this.destroy(); }

  update(deltaTime: number): void {
    this.flightTime += deltaTime;
    this.spinAngle += deltaTime * 12;

    // Store trail
    this.trail.push({
      x: this.position.x,
      y: this.position.y,
      alpha: 1.0,
    });
    if (this.trail.length > 10) this.trail.shift();
    this.trail.forEach(t => { t.alpha -= deltaTime * 3; });

    // Interpolate position with arc
    const t = Math.min(1, this.flightTime / this.maxFlightTime);
    const x = this.startPos.x + (this.targetPos.x - this.startPos.x) * t;
    const y = this.startPos.y + (this.targetPos.y - this.startPos.y) * t;
    // Add arc height
    const arcHeight = -120 * Math.sin(t * Math.PI);
    this.position = new Vector2D(x, y + arcHeight);

    if (t >= 1 && !this.hasExploded) {
      this.position = this.targetPos;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Trail
    for (const t of this.trail) {
      if (t.alpha <= 0) continue;
      ctx.globalAlpha = t.alpha * 0.5;
      ctx.fillStyle = '#ff8c00';
      ctx.beginPath();
      ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const x = this.position.x;
    const y = this.position.y;

    // Grenade glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 16);
    glow.addColorStop(0, 'rgba(255, 140, 0, 0.4)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.spinAngle);

    // Main body
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Cross mark
    ctx.strokeStyle = '#ff6f00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(3, 0);
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 3);
    ctx.stroke();

    ctx.restore();

    // Fuse spark
    const sparkX = x + Math.cos(this.spinAngle * 2) * 4;
    const sparkY = y - this.size - 2 + Math.sin(this.spinAngle * 3) * 2;
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
