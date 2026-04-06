// ============================================================
// PowerUp.ts — Collectible items that spawn between waves
// or drop from killed enemies (ammo boxes)
// Extends GameObject but does NOT implement IDamageable
// (Interface Segregation — power-ups can't take damage)
// ============================================================

import { GameObject } from './GameObject';
import { PowerUpType } from '../interfaces/types';

/**
 * A collectible power-up that grants the player health or ammo.
 * Health: green circle with '+' icon (spawns between waves)
 * Ammo:   golden box shape with ammo icon (drops from enemies)
 */
export class PowerUp extends GameObject {
  private type: PowerUpType;
  private value: number;         // amount of health/ammo to grant
  private lifetime: number;      // auto-despawn timer
  private maxLifetime: number;
  private pulsePhase: number;

  constructor(x: number, y: number, type: PowerUpType, value: number) {
    super(x, y, (type === PowerUpType.AMMO_SHOTGUN || type === PowerUpType.AMMO_RIFLE) ? 16 : 14);
    this.type = type;
    this.value = value;
    this.maxLifetime = (type === PowerUpType.AMMO_SHOTGUN || type === PowerUpType.AMMO_RIFLE) ? 20 : 10; // ammo lasts longer
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

    if (this.type === PowerUpType.AMMO_SHOTGUN || this.type === PowerUpType.AMMO_RIFLE) {
      this.renderAmmoBox(ctx, x, y, currentSize, this.type === PowerUpType.AMMO_SHOTGUN);
    } else {
      this.renderHealthOrb(ctx, x, y, currentSize);
    }

    ctx.globalAlpha = 1;
  }

  private renderAmmoBox(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, isShotgun: boolean): void {
    const halfW = size * 1.1;
    const halfH = size * 0.85;

    // Outer glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
    if (isShotgun) {
      glow.addColorStop(0, 'rgba(255, 87, 34, 0.4)');
      glow.addColorStop(0.5, 'rgba(244, 67, 54, 0.15)');
    } else {
      glow.addColorStop(0, 'rgba(156, 39, 176, 0.4)');
      glow.addColorStop(0.5, 'rgba(103, 58, 183, 0.15)');
    }
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Box shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(x - halfW + 2, y - halfH + 3, halfW * 2, halfH * 2, 3);
    ctx.fill();

    // Box body — distinct color per ammo type
    const boxGrad = ctx.createLinearGradient(x, y - halfH, x, y + halfH);
    if (isShotgun) {
      boxGrad.addColorStop(0, '#8e4a3b');
      boxGrad.addColorStop(0.5, '#7a3520');
      boxGrad.addColorStop(1, '#5a2415');
    } else {
      boxGrad.addColorStop(0, '#5e3b8e');
      boxGrad.addColorStop(0.5, '#45207a');
      boxGrad.addColorStop(1, '#2e155a');
    }
    ctx.fillStyle = boxGrad;
    ctx.beginPath();
    ctx.roundRect(x - halfW, y - halfH, halfW * 2, halfH * 2, 3);
    ctx.fill();

    // Box border
    ctx.strokeStyle = isShotgun ? '#ff8a65' : '#ce93d8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - halfW, y - halfH, halfW * 2, halfH * 2, 3);
    ctx.stroke();

    // Ammo icon — bullet shapes
    const bulletColor = isShotgun ? '#ffab40' : '#b388ff';
    const bulletTip = isShotgun ? '#ff3d00' : '#7c4dff';
    ctx.fillStyle = bulletColor;
    const bulletW = 2.5;
    const bulletH = 7;
    for (let i = -1; i <= 1; i++) {
      const bx = x + i * 6;
      const by = y - 1;
      // Bullet casing
      ctx.fillStyle = bulletColor;
      ctx.fillRect(bx - bulletW / 2, by - bulletH / 2 + 2, bulletW, bulletH);
      // Bullet tip
      ctx.fillStyle = bulletTip;
      ctx.beginPath();
      ctx.arc(bx, by - bulletH / 2 + 2, bulletW / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // "AMMO" text above box
    ctx.fillStyle = bulletColor;
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('AMMO', x, y - halfH - 3);
  }

  private renderHealthOrb(ctx: CanvasRenderingContext2D, x: number, y: number, currentSize: number): void {
    // Glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, currentSize * 2);
    glow.addColorStop(0, 'rgba(76, 175, 80, 0.3)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, currentSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Background circle
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.arc(x, y, currentSize, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#66bb6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, currentSize, 0, Math.PI * 2);
    ctx.stroke();

    // Icon
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.floor(currentSize)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', x, y + 1);
  }
}
