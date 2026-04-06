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
  private eventBus: EventBus;
  private particleSystem: ParticleSystem;

  constructor(particleSystem: ParticleSystem) {
    this.eventBus = EventBus.getInstance();
    this.particleSystem = particleSystem;
  }

  /**
   * Player bullets vs enemies.
   * Handles piercing, explosive, shield zombies, lifesteal.
   */
  checkBulletEnemyCollisions(bullets: Bullet[], enemies: Enemy[], player: Player): number {
    let kills = 0;

    for (const bullet of bullets) {
      if (!bullet.isActive()) continue;

      for (const enemy of enemies) {
        if (!enemy.isActive()) continue;

        if (bullet.collidesWith(enemy)) {
          // Shield zombie — directional damage
          if (enemy instanceof ShieldZombie) {
            (enemy as ShieldZombie).takeDamageFrom(
              bullet.getDamage(),
              bullet.getPosition(),
            );
          } else {
            enemy.takeDamage(bullet.getDamage());
          }

          // Explosive bullets — AoE damage (large radius)
          if (player.getHasExplosive()) {
            const pos = bullet.getPosition();
            const explosionRadius = 120;  // was 60
            for (const other of enemies) {
              if (other === enemy || !other.isActive()) continue;
              if (pos.distanceTo(other.getPosition()) < explosionRadius) {
                other.takeDamage(bullet.getDamage() * 0.5);
              }
            }
            this.particleSystem.createExplosion(pos.x, pos.y, '#ff6600', 30, 350);
          }

          // Piercing — don't destroy bullet
          if (!player.getHasPiercing()) {
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

          if (!player.getHasPiercing()) break;
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
        } else if (powerUp.getType() === PowerUpType.AMMO) {
          player.addAmmo('Shotgun', Math.floor(powerUp.getValue() / 2));
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
