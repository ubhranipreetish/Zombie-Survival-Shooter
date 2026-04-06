// ============================================================
// ZombieFactory.ts — Factory Method Pattern
// Creates all zombie types including 3 boss types
// Open/Closed: new types added here without changing GameEngine
// ============================================================

import { Enemy } from '../entities/Enemy';
import { NormalZombie } from '../entities/NormalZombie';
import { FastZombie } from '../entities/FastZombie';
import { TankZombie } from '../entities/TankZombie';
import { ShooterZombie } from '../entities/ShooterZombie';
import { ShieldZombie } from '../entities/ShieldZombie';
import { SpawnerZombie } from '../entities/SpawnerZombie';
import { NecromancerBoss } from '../entities/NecromancerBoss';
import { JuggernautBoss } from '../entities/JuggernautBoss';
import { HydraBoss } from '../entities/HydraBoss';
import { PhantomBoss } from '../entities/PhantomBoss';
import { WardenBoss } from '../entities/WardenBoss';
import { BossTroopUndead } from '../entities/BossTroopUndead';
import { BossTroopBerserker } from '../entities/BossTroopBerserker';
import { BossTroopSpitter } from '../entities/BossTroopSpitter';
import { ZombieType } from '../interfaces/types';

export class ZombieFactory {
  static createZombie(
    type: ZombieType,
    x: number,
    y: number,
    healthMultiplier: number = 1,
    speedMultiplier: number = 1,
    canvasW: number = 1200,
    canvasH: number = 800,
  ): Enemy {
    switch (type) {
      case ZombieType.NORMAL:
        return new NormalZombie(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.FAST:
        return new FastZombie(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.TANK:
        return new TankZombie(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.SHOOTER:
        return new ShooterZombie(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.SHIELD:
        return new ShieldZombie(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.SPAWNER:
        return new SpawnerZombie(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.BOSS_NECROMANCER:
        return new NecromancerBoss(x, y, healthMultiplier, speedMultiplier, canvasW, canvasH);
      case ZombieType.BOSS_JUGGERNAUT:
        return new JuggernautBoss(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.BOSS_HYDRA:
        return new HydraBoss(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.BOSS_PHANTOM:
        return new PhantomBoss(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.BOSS_WARDEN:
        return new WardenBoss(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.BOSS_TROOP_UNDEAD:
        return new BossTroopUndead(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.BOSS_TROOP_BERSERKER:
        return new BossTroopBerserker(x, y, healthMultiplier, speedMultiplier);
      case ZombieType.BOSS_TROOP_SPITTER:
        return new BossTroopSpitter(x, y, healthMultiplier, speedMultiplier);
      default:
        return new NormalZombie(x, y, healthMultiplier, speedMultiplier);
    }
  }
}
