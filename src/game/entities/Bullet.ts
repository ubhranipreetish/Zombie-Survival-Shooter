// ============================================================
// Bullet.ts — Projectile fired by weapons
// Extends GameObject. Does NOT implement IDamageable — bullets
// don't have health (Interface Segregation).
// ============================================================

import { GameObject } from './GameObject';
import { Vector2D } from '../utils/Vector2D';

/**
 * A projectile that travels in a straight line and deals damage.
 * Created by weapon strategies, destroyed on collision or leaving canvas.
 */
export class Bullet extends GameObject {
  private direction: Vector2D;
  private speed: number;
  private damage: number;
  private color: string;
  private lifetime: number;      // seconds before auto-destroy
  private maxLifetime: number;
  private trail: { x: number; y: number; alpha: number }[];

  constructor(
    x: number, y: number,
    dirX: number, dirY: number,
    speed: number,
    damage: number,
    size: number = 3,
    color: string = '#ffdd00',
  ) {
    super(x, y, size);
    this.direction = new Vector2D(dirX, dirY).normalize();
    this.speed = speed;
    this.damage = damage;
    this.color = color;
    this.maxLifetime = 2.0;
    this.lifetime = 0;
    this.trail = [];
  }

  getDamage(): number {
    return this.damage;
  }

  update(deltaTime: number): void {
    // Store trail position
    this.trail.push({
      x: this.position.x,
      y: this.position.y,
      alpha: 1.0,
    });

    // Keep trail length short
    if (this.trail.length > 6) {
      this.trail.shift();
    }

    // Fade trail
    this.trail.forEach((t) => {
      t.alpha -= deltaTime * 4;
    });

    // Move bullet
    const moveAmount = this.direction.scale(this.speed * deltaTime);
    this.position = this.position.add(moveAmount);

    // Track lifetime
    this.lifetime += deltaTime;
    if (this.lifetime >= this.maxLifetime) {
      this.destroy();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Draw trail
    this.trail.forEach((t) => {
      if (t.alpha <= 0) return;
      ctx.globalAlpha = t.alpha * 0.4;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    // Draw bullet glow
    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, this.size * 3,
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw bullet core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Check if bullet is off-screen */
  isOffScreen(canvasWidth: number, canvasHeight: number): boolean {
    const margin = 100;
    return (
      this.position.x < -margin ||
      this.position.x > canvasWidth + margin ||
      this.position.y < -margin ||
      this.position.y > canvasHeight + margin
    );
  }
}
