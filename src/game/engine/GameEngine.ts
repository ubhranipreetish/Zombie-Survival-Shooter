// ============================================================
// GameEngine.ts — Main game loop and coordinator
// Now integrates: CardSystem, EnemyBullets, SpawnMinions,
// FreezeAura, AutoExplosion, DroneCollisions
// ============================================================

import { GameState, GameEvent, GameOverData, PowerUpCard, ZombieType, PowerUpType } from '../interfaces/types';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Bullet } from '../entities/Bullet';
import { PowerUp } from '../entities/PowerUp';
import { ExpOrb } from '../entities/ExpOrb';
import { EnemyBullet } from '../entities/EnemyBullet';
import { NormalZombie } from '../entities/NormalZombie';
import { AudioSystem } from '../systems/AudioSystem';
import { Pistol } from '../weapons/Pistol';
import { Shotgun } from '../weapons/Shotgun';
import { Rifle } from '../weapons/Rifle';
import { Flamethrower } from '../weapons/Flamethrower';
import { LaserRifle } from '../weapons/LaserRifle';
import { Crossbow } from '../weapons/Crossbow';
import { Weapons } from '../interfaces/Weapons';
import { InputManager } from './InputManager';
import { CollisionManager } from './CollisionManager';
import { WaveManager } from './WaveManager';
import { Renderer } from './Renderer';
import { ParticleSystem } from '../particles/ParticleSystem';
import { EventBus } from '../events/EventBus';
import { CardSystem } from '../systems/CardSystem';
import { ExpSystem } from '../systems/ExpSystem';
import { AbilitySystem } from '../systems/AbilitySystem';
import { AbilityType } from '../systems/AbilitySystem';
import { Grenade } from '../entities/Grenade';
import { Vector2D } from '../utils/Vector2D';

export class GameEngine {
  private renderer: Renderer;
  private inputManager: InputManager;
  private collisionManager: CollisionManager;
  private waveManager: WaveManager;
  private particleSystem: ParticleSystem;
  private cardSystem: CardSystem;
  private expSystem: ExpSystem;
  private abilitySystem: AbilitySystem;
  private eventBus: EventBus;

  private gameState: GameState;
  private score: number;
  private totalKills: number;
  private totalShots: number = 0;
  private totalHits: number = 0;
  private weaponKills: Record<string, number> = {};
  private lastFrameTime: number;
  private animationFrameId: number | null;

  private player!: Player;
  private enemies: Enemy[];
  private bullets: Bullet[];
  private enemyBullets: EnemyBullet[];
  private powerUps: PowerUp[];
  private expOrbs: ExpOrb[];
  private grenades: Grenade[];

  private baseWeapons: Weapons[];
  private flamethrower: Flamethrower;
  private laserRifle: LaserRifle;
  private crossbow: Crossbow;
  private weapons: Weapons[];
  private currentWeaponIndex: number;
  private activeLevelUpAnim: number;
  private canvas: HTMLCanvasElement;

  // Card selection
  private pendingCardChoices: PowerUpCard[];
  private unsubscribers: Array<() => void> = [];

  private onStateChange?: (state: GameState) => void;
  private onCardChoices?: (cards: PowerUpCard[]) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.inputManager = new InputManager(canvas);
    this.particleSystem = new ParticleSystem();
    this.collisionManager = new CollisionManager(this.particleSystem);
    this.waveManager = new WaveManager(canvas.width, canvas.height);
    this.cardSystem = new CardSystem();
    this.expSystem = new ExpSystem();
    this.abilitySystem = new AbilitySystem();
    this.eventBus = EventBus.getInstance();

    this.gameState = GameState.MENU;
    this.score = 0;
    this.totalKills = 0;
    this.lastFrameTime = 0;
    this.animationFrameId = null;

    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.powerUps = [];
    this.expOrbs = [];
    this.grenades = [];

    this.baseWeapons = [new Pistol(), new Shotgun(), new Rifle()];
    this.flamethrower = new Flamethrower();
    this.laserRifle = new LaserRifle();
    this.crossbow = new Crossbow();
    this.weapons = [...this.baseWeapons];
    this.currentWeaponIndex = 0;
    this.activeLevelUpAnim = 0;
    this.pendingCardChoices = [];

    this.setupEventListeners();
    AudioSystem.getInstance().init(); // eagerly fetches HTTP MP3 payloads into ArrayBuffer context cache
  }

  private setupEventListeners(): void {
    this.unsubscribers.push(this.eventBus.subscribe(GameEvent.ZOMBIE_KILLED, (data: unknown) => {
      const killData = data as { type: ZombieType; score: number; exp: number; x: number; y: number; weaponName: string };
      AudioSystem.getInstance().playEnemyDying();
      this.score += killData.score;
      this.totalKills++;
      
      const wName = killData.weaponName || 'Unknown';
      this.weaponKills[wName] = (this.weaponKills[wName] || 0) + 1;
      
      this.eventBus.emit(GameEvent.SCORE_CHANGED, { score: this.score, kills: this.totalKills });
      this.waveManager.onZombieKilled();

      // Drop EXP orb at kill position
      const expAmount = killData.exp ?? killData.score;
      this.expOrbs.push(new ExpOrb(killData.x, killData.y, expAmount));

      // Random drop: Ammo box (15% chance) — offset so it doesn't overlap the EXP orb
      if (Math.random() < 0.15) {
        const isShotgun = Math.random() < 0.5;
        const type = isShotgun ? PowerUpType.AMMO_SHOTGUN : PowerUpType.AMMO_RIFLE;
        const dropAmount = isShotgun ? 5 + Math.floor(Math.random() * 5) : 10 + Math.floor(Math.random() * 11);
        const angle = Math.random() * Math.PI * 2;
        const offset = 32;
        this.powerUps.push(new PowerUp(
          killData.x + Math.cos(angle) * offset,
          killData.y + Math.sin(angle) * offset,
          type, dropAmount,
        ));
      }
    }));

    this.unsubscribers.push(this.eventBus.subscribe(GameEvent.WAVE_COMPLETE, () => {
      this.score += 50;
      this.eventBus.emit(GameEvent.SCORE_CHANGED, { score: this.score });

      // Wave completion rewards: +20% max health and +20% max ammo, plus card bonuses
      const healPct = 0.20 + this.player.getPostRoundHealBonus();
      const ammoPct = 0.20 + this.player.getPostRoundAmmoBonus();
      this.player.healPercent(healPct);
      this.player.addAmmoPercent('Shotgun', ammoPct);
      this.player.addAmmoPercent('Rifle', ammoPct);
      if (this.player.isFlamethrowerUnlocked()) {
        const ftBonus = Math.floor(30 * (1 + this.player.getPostRoundAmmoBonus()));
        this.player.addAmmo('Flamethrower', ftBonus);
      }
      if (this.player.isLaserRifleUnlocked()) {
        const lrBonus = Math.floor(100 * (1 + this.player.getPostRoundAmmoBonus()));
        this.player.addAmmo('LaserRifle', lrBonus);
      }
      if (this.player.isCrossbowUnlocked()) {
        const cbBonus = Math.floor(3 * (1 + this.player.getPostRoundAmmoBonus()));
        this.player.addAmmo('Crossbow', cbBonus);
      }

      // Spawn power-ups
      const newPowerUps = this.waveManager.generatePowerUps();
      this.powerUps.push(...newPowerUps);

      this.inputManager.clearInputs();
      this.player.setMoveDirection(Vector2D.zero());
      this.player.setFiring(false);
      // No card selection on wave complete — cards only come from leveling up
    }));

    this.unsubscribers.push(this.eventBus.subscribe(GameEvent.WAVE_CHANGED, () => {
    }));

    // Enemies shooting (e.g. ShooterZombie)
    this.unsubscribers.push(this.eventBus.subscribe(GameEvent.ENEMY_SHOOT, (data: unknown) => {
      AudioSystem.getInstance().playEnemyShoot();
      const d = data as { x: number; y: number; dirX: number; dirY: number; speed: number; damage: number; radius?: number; isSlam?: boolean };
      // Fallback for 0,0 direction vector causing NaN on normalize
      const dirX = d.dirX === 0 && d.dirY === 0 ? 1 : d.dirX;
      this.enemyBullets.push(new EnemyBullet(d.x, d.y, dirX, d.dirY, d.speed, d.damage, d.radius, d.isSlam));
    }));

    // SpawnerZombie creates minions via event
    this.unsubscribers.push(this.eventBus.subscribe(GameEvent.SPAWN_MINION, (data: unknown) => {
      const d = data as { x: number; y: number };
      const minion = new NormalZombie(d.x, d.y, 0.5, 1.2);
      this.enemies.push(minion);
    }));

    // Boss defeated — grant ability
    this.unsubscribers.push(this.eventBus.subscribe(GameEvent.BOSS_DEFEATED, (data: unknown) => {
      const d = data as { type: ZombieType };
      if (d.type === ZombieType.BOSS_NECROMANCER || d.type === ZombieType.BOSS_JUGGERNAUT) {
        this.abilitySystem.grantAbility(AbilityType.GRENADE);
      } else if (d.type === ZombieType.BOSS_HYDRA || d.type === ZombieType.BOSS_PHANTOM) {
        this.abilitySystem.grantAbility(AbilityType.TELEPORT_BOMB);
      } else if (d.type === ZombieType.BOSS_WARDEN) {
        this.abilitySystem.grantAbility(AbilityType.BOUNCING_BULLETS);
      } else {
        this.abilitySystem.grantAbility(AbilityType.GRENADE);
      }
    }));
  }

  setOnStateChange(callback: (state: GameState) => void): void {
    this.onStateChange = callback;
  }

  setOnCardChoices(callback: (cards: PowerUpCard[]) => void): void {
    this.onCardChoices = callback;
  }

  /**
   * Called by React when the player picks a card.
   * Clears input state to prevent stuck movement after overlay.
   */
  selectCard(card: PowerUpCard): void {
    this.cardSystem.collectCard(card);
    this.player.applyCard(card);
    this.waveManager.onCardSelected();
    this.pendingCardChoices = [];

    // If a new weapon was unlocked, add it to the active arsenal
    if (this.player.isFlamethrowerUnlocked() && !this.weapons.includes(this.flamethrower)) {
      this.weapons.push(this.flamethrower);
    }
    if (this.player.isLaserRifleUnlocked() && !this.weapons.includes(this.laserRifle)) {
      this.weapons.push(this.laserRifle);
    }
    if (this.player.isCrossbowUnlocked() && !this.weapons.includes(this.crossbow)) {
      this.weapons.push(this.crossbow);
    }

    // Clear stale input state
    this.inputManager.clearInputs();
    this.player.setMoveDirection(Vector2D.zero());
    this.player.setFiring(false);
    this.lastFrameTime = performance.now();

    this.setGameState(GameState.PLAYING);

    this.eventBus.emit(GameEvent.AMMO_CHANGED, {
      ammo: this.player.getAmmo(),
      maxAmmo: this.weapons[this.currentWeaponIndex].maxAmmo,
      weaponName: this.weapons[this.currentWeaponIndex].name,
    });
  }

  getCollectedCards(): PowerUpCard[] {
    return this.cardSystem.getCollectedCards();
  }

  startGame(startWave: number = 1): void {
    AudioSystem.getInstance().startBGM(); // User gesture un-suspends Audio Context here
    this.score = 0;
    this.totalKills = 0;
    this.totalShots = 0;
    this.totalHits = 0;
    this.weaponKills = {};
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.powerUps = [];
    this.expOrbs = [];
    this.grenades = [];
    this.particleSystem.clear();
    this.cardSystem.reset();
    this.expSystem.reset();
    this.abilitySystem.reset();
    // Do not call EventBus.resetInstance() — it destroys GameCanvas's listeners!
    this.eventBus = EventBus.getInstance();
    
    // Clean up old listeners ifstartGame is called again (e.g., from handleRestart)
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    
    this.setupEventListeners();
    this.waveManager = new WaveManager(this.canvas.width, this.canvas.height, startWave);

    this.baseWeapons = [new Pistol(), new Shotgun(), new Rifle()];
    this.flamethrower = new Flamethrower();
    this.laserRifle = new LaserRifle();
    this.crossbow = new Crossbow();
    this.weapons = [...this.baseWeapons];
    this.currentWeaponIndex = 0;

    this.player = new Player(
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.weapons[0],
      this.canvas.width,
      this.canvas.height,
    );

    this.setGameState(GameState.PLAYING);

    this.eventBus.emit(GameEvent.SCORE_CHANGED, { score: 0 });
    this.eventBus.emit(GameEvent.PLAYER_HEALTH_CHANGED, {
      health: this.player.getHealth(),
      maxHealth: this.player.getMaxHealth(),
    });
    this.eventBus.emit(GameEvent.WEAPON_CHANGED, {
      name: this.weapons[0].name,
      color: this.weapons[0].color,
    });
    this.eventBus.emit(GameEvent.AMMO_CHANGED, {
      ammo: this.player.getAmmo(),
      maxAmmo: this.weapons[0].maxAmmo,
      weaponName: this.weapons[0].name,
    });
    this.eventBus.emit(GameEvent.PLAYER_STATS_CHANGED, this.player.getStats());
    this.eventBus.emit(GameEvent.EXP_CHANGED, {
      exp: 0,
      expToNext: this.expSystem.getExpForLevel(1),
      level: 1,
    });

    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }

  private gameLoop = (currentTime: number): void => {
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = currentTime;

    if (this.gameState === GameState.PLAYING) {
      this.handleInput();
      this.update(deltaTime, currentTime);
      this.checkCollisions();
      this.cleanup();
    }

    // LEVEL_UP state: game is frozen, waiting for banner timeout
    if (this.gameState === GameState.LEVEL_UP) {
      // nothing updates — fully paused
    }

    this.render();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private handleInput(): void {
    this.player.setMoveDirection(this.inputManager.getMoveDirection());
    this.player.setMousePosition(this.inputManager.getMousePosition());
    this.player.setFiring(this.inputManager.isMouseDown());

    // Weapon switching mapping natively to current active indices
    if (this.inputManager.consumeKey('1') && this.weapons.length > 0) this.switchWeapon(0);
    if (this.inputManager.consumeKey('2') && this.weapons.length > 1) this.switchWeapon(1);
    if (this.inputManager.consumeKey('3') && this.weapons.length > 2) this.switchWeapon(2);
    if (this.inputManager.consumeKey('4') && this.weapons.length > 3) this.switchWeapon(3);
    if (this.inputManager.consumeKey('5') && this.weapons.length > 4) this.switchWeapon(4);
    if (this.inputManager.consumeKey('6') && this.weapons.length > 5) this.switchWeapon(5);

    // Spacebar ability
    if (this.inputManager.consumeKey(' ')) {
      const mousePos = this.inputManager.getMousePosition();
      const action = this.abilitySystem.tryActivate(mousePos.x, mousePos.y);
      if (action) {
        this.executeAbility(action.type, action.targetX, action.targetY);
      }
    }

    if (this.inputManager.consumeKey('Escape')) {
      this.inputManager.clearInputs();
      this.player.setMoveDirection(Vector2D.zero());
      this.player.setFiring(false);
      this.setGameState(GameState.PAUSED);
    }
  }

  private executeAbility(type: AbilityType, targetX: number, targetY: number): void {
    const playerPos = this.player.getPosition();
    if (type === AbilityType.GRENADE) {
      this.grenades.push(new Grenade(
        playerPos.x, playerPos.y,
        targetX, targetY,
        this.abilitySystem.getGrenadeDamage(),
        this.abilitySystem.getGrenadeRadius(),
      ));
    } else if (type === AbilityType.TELEPORT_BOMB) {
      // Teleport bomb TNT enhancement: drop actual TNT at player's ORIGINAL position
      const originalPos = this.player.getPosition();
      this.grenades.push(new Grenade(
        originalPos.x, originalPos.y,
        originalPos.x, originalPos.y,
        this.abilitySystem.getTeleportBombDamage(),
        this.abilitySystem.getTeleportBombRadius(), // TNT drops right here
      ));

      // Teleport player to target, then explode there as well (double bomb)
      this.player.teleportTo(targetX, targetY);
      const radius = this.abilitySystem.getTeleportBombRadius();
      const damage = this.abilitySystem.getTeleportBombDamage();
      this.particleSystem.createExplosion(targetX, targetY, '#ff00ff', 50, 500);
      for (const enemy of this.enemies) {
        if (!enemy.isActive()) continue;
        if (enemy.getPosition().distanceTo(new Vector2D(targetX, targetY)) < radius) {
          enemy.takeDamage(damage);
          if (!enemy.isAlive()) {
            const ePos = enemy.getPosition();
            this.particleSystem.createExplosion(ePos.x, ePos.y, enemy.getColor(), 12, 180);
            this.eventBus.emit(GameEvent.ZOMBIE_KILLED, {
              type: enemy.getType(), score: enemy.getScoreValue(),
              exp: enemy.getExpValue(), x: ePos.x, y: ePos.y,
            });
          }
        }
      }
    } else if (type === AbilityType.BOUNCING_BULLETS) {
      // Bouncing bullets handled in bullet update — just flag is enough (already set in abilitySystem)
    }
  }

  private switchWeapon(index: number): void {
    if (index >= 0 && index < this.weapons.length && index !== this.currentWeaponIndex) {
      this.currentWeaponIndex = index;
      this.player.setWeapon(this.weapons[index]);
    }
  }

  private update(deltaTime: number, currentTime: number): void {
    this.player.update(deltaTime);
    this.abilitySystem.update(deltaTime);

    // Player firing
    const bulletConfigs = this.player.tryFire(currentTime);
    if (bulletConfigs) {
      AudioSystem.getInstance().playShoot(this.weapons[this.currentWeaponIndex].name);
      this.totalShots += bulletConfigs.length;
      for (const config of bulletConfigs) {
        this.bullets.push(
          new Bullet(
            config.x, config.y,
            config.dirX, config.dirY,
            config.speed, config.damage,
            config.size, config.color,
            config.bounces || 0,
            config.isCrit || false,
            this.canvas.width, this.canvas.height
          ),
        );
      }
    }

    // Freeze aura — slow nearby enemies
    if (this.player.getHasFreezeAura()) {
      const playerPos = this.player.getPosition();
      const freezeRadius = this.player.getFreezeRadius();
      const freezeStrength = this.player.getFreezeStrength();

      for (const enemy of this.enemies) {
        if (!enemy.isActive()) continue;
        const dist = playerPos.distanceTo(enemy.getPosition());
        if (dist < freezeRadius) {
          // Slow the enemy by reducing their effective deltaTime
          enemy.setPlayerPosition(this.player.getPosition());
          enemy.update(-deltaTime * freezeStrength); // "undo" some movement
        } else {
          enemy.setPlayerPosition(this.player.getPosition());
        }
      }
      // Regular update happened via the loop below being skipped for frozen
    }

    // Update enemies
    for (const enemy of this.enemies) {
      enemy.setPlayerPosition(this.player.getPosition());
      if (!this.player.getHasFreezeAura()) {
        enemy.update(deltaTime);
      } else {
        const dist = this.player.getPosition().distanceTo(enemy.getPosition());
        if (dist >= this.player.getFreezeRadius()) {
          enemy.update(deltaTime);
        } else {
          // Already partially updated above, now do the reduced update
          enemy.update(deltaTime * (1 - this.player.getFreezeStrength()));
        }
      }
    }

    // Update bullets
    for (const bullet of this.bullets) bullet.update(deltaTime);
    for (const bullet of this.enemyBullets) bullet.update(deltaTime);

    // Update power-ups and exp orbs
    for (const powerUp of this.powerUps) powerUp.update(deltaTime);
    for (const orb of this.expOrbs) orb.update(deltaTime);

    // Update grenades
    for (const grenade of this.grenades) {
      grenade.update(deltaTime);
      if (grenade.hasReachedTarget() && !grenade.didExplode()) {
        const pos = grenade.getPosition();
        const radius = grenade.getExplosionRadius();
        const damage = grenade.getExplosionDamage();
        this.particleSystem.createExplosion(pos.x, pos.y, '#ff6600', 40, 400);
        AudioSystem.getInstance().playExplosion();
        for (const enemy of this.enemies) {
          if (!enemy.isActive()) continue;
          if (pos.distanceTo(enemy.getPosition()) < radius) {
            enemy.takeDamage(damage);
            if (!enemy.isAlive()) {
              const ePos = enemy.getPosition();
              this.particleSystem.createExplosion(ePos.x, ePos.y, enemy.getColor(), 12, 180);
              this.eventBus.emit(GameEvent.ZOMBIE_KILLED, {
                type: enemy.getType(), score: enemy.getScoreValue(),
                exp: enemy.getExpValue(), x: ePos.x, y: ePos.y,
              });
            }
          }
        }
        grenade.markExploded();
      }
    }

    // Magnet: pull exp orbs and powerups toward player
    const magnetRadius = this.player.getMagnetRadius();
    if (magnetRadius > 0) {
      const playerPos = this.player.getPosition();
      for (const orb of this.expOrbs) {
        if (!orb.isActive()) continue;
        const dist = playerPos.distanceTo(orb.getPosition());
        if (dist < magnetRadius) {
          orb.destroy(); // instant collect
          this.expSystem.addExp(orb.getExpValue());
          this.particleSystem.createExplosion(orb.getPosition().x, orb.getPosition().y, '#29b6f6', 4, 60);
        }
      }
      for (const powerUp of this.powerUps) {
        if (!powerUp.isActive()) continue;
        const dist = playerPos.distanceTo(powerUp.getPosition());
        if (dist < magnetRadius) {
          this.collisionManager.collectPowerUp(powerUp, this.player, this.particleSystem);
        }
      }
    }

    // Level-up: pause to show banner, then open card selection
    if (this.expSystem.consumeLevelUp()) {
      AudioSystem.getInstance().playLevelUp();
      const cards = this.cardSystem.generateCardChoices(this.waveManager.getCurrentWave());
      this.pendingCardChoices = cards;
      this.inputManager.clearInputs();
      this.player.setMoveDirection(Vector2D.zero());
      this.player.setFiring(false);
      this.setGameState(GameState.LEVEL_UP);
      setTimeout(() => {
        if (this.gameState === GameState.LEVEL_UP) {
          this.lastFrameTime = performance.now();
          this.setGameState(GameState.CARD_SELECTION);
          this.onCardChoices?.(cards);
        }
      }, 1800);
    }

    // Update particles
    this.particleSystem.update(deltaTime);

    // Wave manager
    const activeEnemyCount = this.enemies.filter((e) => e.isActive()).length;
    const newEnemies = this.waveManager.update(deltaTime, activeEnemyCount);
    this.enemies.push(...newEnemies);

    // Player death check
    if (!this.player.isAlive()) {
      this.gameOver();
    }
  }

  private checkCollisions(): void {
    const hits = this.collisionManager.checkBulletEnemyCollisions(this.bullets, this.enemies, this.player);
    this.totalHits += hits;
    this.collisionManager.checkEnemyPlayerCollisions(this.enemies, this.player);
    this.collisionManager.checkEnemyBulletPlayerCollisions(this.enemyBullets, this.player);
    this.collisionManager.checkPlayerPowerUpCollisions(this.player, this.powerUps);

    // EXP orb collection
    const playerPos = this.player.getPosition();
    for (const orb of this.expOrbs) {
      if (!orb.isActive()) continue;
      if (this.player.collidesWith(orb)) {
        this.expSystem.addExp(orb.getExpValue());
        this.particleSystem.createExplosion(orb.getPosition().x, orb.getPosition().y, '#29b6f6', 5, 80);
        AudioSystem.getInstance().playPowerup();
        orb.destroy();
      }
    }

    // Drone collisions
    if (this.player.getHasOrbitalDrones()) {
      const pos = this.player.getPosition();
      const droneRadius = this.player.getSize() * 2.5;
      const droneAngle = this.player.getDroneAngle();
      const droneDamage = 2;

      for (let i = 0; i < this.player.getDroneCount(); i++) {
        const angle = droneAngle + (i / this.player.getDroneCount()) * Math.PI * 2;
        const dx = pos.x + Math.cos(angle) * droneRadius;
        const dy = pos.y + Math.sin(angle) * droneRadius;
        const dronePos = new Vector2D(dx, dy);

        for (const enemy of this.enemies) {
          if (!enemy.isActive()) continue;
          const dist = enemy.getPosition().distanceTo(dronePos);
          if (dist < enemy.getSize() + 6) {
            enemy.takeDamage(droneDamage);
            if (!enemy.isAlive()) {
              const ePos = enemy.getPosition();
              this.particleSystem.createExplosion(ePos.x, ePos.y, enemy.getColor(), 12, 180);
              this.eventBus.emit(GameEvent.ZOMBIE_KILLED, {
                type: enemy.getType(),
                score: enemy.getScoreValue(),
                exp: enemy.getExpValue(),
                x: ePos.x,
                y: ePos.y,
              });
            }
          }
        }
      }
    }

    // Auto explosion
    this.collisionManager.checkAutoExplosion(this.player, this.enemies);
  }

  private cleanup(): void {
    this.enemies = this.enemies.filter((e) => e.isActive());
    this.bullets = this.bullets.filter((b) =>
      b.isActive() && !b.isOffScreen(this.canvas.width, this.canvas.height),
    );
    this.enemyBullets = this.enemyBullets.filter((b) =>
      b.isActive() && !b.isOffScreen(this.canvas.width, this.canvas.height),
    );
    this.powerUps = this.powerUps.filter((p) => p.isActive());
    this.expOrbs = this.expOrbs.filter((o) => o.isActive());
    this.grenades = this.grenades.filter((g) => g.isActive());
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.drawBackground();

    if (
      this.gameState === GameState.PLAYING ||
      this.gameState === GameState.PAUSED ||
      this.gameState === GameState.LEVEL_UP ||
      this.gameState === GameState.CARD_SELECTION
    ) {
      this.renderer.renderObjects(this.powerUps);
      this.renderer.renderObjects(this.expOrbs);
      this.renderer.renderObjects(this.grenades);
      this.renderer.renderObjects(this.enemies);
      
      const ctx = this.renderer.getContext();
      for (const enemy of this.enemies) {
         if (enemy.getIsBoss() && enemy.isBossInvincible()) {
             const x = enemy.getPosition().x;
             const y = enemy.getPosition().y;
             const r = enemy.getSize() + 20;
             
             ctx.save();
             // Golden rotating dashed shield
             ctx.strokeStyle = '#ffd700';
             ctx.lineWidth = 6;
             ctx.setLineDash([15, 10]);
             ctx.lineDashOffset = -performance.now() / 20;
             ctx.beginPath();
             ctx.arc(x, y, r, 0, Math.PI * 2);
             ctx.stroke();
             
             // Inner glow
             ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
             ctx.beginPath();
             ctx.arc(x, y, r, 0, Math.PI * 2);
             ctx.fill();
             ctx.restore();
         }
      }
      this.renderer.renderObjects(this.bullets);
      this.renderer.renderObjects(this.enemyBullets);
      this.renderer.renderObjects([this.player]);

      this.particleSystem.render(this.renderer.getContext());

      const mousePos = this.inputManager.getMousePosition();
      this.renderer.drawCrosshair(mousePos.x, mousePos.y);
    }
  }

  private gameOver(): void {
    const accuracy = this.totalShots > 0 ? Math.round((this.totalHits / this.totalShots) * 100) : 0;
    
    let favoriteWeapon = 'None';
    let maxKills = 0;
    for (const [weapon, kills] of Object.entries(this.weaponKills)) {
      if (kills > maxKills) {
        maxKills = kills;
        favoriteWeapon = weapon;
      }
    }

    const data: GameOverData = {
      score: this.score,
      wave: this.waveManager.getCurrentWave(),
      zombiesKilled: this.totalKills,
      level: this.expSystem.getLevel(),
      accuracy,
      favoriteWeapon,
    };
    AudioSystem.getInstance().stopBGM();
    this.setGameState(GameState.GAME_OVER);
    this.eventBus.emit(GameEvent.GAME_OVER, data);
  }

  private setGameState(state: GameState): void {
    this.gameState = state;
    this.eventBus.emit(GameEvent.GAME_STATE_CHANGED, { state });
    this.onStateChange?.(state);
  }

  resume(): void {
    if (this.gameState === GameState.PAUSED) {
      // Clear stale keys (e.g. Escape, W, A held at pause time) so the player
      // doesn't immediately drift or the game doesn't instantly re-pause.
      this.inputManager.clearInputs();
      this.player.setMoveDirection(Vector2D.zero());
      this.player.setFiring(false);
      this.lastFrameTime = performance.now();
      this.setGameState(GameState.PLAYING);
    }
  }

  pause(): void {
    if (this.gameState === GameState.PLAYING) {
      this.setGameState(GameState.PAUSED);
    }
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getScore(): number {
    return this.score;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.waveManager.updateCanvasSize(width, height);
    if (this.player) {
      this.player.updateCanvasSize(width, height);
    }
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Unsubscribe all engine-level event listeners to prevent memory leaks and duplicate events
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
    
    this.inputManager.destroy();
  }
}
