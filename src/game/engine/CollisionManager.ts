// ============================================================
// CollisionManager.ts — All collision detection & resolution
// Handles: bullets-enemies, enemies-player, powerups, enemy
// bullets, drones, freeze aura, auto-explosion, shield zombies
// ============================================================

import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { PowerUp } from '../entities/PowerUp';
import { EnemyBullet } from '../entities/EnemyBullet';
import { ShieldZombie } from '../entities/ShieldZombie';
import { ParticleSystem } from '../particles/ParticleSystem';
import { EventBus } from '../events/EventBus';
import { GameEvent, PowerUpType } from '../interfaces/types';
import { Vector2D } from '../utils/Vector2D';

export class CollisionManager {
  private particleSystem: ParticleSystem;

  constructor(particleSystem: ParticleSystem) {
    this.particleSystem = particleSystem;
  }

  /** Always get the current EventBus instance (survives resetInstance calls) */
  private get eventBus(): EventBus {
    return EventBus.getInstance();
  }

  /**
   * Player bullets vs enemies.
   * Handles piercing, explosive, shield zombies, lifesteal.
   */
  checkBulletEnemyCollisions(bullets: Bullet[], enemies: Enemy[], player: Player): number {
    let kills = 0;
    // Track how many enemies each bullet has pierced through
    const bulletPierceHits = new Map<Bullet, number>();

    for (const bullet of bullets) {
      if (!bullet.isActive()) continue;

      for (const enemy of enemies) {
        if (!enemy.isActive()) continue;

        // Skip if this bullet already hit this enemy
        if (bullet.hasHit(enemy)) continue;

        if (bullet.collidesWith(enemy)) {
          // Mark as hit
          bullet.addHit(enemy);
          // Shield zombie — directional damage
          if (enemy instanceof ShieldZombie) {
            (enemy as ShieldZombie).takeDamageFrom(
              bullet.getDamage(),
              bullet.getPosition(),
            );
          } else {
            enemy.takeDamage(bullet.getDamage());
          }

          // Explosive bullets — AoE damage (scales with explosion level)
          if (player.getHasExplosive()) {
            const pos = bullet.getPosition();
            // Start smaller, scale gradually: Lv1=55r/18%, Lv2=70r/26%, Lv3=85r/34%...
            const explosionRadius = 40 + (player.getExplosionLevel() * 15);
            const explosionDmgMult = 0.10 + (player.getExplosionLevel() * 0.08);
            for (const other of enemies) {
              if (other === enemy || !other.isActive()) continue;
              if (pos.distanceTo(other.getPosition()) < explosionRadius) {
                other.takeDamage(bullet.getDamage() * explosionDmgMult);
              }
            }
            const particleCount = Math.min(50, 15 + player.getExplosionLevel() * 8);
            this.particleSystem.createExplosion(pos.x, pos.y, '#ff6600', particleCount, 350);
          }

          // Piercing — track hits, destroy when exceeded
          const hits = (bulletPierceHits.get(bullet) ?? 0) + 1;
          bulletPierceHits.set(bullet, hits);
          if (hits > player.getPierceCount()) {
            bullet.destroy();
          }

          // Impact particles
          const pos = bullet.getPosition();
          this.particleSystem.createImpact(pos.x, pos.y, enemy.getColor());

          // Lifesteal
          if (player.getLifestealPercent() > 0) {
            const healAmount = bullet.getDamage() * player.getLifestealPercent();
            player.heal(healAmount);
          }

          // Check kill
          if (!enemy.isAlive()) {
            kills++;
            const ePos = enemy.getPosition();
            this.particleSystem.createExplosion(ePos.x, ePos.y, enemy.getColor(), 15, 200);
            this.eventBus.emit(GameEvent.ZOMBIE_KILLED, {
              type: enemy.getType(),
              score: enemy.getScoreValue(),
              x: ePos.x,
              y: ePos.y,
            });
          }

          if (!bullet.isActive()) break;
        }
      }
    }

    return kills;
  }

  /**
   * Enemy contact damage to player.
   */
  checkEnemyPlayerCollisions(enemies: Enemy[], player: Player): void {
    for (const enemy of enemies) {
      if (!enemy.isActive()) continue;
      if (enemy.collidesWith(player)) {
        player.takeDamage(enemy.getDamage());
        
        // Bounce enemy back
        const p1 = enemy.getPosition();
        const p2 = player.getPosition();
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
          // Instead of an instant 20px teleport, we apply a smooth knockback velocity
          // ~400px/sec velocity over a few frames creates a very smooth, springy bounce
          const pushX = (dx / dist) * 400; 
          const pushY = (dy / dist) * 400;
          enemy.applyKnockback(new Vector2D(pushX, pushY));
        }
      }
    }
  }

  /**
   * Enemy bullets hitting player.
   */
  checkEnemyBulletPlayerCollisions(enemyBullets: EnemyBullet[], player: Player): void {
    for (const bullet of enemyBullets) {
      if (!bullet.isActive()) continue;
      if (bullet.collidesWith(player)) {
        player.takeDamage(bullet.getDamage());
        bullet.destroy();
        const pos = bullet.getPosition();
        this.particleSystem.createImpact(pos.x, pos.y, '#e040fb');
      }
    }
  }

  /**
   * Player powerup pickups.
   */
  checkPlayerPowerUpCollisions(player: Player, powerUps: PowerUp[]): void {
    for (const powerUp of powerUps) {
      if (!powerUp.isActive()) continue;
      if (player.collidesWith(powerUp)) {
        if (powerUp.getType() === PowerUpType.HEALTH) {
          player.heal(powerUp.getValue());
        } else if (powerUp.getType() === PowerUpType.AMMO_SHOTGUN) {
          player.addAmmo('Shotgun', powerUp.getValue());
        } else if (powerUp.getType() === PowerUpType.AMMO_RIFLE) {
          player.addAmmo('Rifle', powerUp.getValue());
        }
        const pos = powerUp.getPosition();
        this.particleSystem.createExplosion(
          pos.x, pos.y,
          powerUp.getType() === PowerUpType.HEALTH ? '#4caf50' : '#ffc107',
          8, 100,
        );
        this.eventBus.emit(GameEvent.POWERUP_COLLECTED, {
          type: powerUp.getType(),
          value: powerUp.getValue(),
        });
        powerUp.destroy();
      }
    }
  }

  /**
   * Orbital drone damage to enemies.
   */
  checkDroneCollisions(player: Player, enemies: Enemy[]): void {
    if (!player.getHasOrbitalDrones()) return;

    const pos = player.getPosition();
    const droneRadius = player.getSize() * 2.5;
    const droneAngle = player.getDroneAngle();
    const droneDamage = 15;

    for (let i = 0; i < player.getDroneCount(); i++) {
      const angle = droneAngle + (i / player.getDroneCount()) * Math.PI * 2;
      const dx = pos.x + Math.cos(angle) * droneRadius;
      const dy = pos.y + Math.sin(angle) * droneRadius;

      for (const enemy of enemies) {
        if (!enemy.isActive()) continue;
        const dist = enemy.getPosition().distanceTo(new Vector2D(dx, dy));
        if (dist < enemy.getSize() + 6) {
          enemy.takeDamage(droneDamage * 0.1); // DPS over frames
          this.particleSystem.createImpact(dx, dy, '#ffd600');
        }
      }
    }
  }

  /**
   * Auto explosion AOE around player.
   */
  checkAutoExplosion(player: Player, enemies: Enemy[]): void {
    const damage = player.consumeAutoExplosion();
    if (damage <= 0) return;

    const pos = player.getPosition();
    const radius = 250;  // was 150

    // Visual explosion
    this.particleSystem.createExplosion(pos.x, pos.y, '#ff3d00', 40, 400);

    for (const enemy of enemies) {
      if (!enemy.isActive()) continue;
      if (pos.distanceTo(enemy.getPosition()) < radius) {
        enemy.takeDamage(damage);
        if (!enemy.isAlive()) {
          const ePos = enemy.getPosition();
          this.particleSystem.createExplosion(ePos.x, ePos.y, enemy.getColor(), 12, 180);
          this.eventBus.emit(GameEvent.ZOMBIE_KILLED, {
            type: enemy.getType(),
            score: enemy.getScoreValue(),
            x: ePos.x,
            y: ePos.y,
          });
        }
      }
    }
  }

  /**
   * Freeze aura — slow enemies near the player.
   */
  applyFreezeAura(player: Player, enemies: Enemy[]): void {
    if (!player.getHasFreezeAura()) return;

    const pos = player.getPosition();
    const radius = player.getFreezeRadius();

    for (const enemy of enemies) {
      if (!enemy.isActive()) continue;
      // We slow enemies by reducing their position update
      // This is handled in GameEngine update by checking proximity
    }
  }
}
