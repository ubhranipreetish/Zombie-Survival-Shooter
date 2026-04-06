// ============================================================
// PowerUp.ts — Collectible items that spawn between waves
// Extends GameObject but does NOT implement IDamageable
// (Interface Segregation — power-ups can't take damage)
// ============================================================

import { GameObject } from './GameObject';
import { PowerUpType } from '../interfaces/types';

/**
 * A collectible power-up that grants the player health or ammo.
 * Spawns between waves and pulses to attract attention.
 */
export class PowerUp extends GameObject {
  private type: PowerUpType;
  private value: number;         // amount of health/ammo to grant
  private lifetime: number;      // auto-despawn timer
  private maxLifetime: number;
  private pulsePhase: number;

  constructor(x: number, y: number, type: PowerUpType, value: number) {
    super(x, y, 14);
    this.type = type;
    this.value = value;
    this.maxLifetime = 10;       // despawn after 10 seconds
    this.lifetime = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  getType(): PowerUpType {
    return this.type;
  }

  getValue(): number {
    return this.value;
  }

  update(deltaTime: number): void {
    this.lifetime += deltaTime;
    if (this.lifetime >= this.maxLifetime) {
      this.destroy();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const pulse = 1 + Math.sin(Date.now() * 0.005 + this.pulsePhase) * 0.15;
    const currentSize = this.size * pulse;

    // Fading warning when about to despawn
    const remainingLife = this.maxLifetime - this.lifetime;
    if (remainingLife < 3) {
      ctx.globalAlpha = 0.3 + (Math.sin(Date.now() * 0.01) * 0.5 + 0.5) * 0.7;
    }

    // Glow
    const glowColor = this.type === PowerUpType.HEALTH
      ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 193, 7, 0.3)';
    const glow = ctx.createRadialGradient(x, y, 0, x, y, currentSize * 2);
    glow.addColorStop(0, glowColor);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, currentSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Background circle
    const bgColor = this.type === PowerUpType.HEALTH ? '#2e7d32' : '#f57f17';
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(x, y, currentSize, 0, Math.PI * 2);
    ctx.fill();

    // Border
    const borderColor = this.type === PowerUpType.HEALTH ? '#66bb6a' : '#ffca28';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, currentSize, 0, Math.PI * 2);
    ctx.stroke();

    // Icon
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(currentSize)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.type === PowerUpType.HEALTH ? '+' : '•',
      x,
      y + 1,
    );

    ctx.globalAlpha = 1;
  }
}
