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
import { EnemyBullet } from '../entities/EnemyBullet';
import { NormalZombie } from '../entities/NormalZombie';
import { Pistol } from '../weapons/Pistol';
import { Shotgun } from '../weapons/Shotgun';
import { Rifle } from '../weapons/Rifle';
import { IWeaponStrategy } from '../interfaces/IWeaponStrategy';
import { InputManager } from './InputManager';
import { CollisionManager } from './CollisionManager';
import { WaveManager } from './WaveManager';
import { Renderer } from './Renderer';
import { ParticleSystem } from '../particles/ParticleSystem';
import { EventBus } from '../events/EventBus';
import { CardSystem } from '../systems/CardSystem';
import { Vector2D } from '../utils/Vector2D';

export class GameEngine {
  private renderer: Renderer;
  private inputManager: InputManager;
  private collisionManager: CollisionManager;
  private waveManager: WaveManager;
  private particleSystem: ParticleSystem;
  private cardSystem: CardSystem;
  private eventBus: EventBus;

  private gameState: GameState;
  private score: number;
  private totalKills: number;
  private lastFrameTime: number;
  private animationFrameId: number | null;

  private player!: Player;
  private enemies: Enemy[];
  private bullets: Bullet[];
  private enemyBullets: EnemyBullet[];
  private powerUps: PowerUp[];

  private weapons: IWeaponStrategy[];
  private currentWeaponIndex: number;
  private canvas: HTMLCanvasElement;

  private waveTextAlpha: number;
  private waveTextTimer: number;

  // Card selection
  private pendingCardChoices: PowerUpCard[];

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

    this.weapons = [new Pistol(), new Shotgun(), new Rifle()];
    this.currentWeaponIndex = 0;

    this.waveTextAlpha = 0;
    this.waveTextTimer = 0;
    this.pendingCardChoices = [];

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.subscribe(GameEvent.ZOMBIE_KILLED, (data: unknown) => {
      const killData = data as { score: number; x: number; y: number; weaponName?: string };
      this.score += killData.score;
      this.totalKills++;
      this.eventBus.emit(GameEvent.SCORE_CHANGED, { score: this.score, kills: this.totalKills });
      this.waveManager.onZombieKilled();

      // Random drop: Ammo box (20% chance)
      if (Math.random() < 0.2) {
        // Drop 10-20 ammo. The player will get this when they collide with the box.
        const dropAmount = 10 + Math.floor(Math.random() * 11);
        this.powerUps.push(new PowerUp(killData.x, killData.y, PowerUpType.AMMO, dropAmount));
      }
    });

    this.eventBus.subscribe(GameEvent.WAVE_COMPLETE, () => {
      this.score += 50;
      this.eventBus.emit(GameEvent.SCORE_CHANGED, { score: this.score });

      // Spawn power-ups
      const newPowerUps = this.waveManager.generatePowerUps();
      this.powerUps.push(...newPowerUps);

      this.waveTextAlpha = 1;
      this.waveTextTimer = 0;

      // Generate card choices and switch to card selection
      const cards = this.cardSystem.generateCardChoices(
        this.waveManager.getCurrentWave(),
      );
      this.pendingCardChoices = cards;

      // Delay card selection slightly for wave complete animation
      setTimeout(() => {
        if (this.gameState === GameState.PLAYING) {
          this.setGameState(GameState.CARD_SELECTION);
          this.onCardChoices?.(cards);
        }
      }, 1200);
    });

    this.eventBus.subscribe(GameEvent.WAVE_CHANGED, () => {
      this.waveTextAlpha = 1;
      this.waveTextTimer = 0;
    });

    // Enemy shooting — ShooterZombie fires via event
    this.eventBus.subscribe(GameEvent.ENEMY_SHOOT, (data: unknown) => {
      const d = data as { x: number; y: number; dirX: number; dirY: number; speed: number; damage: number };
      this.enemyBullets.push(new EnemyBullet(d.x, d.y, d.dirX, d.dirY, d.speed, d.damage));
    });

    // SpawnerZombie creates minions via event
    this.eventBus.subscribe(GameEvent.SPAWN_MINION, (data: unknown) => {
      const d = data as { x: number; y: number };
      const minion = new NormalZombie(d.x, d.y, 0.5, 1.2); // weak but fast minions
      this.enemies.push(minion);
    });
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

    // Clear stale input state — fixes stuck movement after card overlay
    this.inputManager.clearInputs();
    this.player.setMoveDirection(Vector2D.zero());
    this.player.setFiring(false);
    this.lastFrameTime = performance.now();

    this.setGameState(GameState.PLAYING);
  }

  getCollectedCards(): PowerUpCard[] {
    return this.cardSystem.getCollectedCards();
  }

  startGame(): void {
    this.score = 0;
    this.totalKills = 0;
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.powerUps = [];
    this.particleSystem.clear();
    this.cardSystem.reset();
    EventBus.resetInstance();
    this.eventBus = EventBus.getInstance();
    this.setupEventListeners();
    this.waveManager = new WaveManager(this.canvas.width, this.canvas.height);

    this.player = new Player(
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.weapons[0],
      this.canvas.width,
      this.canvas.height,
    );
    this.currentWeaponIndex = 0;

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

    this.render();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private handleInput(): void {
    this.player.setMoveDirection(this.inputManager.getMoveDirection());
    this.player.setMousePosition(this.inputManager.getMousePosition());
    this.player.setFiring(this.inputManager.isMouseDown());

    if (this.inputManager.consumeKey('1')) this.switchWeapon(0);
    if (this.inputManager.consumeKey('2')) this.switchWeapon(1);
    if (this.inputManager.consumeKey('3')) this.switchWeapon(2);

    if (this.inputManager.consumeKey('Escape')) {
      // Clear all held keys + reset player so nothing is "stuck" during the pause
      this.inputManager.clearInputs();
      this.player.setMoveDirection(Vector2D.zero());
      this.player.setFiring(false);
      this.setGameState(GameState.PAUSED);
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

    // Player firing
    const bulletConfigs = this.player.tryFire(currentTime);
    if (bulletConfigs) {
      for (const config of bulletConfigs) {
        this.bullets.push(
          new Bullet(
            config.x, config.y,
            config.dirX, config.dirY,
            config.speed, config.damage,
            config.size, config.color,
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

    // Update power-ups
    for (const powerUp of this.powerUps) powerUp.update(deltaTime);

    // Update particles
    this.particleSystem.update(deltaTime);

    // Wave manager
    const activeEnemyCount = this.enemies.filter((e) => e.isActive()).length;
    const newEnemies = this.waveManager.update(deltaTime, activeEnemyCount);
    this.enemies.push(...newEnemies);

    // Wave text
    if (this.waveTextAlpha > 0) {
      this.waveTextTimer += deltaTime;
      if (this.waveTextTimer > 1.5) {
        this.waveTextAlpha -= deltaTime * 2;
      }
    }

    // Player death check
    if (!this.player.isAlive()) {
      this.gameOver();
    }
  }

  private checkCollisions(): void {
    this.collisionManager.checkBulletEnemyCollisions(this.bullets, this.enemies, this.player);
    this.collisionManager.checkEnemyPlayerCollisions(this.enemies, this.player);
    this.collisionManager.checkEnemyBulletPlayerCollisions(this.enemyBullets, this.player);
    this.collisionManager.checkPlayerPowerUpCollisions(this.player, this.powerUps);

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
  }

  private render(): void {
    this.renderer.clear();
    this.renderer.drawBackground();

    if (
      this.gameState === GameState.PLAYING ||
      this.gameState === GameState.PAUSED ||
      this.gameState === GameState.CARD_SELECTION
    ) {
      this.renderer.renderObjects(this.powerUps);
      this.renderer.renderObjects(this.enemies);
      this.renderer.renderObjects(this.bullets);
      this.renderer.renderObjects(this.enemyBullets);
      this.renderer.renderObjects([this.player]);

      this.particleSystem.render(this.renderer.getContext());

      const mousePos = this.inputManager.getMousePosition();
      this.renderer.drawCrosshair(mousePos.x, mousePos.y);

      if (this.waveTextAlpha > 0) {
        this.renderer.drawWaveText(
          this.waveManager.getCurrentWave(),
          this.waveTextAlpha,
        );
      }
    }
  }

  private gameOver(): void {
    const data: GameOverData = {
      score: this.score,
      wave: this.waveManager.getCurrentWave(),
      zombiesKilled: this.waveManager.getTotalZombiesKilled(),
    };
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
    this.inputManager.destroy();
    this.eventBus.clear();
  }
}
