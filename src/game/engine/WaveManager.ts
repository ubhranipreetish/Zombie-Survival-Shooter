// ============================================================
// WaveManager.ts — Controls wave progression and difficulty
// Zombies get faster, stronger, more numerous each wave
// Boss zombie every 5 waves
// ============================================================

import { Enemy } from '../entities/Enemy';
import { PowerUp } from '../entities/PowerUp';
import { ZombieFactory } from '../factories/ZombieFactory';
import { EventBus } from '../events/EventBus';
import { GameEvent, ZombieType, PowerUpType, WaveConfig } from '../interfaces/types';
import { randomEdgePosition, randomBetween } from '../utils/MathUtils';

export class WaveManager {
  private currentWave: number;
  private enemiesSpawned: number;
  private waveConfig: WaveConfig;
  private spawnTimer: number;
  private waveTransitionTimer: number;
  private isTransitioning: boolean;
  private waitingForCardSelection: boolean;
  private canvasWidth: number;
  private canvasHeight: number;
  private eventBus: EventBus;
  private totalZombiesKilled: number;
  private bossSpawned: boolean;

  constructor(canvasWidth: number, canvasHeight: number, startWave: number = 1) {
    this.currentWave = startWave - 1; // It increments to startWave on first transition
    this.enemiesSpawned = 0;
    this.spawnTimer = 0;
    this.waveTransitionTimer = 0;
    this.isTransitioning = true;
    this.waitingForCardSelection = false;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.eventBus = EventBus.getInstance();
    this.totalZombiesKilled = 0;
    this.bossSpawned = false;
    this.waveConfig = this.generateWaveConfig(startWave);
  }

  private generateWaveConfig(wave: number): WaveConfig {
    const types: ZombieType[] = [ZombieType.NORMAL];
    if (wave >= 3) types.push(ZombieType.FAST);
    if (wave >= 4) types.push(ZombieType.SHOOTER);
    if (wave >= 5) types.push(ZombieType.TANK);
    if (wave >= 6) types.push(ZombieType.SHIELD);
    if (wave >= 7) types.push(ZombieType.SPAWNER);

    // Aggressive scaling:
    // - More zombies: 6 + wave*3 (was 5 + wave*2)
    // - Faster spawning
    // - HP: +20% per wave (was +10%)
    // - Speed: +8% per wave (was +5%)
    // - Damage scales implicitly via tougher zombie types
    return {
      waveNumber: wave,
      totalZombies: 6 + wave * 3,
      zombieTypes: types,
      spawnInterval: Math.max(200, 900 - wave * 60),
      healthMultiplier: 1 + (wave - 1) * 0.10, // Reduced from 0.20 down to 0.10
      speedMultiplier: 1 + (wave - 1) * 0.08,
      damageMultiplier: 1 + (wave - 1) * 0.15,
    };
  }

  private getBossType(wave: number): ZombieType {
    const bossIndex = Math.floor(wave / 5) % 5;
    switch (bossIndex) {
      case 0: return ZombieType.BOSS_NECROMANCER;
      case 1: return ZombieType.BOSS_JUGGERNAUT;
      case 2: return ZombieType.BOSS_HYDRA;
      case 3: return ZombieType.BOSS_PHANTOM;
      case 4: return ZombieType.BOSS_WARDEN;
      default: return ZombieType.BOSS_NECROMANCER;
    }
  }

  /** Returns the troop type that spawns alongside this boss */
  private getBossTroopType(bossType: ZombieType): ZombieType {
    switch (bossType) {
      case ZombieType.BOSS_NECROMANCER: return ZombieType.BOSS_TROOP_UNDEAD;
      case ZombieType.BOSS_JUGGERNAUT: return ZombieType.BOSS_TROOP_BERSERKER;
      case ZombieType.BOSS_HYDRA: return ZombieType.BOSS_TROOP_SPITTER;
      case ZombieType.BOSS_PHANTOM: return ZombieType.BOSS_TROOP_UNDEAD;
      case ZombieType.BOSS_WARDEN: return ZombieType.BOSS_TROOP_BERSERKER;
      default: return ZombieType.BOSS_TROOP_UNDEAD;
    }
  }

  startNextWave(): void {
    this.currentWave++;
    this.waveConfig = this.generateWaveConfig(this.currentWave);
    this.enemiesSpawned = 0;
    this.spawnTimer = 0;
    this.isTransitioning = false;
    this.waitingForCardSelection = false;
    this.bossSpawned = false;

    this.eventBus.emit(GameEvent.WAVE_CHANGED, {
      wave: this.currentWave,
      totalZombies: this.waveConfig.totalZombies,
    });
  }

  update(deltaTime: number, currentEnemyCount: number): Enemy[] {
    const newEnemies: Enemy[] = [];

    if (this.waitingForCardSelection) {
      return newEnemies;
    }

    if (this.isTransitioning) {
      this.waveTransitionTimer += deltaTime;
      if (this.waveTransitionTimer >= 2.0) {
        this.waveTransitionTimer = 0;
        this.startNextWave();
      }
      return newEnemies;
    }

    // Spawn boss on boss waves (every 5th)
    if (this.currentWave % 5 === 0 && !this.bossSpawned) {
      this.bossSpawned = true;
      const pos = randomEdgePosition(this.canvasWidth, this.canvasHeight);
      const bossType = this.getBossType(this.currentWave);
      const boss = ZombieFactory.createZombie(
        bossType, pos.x, pos.y,
        this.waveConfig.healthMultiplier,
        this.waveConfig.speedMultiplier,
        this.canvasWidth,
        this.canvasHeight,
      );
      boss.setDamageMultiplier(this.waveConfig.damageMultiplier);
      newEnemies.push(boss);
    }

    // Spawn zombies — boss troops on boss waves, regular otherwise
    this.spawnTimer += deltaTime * 1000;
    if (
      this.spawnTimer >= this.waveConfig.spawnInterval &&
      this.enemiesSpawned < this.waveConfig.totalZombies
    ) {
      this.spawnTimer = 0;

      const pos = randomEdgePosition(this.canvasWidth, this.canvasHeight);
      let type: ZombieType;

      if (this.isBossWave()) {
        // Boss waves: only spawn boss-specific troops
        const bossType = this.getBossType(this.currentWave);
        type = this.getBossTroopType(bossType);
      } else {
        type = this.waveConfig.zombieTypes[
          Math.floor(Math.random() * this.waveConfig.zombieTypes.length)
        ];
      }

      const enemy = ZombieFactory.createZombie(
        type, pos.x, pos.y,
        this.waveConfig.healthMultiplier,
        this.waveConfig.speedMultiplier,
        this.canvasWidth,
        this.canvasHeight,
      );
      
      enemy.setDamageMultiplier(this.waveConfig.damageMultiplier);

      newEnemies.push(enemy);
      this.enemiesSpawned++;
    }

    // Wave complete — no card selection, transition immediately
    if (
      this.enemiesSpawned >= this.waveConfig.totalZombies &&
      currentEnemyCount === 0
    ) {
      this.isTransitioning = true;
      this.waitingForCardSelection = false;
      this.eventBus.emit(GameEvent.WAVE_COMPLETE, {
        wave: this.currentWave,
      });
    }

    return newEnemies;
  }

  onCardSelected(): void {
    this.waitingForCardSelection = false;
    this.waveTransitionTimer = 0;
  }

  onZombieKilled(): void {
    this.totalZombiesKilled++;
  }

  generatePowerUps(): PowerUp[] {
    const powerUps: PowerUp[] = [];
    const margin = 80;
    const minSep = 80; // minimum separation between drops

    const cx = randomBetween(margin, this.canvasWidth - margin);
    const cy = randomBetween(margin, this.canvasHeight - margin);

    powerUps.push(new PowerUp(cx, cy, PowerUpType.HEALTH, 30));

    if (this.currentWave % 2 === 0) {
      const isShotgun = Math.random() < 0.5;
      // Place ammo at least minSep away from health orb
      const angle = Math.random() * Math.PI * 2;
      const ax = Math.min(Math.max(cx + Math.cos(angle) * minSep, margin), this.canvasWidth - margin);
      const ay = Math.min(Math.max(cy + Math.sin(angle) * minSep, margin), this.canvasHeight - margin);
      powerUps.push(new PowerUp(
        ax, ay,
        isShotgun ? PowerUpType.AMMO_SHOTGUN : PowerUpType.AMMO_RIFLE,
        isShotgun ? 10 : 20,
      ));
    }

    return powerUps;
  }

  getCurrentWave(): number { return this.currentWave; }
  getTotalZombiesKilled(): number { return this.totalZombiesKilled; }
  isInTransition(): boolean { return this.isTransitioning; }
  isWaitingForCard(): boolean { return this.waitingForCardSelection; }
  isBossWave(): boolean { return this.currentWave % 5 === 0; }

  updateCanvasSize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
}
