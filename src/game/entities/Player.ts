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

  // Card effect modifiers (now stackable/levels)
  private damageMultiplier: number;
  private fireRateMultiplier: number;
  private extraGunCount: number; // was hasDoubleGun
  private pierceCount: number; // was hasPiercingBullets
  private explosionLevel: number; // was hasExplosiveBullets
  private bulletStormCount: number;
  private lifestealPercent: number;
  private shieldLevel: number; // scales cooldown
  private shieldCooldown: number;
  private shieldTimer: number;
  private freezeLevel: number; // scales radius and strength
  private freezeRadius: number;
  private freezeStrength: number;
  private autoExplosionLevel: number; // scales damage
  private autoExplosionTimer: number;
  private autoExplosionDamage: number;
  private droneCount: number; // was hasOrbitalDrones
  private droneAngle: number;
  private critChance: number;     // critical hit chance (0–1)
  private magnetRadius: number;    // powerup attraction radius
  private flamethrowerUnlocked: boolean;
  private laserRifleUnlocked: boolean;
  private crossbowUnlocked: boolean;
  private postRoundHealBonus: number;  // extra % healed after each wave
  private postRoundAmmoBonus: number;  // extra % ammo added after each wave

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

    // Card effects — all start at base values (0 or 1)
    this.damageMultiplier = 1;
    this.fireRateMultiplier = 1;

    this.extraGunCount = 0;
    this.pierceCount = 0;
    this.explosionLevel = 0;
    this.bulletStormCount = 1;
    this.lifestealPercent = 0;

    this.shieldLevel = 0;
    this.shieldCooldown = 8;
    this.shieldTimer = 0;

    this.freezeLevel = 0;
    this.freezeRadius = 0;
    this.freezeStrength = 0;

    this.autoExplosionLevel = 0;
    this.autoExplosionTimer = 0;
    this.autoExplosionDamage = 0;

    this.droneCount = 0;
    this.droneAngle = 0;

    this.critChance = 0;
    this.magnetRadius = 0;
    this.flamethrowerUnlocked = false;
    this.laserRifleUnlocked = false;
    this.crossbowUnlocked = false;
    this.postRoundHealBonus = 0;
    this.postRoundAmmoBonus = 0;
  }

  getStats(): any {
    return {
      damageMultiplier: this.damageMultiplier,
      fireRateMultiplier: this.fireRateMultiplier,
      moveSpeed: this.moveSpeed,
      pierceCount: this.pierceCount,
      explosionLevel: this.explosionLevel,
      bulletBlastPercent: this.explosionLevel > 0 ? Math.round((0.1 + this.explosionLevel * 0.08) * 100) : 0,
      extraGunCount: this.extraGunCount,
      bulletStormCount: this.bulletStormCount,
      lifestealPercent: this.lifestealPercent,
      shieldLevel: this.shieldLevel,
      shieldCooldown: this.shieldCooldown,
      freezeLevel: this.freezeLevel,
      freezeRadius: this.freezeRadius,
      freezeStrength: this.freezeStrength,
      autoExplosionLevel: this.autoExplosionLevel,
      autoExplosionDamage: this.autoExplosionDamage,
      droneCount: this.droneCount,
      critChance: this.critChance,
      magnetRadius: this.magnetRadius,
      flamethrowerUnlocked: this.flamethrowerUnlocked,
      laserRifleUnlocked: this.laserRifleUnlocked,
      crossbowUnlocked: this.crossbowUnlocked,
    };
  }

  private emitStats(): void {
    EventBus.getInstance().emit(GameEvent.PLAYER_STATS_CHANGED, this.getStats());
  }

  // ----- IDamageable -----

  takeDamage(amount: number): void {
    // Shield aura blocks one hit
    if (this.shieldLevel > 0 && this.shieldTimer <= 0) {
      this.shieldTimer = this.shieldCooldown;
      // Shield absorbs the hit
      return;
    }

    this.health -= amount;

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

    // If we just added ammo to the currently equipped weapon, update the HUD
    if (this.weapon.name === weaponName) {
      EventBus.getInstance().emit(GameEvent.AMMO_CHANGED, {
        ammo: this.ammo.get(weaponName),
        maxAmmo: this.weapon.maxAmmo,
        weaponName: this.weapon.name,
      });
    }
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

  healPercent(pct: number): void {
    this.heal(this.maxHealth * pct);
  }

  addAmmoPercent(weaponName: string, pct: number): void {
    // Find the max ammo for this weapon from the weapons list
    const maxAmmoMap: Record<string, number> = {
      Shotgun: 30, Rifle: 90, Flamethrower: 200, LaserRifle: 150, Crossbow: 40,
    };
    const max = maxAmmoMap[weaponName] ?? 30;
    this.addAmmo(weaponName, Math.ceil(max * pct));
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
        this.postRoundHealBonus += 0.10;
        break;

      case CardEffectType.AMMO_REFILL:
        this.ammo.set('Shotgun', 30);
        this.ammo.set('Rifle', 90);
        this.postRoundAmmoBonus += 0.10;
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
        this.pierceCount += 1;
        break;

      case CardEffectType.LIFESTEAL:
        this.lifestealPercent += card.value;
        break;

      case CardEffectType.EXPLOSIVE_BULLETS:
        this.explosionLevel += 1;
        // Explosion damage starts small and scales per level
        break;

      case CardEffectType.BULLET_STORM:
        this.bulletStormCount += card.value;
        break;

      case CardEffectType.SHIELD_AURA:
        this.shieldLevel += 1;
        this.shieldCooldown = Math.max(3, 8 - (this.shieldLevel - 1) * 1.5);
        this.shieldTimer = 0;
        break;

      case CardEffectType.FREEZE_AURA:
        this.freezeLevel += 1;
        // Start bigger and scale faster: Lv1=80r/8%, Lv2=120r/16%, Lv3=160r/24%...
        this.freezeRadius = 40 + (this.freezeLevel * 40);
        this.freezeStrength = Math.min(0.8, 0.08 * this.freezeLevel);
        break;

      // Legendary
      case CardEffectType.DOUBLE_GUN: // Actually extra guns multiplier
        this.extraGunCount += 1;
        break;

      case CardEffectType.AUTO_EXPLOSION:
        this.autoExplosionLevel += 1;
        // Start weaker, scales up: Lv1=10, Lv2=22, Lv3=36, Lv4=52, Lv5=70
        this.autoExplosionDamage = 10 + (this.autoExplosionLevel * (this.autoExplosionLevel + 1)) / 2 * 4;
        this.autoExplosionTimer = 0;
        break;

      case CardEffectType.ORBITAL_DRONES:
        if (this.droneCount === 0) {
          this.droneCount = 3;
        } else {
          this.droneCount += card.value;
        }
        break;

      case CardEffectType.CRITICAL_HIT:
        // Lv1=15%, Lv2=25%, Lv3=35%...
        this.critChance = Math.min(0.75, this.critChance + card.value);
        break;

      case CardEffectType.MAGNET_PULL:
        // Each stack adds 200px radius
        this.magnetRadius += card.value;
        break;

      case CardEffectType.FLAMETHROWER_UNLOCK:
        this.flamethrowerUnlocked = true;
        // Grant initial ammo
        this.ammo.set('Flamethrower', 120);
        break;

      case CardEffectType.FLAMETHROWER_AMMO:
        const ftAmmo = this.ammo.get('Flamethrower') ?? 0;
        this.ammo.set('Flamethrower', ftAmmo + Math.round(card.value));
        break;

      case CardEffectType.LASER_RIFLE_UNLOCK:
        this.laserRifleUnlocked = true;
        this.ammo.set('LaserRifle', 150);
        break;
      
      case CardEffectType.LASER_RIFLE_AMMO:
        const lrAmmo = this.ammo.get('LaserRifle') ?? 0;
        this.ammo.set('LaserRifle', lrAmmo + Math.round(card.value));
        break;

      case CardEffectType.CROSSBOW_UNLOCK:
        this.crossbowUnlocked = true;
        this.ammo.set('Crossbow', 40);
        break;

      case CardEffectType.CROSSBOW_AMMO:
        const cbAmmo = this.ammo.get('Crossbow') ?? 0;
        this.ammo.set('Crossbow', cbAmmo + Math.round(card.value));
        break;
    }
    this.emitStats();
  }

  // ----- Effect Getters -----

  getDamageMultiplier(): number {
    return this.damageMultiplier;
  }

  getFireRateMultiplier(): number {
    return this.fireRateMultiplier;
  }

  getHasPiercing(): boolean {
    return this.pierceCount > 0;
  }

  getPierceCount(): number {
    return this.pierceCount;
  }

  getHasExplosive(): boolean {
    return this.explosionLevel > 0;
  }

  getExplosionLevel(): number {
    return this.explosionLevel;
  }

  getLifestealPercent(): number {
    return this.lifestealPercent;
  }

  getHasFreezeAura(): boolean {
    return this.freezeLevel > 0;
  }

  getFreezeRadius(): number {
    return this.freezeRadius;
  }

  getFreezeStrength(): number {
    return this.freezeStrength;
  }

  getHasOrbitalDrones(): boolean {
    return this.droneCount > 0;
  }

  getDroneCount(): number {
    return this.droneCount;
  }

  getDroneAngle(): number {
    return this.droneAngle;
  }

  getPostRoundHealBonus(): number { return this.postRoundHealBonus; }
  getPostRoundAmmoBonus(): number { return this.postRoundAmmoBonus; }

  getMagnetRadius(): number {
    return this.magnetRadius;
  }

  isFlamethrowerUnlocked(): boolean {
    return this.flamethrowerUnlocked;
  }

  isLaserRifleUnlocked(): boolean { return this.laserRifleUnlocked; }
  isCrossbowUnlocked(): boolean { return this.crossbowUnlocked; }

  teleportTo(x: number, y: number): void {
    const margin = this.size;
    this.position = new Vector2D(
      clamp(x, margin, this.canvasWidth - margin),
      clamp(y, margin, this.canvasHeight - margin),
    );
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

    // Critical hit roll
    const isCrit = this.critChance > 0 && Math.random() < this.critChance;
    const critMult = isCrit ? 3 : 1;

    // Apply damage multiplier + crit
    bullets = bullets.map((b) => ({
      ...b,
      damage: b.damage * this.damageMultiplier * critMult,
    }));

    if (isCrit) {
      EventBus.getInstance().emit(GameEvent.CRIT_HIT, {
        x: this.position.x + Math.cos(this.aimAngle) * 30,
        y: this.position.y + Math.sin(this.aimAngle) * 30,
      });
    }

    // Double Gun
    if (this.extraGunCount > 0) {
      const perpendicular = new Vector2D(-aimDir.y, aimDir.x);
      const offset = perpendicular.scale(12);
      const secondBullets = this.weapon.fire(
        this.position.add(offset),
        aimDir,
      ).map((b) => ({
        ...b,
        damage: b.damage * this.damageMultiplier * critMult,
        x: b.x + offset.x,
        y: b.y + offset.y,
      }));
      bullets = [...bullets, ...secondBullets];
    }

    // Bullet Storm
    if (this.bulletStormCount > 1) {
      const extraBullets: BulletConfig[] = [];
      for (let i = 1; i < this.bulletStormCount; i++) {
        const angleOffset = (i * 0.15) * (i % 2 === 0 ? 1 : -1);
        const stormDir = aimDir.rotate(angleOffset);
        const stormBullets = this.weapon.fire(this.position, stormDir).map((b) => ({
          ...b,
          damage: b.damage * this.damageMultiplier * critMult * 0.6,
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
    if (this.shieldLevel > 0 && this.shieldTimer > 0) {
      this.shieldTimer -= deltaTime;
    }

    // Auto explosion timer
    if (this.autoExplosionLevel > 0) {
      this.autoExplosionTimer += deltaTime;
    }

    // Drone rotation
    if (this.droneCount > 0) {
      this.droneAngle += deltaTime * 2.5;
    }
  }

  /**
   * Check and consume auto explosion.
   * Returns damage if ready, 0 otherwise.
   */
  consumeAutoExplosion(): number {
    if (this.autoExplosionLevel <= 0) return 0;
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
    if (this.freezeLevel > 0) {
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
    if (this.autoExplosionLevel > 0) {
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
    if (this.shieldLevel > 0) {
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

    if (this.extraGunCount > 0) {
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
      // Single barrel dynamic types
      let wColor = '#b0bec5'; let wWidth = 4; let wLen = this.size + 12; let nozzle = '#78909c';
      switch(this.weapon.name) {
          case 'Shotgun': wColor = '#424242'; wWidth = 8; wLen = this.size + 16; nozzle = '#212121'; break;
          case 'Rifle': wColor = '#212121'; wWidth = 5; wLen = this.size + 24; nozzle = '#000000'; break;
          case 'Flamethrower': wColor = '#ff5722'; wWidth = 10; wLen = this.size + 18; nozzle = '#d50000'; break;
          case 'LaserRifle': wColor = '#00e5ff'; wWidth = 6; wLen = this.size + 25; nozzle = '#ffffff'; break;
          case 'Crossbow': wColor = '#795548'; wWidth = 5; wLen = this.size + 14; nozzle = '#5d4037'; break;
      }
      
      const barrelEndX = x + Math.cos(this.aimAngle) * wLen;
      const barrelEndY = y + Math.sin(this.aimAngle) * wLen;

      ctx.strokeStyle = wColor;
      ctx.lineWidth = wWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(
        x + Math.cos(this.aimAngle) * this.size * 0.5,
        y + Math.sin(this.aimAngle) * this.size * 0.5,
      );
      ctx.lineTo(barrelEndX, barrelEndY);
      ctx.stroke();

      if (this.weapon.name === 'Crossbow') {
          const perpDir = new Vector2D(-Math.sin(this.aimAngle), Math.cos(this.aimAngle));
          ctx.beginPath();
          ctx.moveTo(barrelEndX + perpDir.x * 12, barrelEndY + perpDir.y * 12);
          const bowOffset = 6;
          ctx.bezierCurveTo(barrelEndX - Math.cos(this.aimAngle)*bowOffset, barrelEndY - Math.sin(this.aimAngle)*bowOffset, barrelEndX - Math.cos(this.aimAngle)*bowOffset, barrelEndY - Math.sin(this.aimAngle)*bowOffset, barrelEndX - perpDir.x * 12, barrelEndY - perpDir.y * 12);
          ctx.strokeStyle = '#5d4037'; ctx.lineWidth = 3; ctx.stroke();
      } else {
        ctx.fillStyle = nozzle;
        ctx.beginPath();
        ctx.arc(barrelEndX, barrelEndY, wWidth/1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Orbital drones
    if (this.droneCount > 0) {
      const droneRadius = this.size * 5.0; // orbit radius 2x bigger
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
