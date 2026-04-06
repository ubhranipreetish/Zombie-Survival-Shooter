// ============================================================
// Particle.ts — Single visual particle for effects
// ============================================================

/**
 * A single particle with position, velocity, color, and lifetime.
 * Used for death effects, bullet impacts, blood splatter, etc.
 */
export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  lifetime: number;
  maxLifetime: number;
  alpha: number;
  friction: number;

  constructor(
    x: number, y: number,
    vx: number, vy: number,
    color: string,
    size: number,
    lifetime: number,
  ) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLifetime = lifetime;
    this.lifetime = lifetime;
    this.alpha = 1;
    this.friction = 0.98;
  }

  update(deltaTime: number): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.lifetime -= deltaTime;
    this.alpha = Math.max(0, this.lifetime / this.maxLifetime);
    this.size *= 0.995;
  }

  isAlive(): boolean {
    return this.lifetime > 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
