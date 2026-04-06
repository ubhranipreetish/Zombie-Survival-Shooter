// ============================================================
// EnemyBullet.ts — Projectile fired by ShooterZombie
// Separate from player bullets for collision handling
// ============================================================

import { GameObject } from './GameObject';
import { Vector2D } from '../utils/Vector2D';

/**
 * A bullet fired by a ShooterZombie at the player.
 * Different color and behavior from player bullets.
 */
export class EnemyBullet extends GameObject {
  private direction: Vector2D;
  private speed: number;
  private damage: number;
  private lifetime: number;

  constructor(
    x: number, y: number,
    dirX: number, dirY: number,
    speed: number,
    damage: number,
  ) {
    super(x, y, 4);
    this.direction = new Vector2D(dirX, dirY).normalize();
    this.speed = speed;
    this.damage = damage;
    this.lifetime = 0;
  }

  getDamage(): number {
    return this.damage;
  }

  update(deltaTime: number): void {
    const moveAmount = this.direction.scale(this.speed * deltaTime);
    this.position = this.position.add(moveAmount);
    this.lifetime += deltaTime;
    if (this.lifetime > 3.0) this.destroy();
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.size * 3);
    gradient.addColorStop(0, '#b388ff');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, this.size * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = '#e040fb';
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, this.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  isOffScreen(w: number, h: number): boolean {
    const m = 50;
    return this.position.x < -m || this.position.x > w + m ||
           this.position.y < -m || this.position.y > h + m;
  }
}
