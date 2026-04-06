// ============================================================
// Player.ts — The player character
// Strategy Pattern (weapon swapping) + power-up card effects
// Legendary cards modify visual appearance (double gun, etc.)
// ============================================================

import { GameObject } from './GameObject';
import { IDamageable } from '../interfaces/IDamageable';
import { IWeaponStrategy, BulletConfig } from '../interfaces/IWeaponStrategy';
import { Vector2D } from '../utils/Vector2D';
import { clamp } from '../utils/MathUtils';
import { EventBus } from '../events/EventBus';
import { GameEvent, CardEffectType, PowerUpCard } from '../interfaces/types';

/**
 * The player character with power-up card integration.
 * Legendary cards visually modify the player model.
 */
export class Player extends GameObject implements IDamageable {
  private health: number;
  private maxHealth: number;
  private weapon: IWeaponStrategy;
  private aimAngle: number;
  private moveSpeed: number;
  private baseMoveSpeed: number;
  private lastFireTime: number;
  private invincibilityTimer: number;
  private ammo: Map<string, number>;
  private canvasWidth: number;
  private canvasHeight: number;

  // Input state
  private moveDirection: Vector2D;
  private mousePosition: Vector2D;
  private isFiring: boolean;

  // Card effect modifiers
  private damageMultiplier: number;
  private fireRateMultiplier: number;
  private hasDoubleGun: boolean;
  private hasPiercingBullets: boolean;
  private hasExplosiveBullets: boolean;
  private bulletStormCount: number;
  private lifestealPercent: number;
  private hasShieldAura: boolean;
  private shieldCooldown: number;
  private shieldTimer: number;
  private hasFreezeAura: boolean;
  private freezeRadius: number;
  private freezeStrength: number;
  private hasAutoExplosion: boolean;
  private autoExplosionTimer: number;
  private autoExplosionDamage: number;
  private hasOrbitalDrones: boolean;
  private droneCount: number;
  private droneAngle: number;

  constructor(
    x: number,
    y: number,
    initialWeapon: IWeaponStrategy,
    canvasWidth: number,
    canvasHeight: number,
  ) {
    super(x, y, 18);
    this.health = 100;
    this.maxHealth = 100;
    this.weapon = initialWeapon;
    this.aimAngle = 0;
    this.baseMoveSpeed = 200;
    this.moveSpeed = 200;
    this.lastFireTime = 0;
    this.invincibilityTimer = 0;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.moveDirection = Vector2D.zero();
    this.mousePosition = new Vector2D(x, y);
    this.isFiring = false;

    // Ammo
    this.ammo = new Map();
    this.ammo.set('Pistol', Infinity);
    this.ammo.set('Shotgun', 20);
    this.ammo.set('Rifle', 60);

    // Card effects — all start at base values
    this.damageMultiplier = 1;
    this.fireRateMultiplier = 1;
    this.hasDoubleGun = false;
    this.hasPiercingBullets = false;
    this.hasExplosiveBullets = false;
    this.bulletStormCount = 1;
    this.lifestealPercent = 0;
    this.hasShieldAura = false;
    this.shieldCooldown = 8;
    this.shieldTimer = 0;
    this.hasFreezeAura = false;
    this.freezeRadius = 120;
    this.freezeStrength = 0;
    this.hasAutoExplosion = false;
    this.autoExplosionTimer = 0;
    this.autoExplosionDamage = 0;
    this.hasOrbitalDrones = false;
    this.droneCount = 0;
    this.droneAngle = 0;
  }

  // ----- IDamageable -----

  takeDamage(amount: number): void {
    if (this.invincibilityTimer > 0) return;

    // Shield aura blocks one hit
    if (this.hasShieldAura && this.shieldTimer <= 0) {
      this.shieldTimer = this.shieldCooldown;
      // Shield absorbs the hit
      return;
    }

    this.health -= amount;
    this.invincibilityTimer = 0.5;

    if (this.health <= 0) {
      this.health = 0;
      this.destroy();
    }

    EventBus.getInstance().emit(GameEvent.PLAYER_HEALTH_CHANGED, {
      health: this.health,
      maxHealth: this.maxHealth,
    });
  }

  isAlive(): boolean {
    return this.health > 0;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  // ----- Weapon (Strategy Pattern) -----

  setWeapon(weapon: IWeaponStrategy): void {
    this.weapon = weapon;
    EventBus.getInstance().emit(GameEvent.WEAPON_CHANGED, {
      name: weapon.name,
      color: weapon.color,
    });
    EventBus.getInstance().emit(GameEvent.AMMO_CHANGED, {
      ammo: this.getAmmo(),
      maxAmmo: weapon.maxAmmo,
      weaponName: weapon.name,
    });
  }

  getWeapon(): IWeaponStrategy {
    return this.weapon;
  }

  getAmmo(): number {
    return this.ammo.get(this.weapon.name) ?? 0;
  }

  addAmmo(weaponName: string, amount: number): void {
    const current = this.ammo.get(weaponName) ?? 0;
    if (current === Infinity) return;
    this.ammo.set(weaponName, current + amount);
  }

  // ----- Input Setters -----

  setMoveDirection(dir: Vector2D): void {
    this.moveDirection = dir;
  }

  setMousePosition(pos: Vector2D): void {
    this.mousePosition = pos;
  }

  setFiring(firing: boolean): void {
    this.isFiring = firing;
  }

  // ----- Healing -----

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    EventBus.getInstance().emit(GameEvent.PLAYER_HEALTH_CHANGED, {
      health: this.health,
      maxHealth: this.maxHealth,
    });
  }

  // ----- Card Effect System -----

  /**
   * Apply a power-up card effect to the player.
   * This is where card effects actually modify gameplay.
   */
  applyCard(card: PowerUpCard): void {
    switch (card.effectType) {
      case CardEffectType.HEAL:
        this.heal(card.value);
        break;

      case CardEffectType.AMMO_REFILL:
        this.ammo.set('Shotgun', 30);
        this.ammo.set('Rifle', 90);
        break;

      case CardEffectType.SPEED_BOOST:
        this.moveSpeed = this.baseMoveSpeed * (1 + card.value);
        this.baseMoveSpeed = this.moveSpeed;
        break;

      case CardEffectType.MAX_HEALTH_UP:
        this.maxHealth += card.value;
        this.health += card.value; // Also heal
        EventBus.getInstance().emit(GameEvent.PLAYER_HEALTH_CHANGED, {
          health: this.health,
          maxHealth: this.maxHealth,
        });
        break;

      case CardEffectType.DAMAGE_BOOST:
        this.damageMultiplier += card.value;
        break;

      case CardEffectType.FIRE_RATE_BOOST:
        this.fireRateMultiplier += card.value;
        break;

      case CardEffectType.PIERCING_BULLETS:
        this.hasPiercingBullets = true;
        break;

      case CardEffectType.LIFESTEAL:
        this.lifestealPercent += card.value;
        break;

      case CardEffectType.EXPLOSIVE_BULLETS:
        this.hasExplosiveBullets = true;
        break;

      case CardEffectType.BULLET_STORM:
        this.bulletStormCount = card.value;
        break;

      case CardEffectType.SHIELD_AURA:
        this.hasShieldAura = true;
        this.shieldTimer = 0;
        break;

      case CardEffectType.FREEZE_AURA:
        this.hasFreezeAura = true;
        this.freezeStrength = card.value;
        break;

      // Legendary — modify character model
      case CardEffectType.DOUBLE_GUN:
        this.hasDoubleGun = true;
        break;

      case CardEffectType.AUTO_EXPLOSION:
        this.hasAutoExplosion = true;
        this.autoExplosionDamage = card.value;
        this.autoExplosionTimer = 0;
        break;

      case CardEffectType.ORBITAL_DRONES:
        this.hasOrbitalDrones = true;
        this.droneCount = card.value;
        break;
    }
  }

  // ----- Effect Getters -----

  getDamageMultiplier(): number {
    return this.damageMultiplier;
  }

  getHasPiercing(): boolean {
    return this.hasPiercingBullets;
  }

  getHasExplosive(): boolean {
    return this.hasExplosiveBullets;
  }

  getLifestealPercent(): number {
    return this.lifestealPercent;
  }

  getHasFreezeAura(): boolean {
    return this.hasFreezeAura;
  }

  getFreezeRadius(): number {
    return this.freezeRadius;
  }

  getFreezeStrength(): number {
    return this.freezeStrength;
  }

  getHasOrbitalDrones(): boolean {
    return this.hasOrbitalDrones;
  }

  getDroneCount(): number {
    return this.droneCount;
  }

  getDroneAngle(): number {
    return this.droneAngle;
  }

  // ----- Firing -----

  tryFire(currentTime: number): BulletConfig[] | null {
    if (!this.isFiring) return null;

    const effectiveFireInterval = this.weapon.getFireInterval() / this.fireRateMultiplier;
    const timeSinceLastFire = currentTime - this.lastFireTime;
    if (timeSinceLastFire < effectiveFireInterval) return null;

    const currentAmmo = this.ammo.get(this.weapon.name) ?? 0;
    if (currentAmmo <= 0) return null;

    if (currentAmmo !== Infinity) {
      this.ammo.set(this.weapon.name, currentAmmo - 1);
      EventBus.getInstance().emit(GameEvent.AMMO_CHANGED, {
        ammo: this.ammo.get(this.weapon.name),
        maxAmmo: this.weapon.maxAmmo,
        weaponName: this.weapon.name,
      });
    }

    this.lastFireTime = currentTime;

    const aimDir = Vector2D.fromAngle(this.aimAngle);
    let bullets = this.weapon.fire(this.position, aimDir);

    // Apply damage multiplier
    bullets = bullets.map((b) => ({
      ...b,
      damage: b.damage * this.damageMultiplier,
    }));

    // Double Gun — fire a second set from offset position
    if (this.hasDoubleGun) {
      const perpendicular = new Vector2D(-aimDir.y, aimDir.x);
      const offset = perpendicular.scale(12);
      const secondBullets = this.weapon.fire(
        this.position.add(offset),
        aimDir,
      ).map((b) => ({
        ...b,
        damage: b.damage * this.damageMultiplier,
        x: b.x + offset.x,
        y: b.y + offset.y,
      }));
      bullets = [...bullets, ...secondBullets];
    }

    // Bullet Storm — fire extra copies at slight angles
    if (this.bulletStormCount > 1) {
      const extraBullets: BulletConfig[] = [];
      for (let i = 1; i < this.bulletStormCount; i++) {
        const angleOffset = (i * 0.15) * (i % 2 === 0 ? 1 : -1);
        const stormDir = aimDir.rotate(angleOffset);
        const stormBullets = this.weapon.fire(this.position, stormDir).map((b) => ({
          ...b,
          damage: b.damage * this.damageMultiplier * 0.6,
        }));
        extraBullets.push(...stormBullets);
      }
      bullets = [...bullets, ...extraBullets];
    }

    return bullets;
  }

  // ----- Update -----

  update(deltaTime: number): void {
    this.aimAngle = this.position.angleTo(this.mousePosition);

    // Movement
    if (this.moveDirection.magnitude() > 0) {
      const normalizedDir = this.moveDirection.normalize();
      const moveAmount = normalizedDir.scale(this.moveSpeed * deltaTime);
      this.position = this.position.add(moveAmount);
    }

    // Clamp to canvas
    const margin = this.size;
    this.position = new Vector2D(
      clamp(this.position.x, margin, this.canvasWidth - margin),
      clamp(this.position.y, margin, this.canvasHeight - margin),
    );

    // Invincibility
    if (this.invincibilityTimer > 0) {
      this.invincibilityTimer -= deltaTime;
    }

    // Shield cooldown
    if (this.hasShieldAura && this.shieldTimer > 0) {
      this.shieldTimer -= deltaTime;
    }

    // Auto explosion timer
    if (this.hasAutoExplosion) {
      this.autoExplosionTimer += deltaTime;
    }

    // Drone rotation
    if (this.hasOrbitalDrones) {
      this.droneAngle += deltaTime * 2.5;
    }
  }

  /**
   * Check and consume auto explosion.
   * Returns damage if ready, 0 otherwise.
   */
  consumeAutoExplosion(): number {
    if (!this.hasAutoExplosion) return 0;
    if (this.autoExplosionTimer >= 5.0) {
      this.autoExplosionTimer = 0;
      return this.autoExplosionDamage;
    }
    return 0;
  }

  // ----- Render -----

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;

    // Invincibility flash
    if (this.invincibilityTimer > 0 && Math.floor(this.invincibilityTimer * 10) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Freeze aura
    if (this.hasFreezeAura) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.freezeRadius);
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.05)');
      gradient.addColorStop(0.7, 'rgba(100, 200, 255, 0.03)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, this.freezeRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(100, 200, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(x, y, this.freezeRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Auto explosion charging indicator
    if (this.hasAutoExplosion) {
      const chargePercent = Math.min(1, this.autoExplosionTimer / 5.0);
      ctx.strokeStyle = `rgba(255, 100, 0, ${chargePercent * 0.5})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, this.size + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * chargePercent);
      ctx.stroke();

      if (chargePercent > 0.8) {
        const pulseSize = 1 + Math.sin(Date.now() * 0.01) * 0.1;
        ctx.strokeStyle = `rgba(255, 50, 0, ${(chargePercent - 0.8) * 2.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, (this.size + 12) * pulseSize, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + this.size * 0.7, this.size * 0.8, this.size * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shield aura visual
    if (this.hasShieldAura) {
      const shieldReady = this.shieldTimer <= 0;
      ctx.strokeStyle = shieldReady
        ? 'rgba(0, 229, 255, 0.5)'
        : 'rgba(0, 229, 255, 0.15)';
      ctx.lineWidth = shieldReady ? 3 : 1;
      ctx.beginPath();
      ctx.arc(x, y, this.size + 5, 0, Math.PI * 2);
      ctx.stroke();

      if (shieldReady) {
        const shieldGlow = ctx.createRadialGradient(x, y, this.size, x, y, this.size + 10);
        shieldGlow.addColorStop(0, 'rgba(0, 229, 255, 0.1)');
        shieldGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = shieldGlow;
        ctx.beginPath();
        ctx.arc(x, y, this.size + 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Body glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, this.size * 2);
    glow.addColorStop(0, 'rgba(0, 180, 255, 0.15)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, this.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Main body
    const bodyGradient = ctx.createRadialGradient(
      x - this.size * 0.3, y - this.size * 0.3, 0,
      x, y, this.size,
    );
    bodyGradient.addColorStop(0, '#4fc3f7');
    bodyGradient.addColorStop(1, '#0277bd');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#01579b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, this.size, 0, Math.PI * 2);
    ctx.stroke();

    // Gun barrel(s)
    const barrelLength = this.size + 12;

    if (this.hasDoubleGun) {
      // Double gun — two barrels offset to either side
      const perpDir = new Vector2D(-Math.sin(this.aimAngle), Math.cos(this.aimAngle));
      const offset = 6;

      for (const side of [-1, 1]) {
        const bx = x + perpDir.x * offset * side;
        const by = y + perpDir.y * offset * side;
        const endX = bx + Math.cos(this.aimAngle) * barrelLength;
        const endY = by + Math.sin(this.aimAngle) * barrelLength;

        ctx.strokeStyle = '#ffab40';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(
          bx + Math.cos(this.aimAngle) * this.size * 0.3,
          by + Math.sin(this.aimAngle) * this.size * 0.3,
        );
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.fillStyle = '#ff6d00';
        ctx.beginPath();
        ctx.arc(endX, endY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Single barrel
      const barrelEndX = x + Math.cos(this.aimAngle) * barrelLength;
      const barrelEndY = y + Math.sin(this.aimAngle) * barrelLength;

      ctx.strokeStyle = '#b0bec5';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(
        x + Math.cos(this.aimAngle) * this.size * 0.5,
        y + Math.sin(this.aimAngle) * this.size * 0.5,
      );
      ctx.lineTo(barrelEndX, barrelEndY);
      ctx.stroke();

      ctx.fillStyle = '#78909c';
      ctx.beginPath();
      ctx.arc(barrelEndX, barrelEndY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Orbital drones
    if (this.hasOrbitalDrones) {
      const droneRadius = this.size * 2.5;
      for (let i = 0; i < this.droneCount; i++) {
        const angle = this.droneAngle + (i / this.droneCount) * Math.PI * 2;
        const dx = x + Math.cos(angle) * droneRadius;
        const dy = y + Math.sin(angle) * droneRadius;

        // Drone glow
        const droneGlow = ctx.createRadialGradient(dx, dy, 0, dx, dy, 8);
        droneGlow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        droneGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = droneGlow;
        ctx.beginPath();
        ctx.arc(dx, dy, 8, 0, Math.PI * 2);
        ctx.fill();

        // Drone body
        ctx.fillStyle = '#ffd600';
        ctx.beginPath();
        ctx.arc(dx, dy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff9c4';
        ctx.beginPath();
        ctx.arc(dx, dy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  }

  updateCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
}
