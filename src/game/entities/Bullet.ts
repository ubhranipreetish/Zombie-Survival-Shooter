// ============================================================
// Bullet.ts — Projectile fired by weapons
// Extends GameObject. Does NOT implement IDamageable — bullets
// don't have health (Interface Segregation).
// ============================================================

import { GameObject } from './GameObject';
import { Vector2D } from '../utils/Vector2D';

import { Enemy } from './Enemy';

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
  private hitEnemies: Set<Enemy>; // track enemies hit for pierce logic
  private totalHits: number;      // track total hits across frames
  private bouncesRemaining: number;  // bouncing bullets ability
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(
    x: number, y: number,
    dirX: number, dirY: number,
    speed: number,
    damage: number,
    size: number = 3,
    color: string = '#ffdd00',
    bounces: number = 0,
    canvasWidth: number = 1920,
    canvasHeight: number = 1080,
  ) {
    super(x, y, size);
    this.direction = new Vector2D(dirX, dirY).normalize();
    this.speed = speed;
    this.damage = damage;
    this.color = color;
    this.maxLifetime = bounces > 0 ? 4.0 : 2.0; // bouncing bullets live longer
    this.lifetime = 0;
    this.trail = [];
    this.hitEnemies = new Set();
    this.totalHits = 0;
    this.bouncesRemaining = bounces;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  hasHit(enemy: Enemy): boolean {
    return this.hitEnemies.has(enemy);
  }

  addHit(enemy: Enemy): void {
    this.hitEnemies.add(enemy);
    this.totalHits++;
  }

  getHitCount(): number {
    return this.totalHits;
  }

  getDamage(): number {
    return this.damage;
  }

  setBouncing(bounces: number, canvasW: number, canvasH: number): void {
    this.bouncesRemaining = bounces;
    this.canvasWidth = canvasW;
    this.canvasHeight = canvasH;
    this.maxLifetime = 4.0;
  }

  isBouncing(): boolean { return this.bouncesRemaining > 0; }

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

    // Bounce off canvas edges
    if (this.bouncesRemaining > 0) {
      let dx = this.direction.x;
      let dy = this.direction.y;
      let bounced = false;
      if (this.position.x < 0 || this.position.x > this.canvasWidth) {
        dx = -dx;
        bounced = true;
      }
      if (this.position.y < 0 || this.position.y > this.canvasHeight) {
        dy = -dy;
        bounced = true;
      }
      if (bounced) {
        this.direction = new Vector2D(dx, dy).normalize();
        this.bouncesRemaining--;
        // Clear hit enemies on bounce so it can re-hit
        this.hitEnemies.clear();
      }
    }

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

  /** Check if bullet is off-screen — never offscreen while bouncing */
  isOffScreen(canvasWidth: number, canvasHeight: number): boolean {
    if (this.bouncesRemaining > 0) return false;
    const margin = 100;
    return (
      this.position.x < -margin ||
      this.position.x > canvasWidth + margin ||
      this.position.y < -margin ||
      this.position.y > canvasHeight + margin
    );
  }
}
