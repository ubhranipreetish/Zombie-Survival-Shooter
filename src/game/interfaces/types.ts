// ============================================================
// types.ts — Core type definitions for the game
// ============================================================

/**
 * Represents the possible states of the game.
 * Used by GameEngine to manage transitions between screens.
 */
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  LEVEL_UP = 'LEVEL_UP',         // brief pause showing level-up banner before card screen
  CARD_SELECTION = 'CARD_SELECTION',
}

/**
 * Types of zombies available in the game.
 * Used by ZombieFactory to determine which subclass to instantiate.
 */
export enum ZombieType {
  NORMAL = 'NORMAL',
  FAST = 'FAST',
  TANK = 'TANK',
  SHOOTER = 'SHOOTER',
  SHIELD = 'SHIELD',
  SPAWNER = 'SPAWNER',
  // Boss types (every 5 waves)
  BOSS_NECROMANCER = 'BOSS_NECROMANCER',
  BOSS_JUGGERNAUT = 'BOSS_JUGGERNAUT',
  BOSS_HYDRA = 'BOSS_HYDRA',
  BOSS_PHANTOM = 'BOSS_PHANTOM',
  BOSS_WARDEN = 'BOSS_WARDEN',
  // Boss-specific troops
  BOSS_TROOP_UNDEAD = 'BOSS_TROOP_UNDEAD',
  BOSS_TROOP_BERSERKER = 'BOSS_TROOP_BERSERKER',
  BOSS_TROOP_SPITTER = 'BOSS_TROOP_SPITTER',
}

/**
 * Types of power-ups that can spawn between waves.
 */
export enum PowerUpType {
  HEALTH = 'HEALTH',
  AMMO_SHOTGUN = 'AMMO_SHOTGUN',
  AMMO_RIFLE = 'AMMO_RIFLE',
  AMMO_FLAMETHROWER = 'AMMO_FLAMETHROWER',
}

/**
 * Card rarity tiers — determines visual style and power level.
 */
export enum CardRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

/**
 * Categories of power-up card effects.
 */
export enum CardEffectType {
  // Common
  HEAL = 'HEAL',
  AMMO_REFILL = 'AMMO_REFILL',
  SPEED_BOOST = 'SPEED_BOOST',
  // Uncommon
  MAX_HEALTH_UP = 'MAX_HEALTH_UP',
  DAMAGE_BOOST = 'DAMAGE_BOOST',
  FIRE_RATE_BOOST = 'FIRE_RATE_BOOST',
  MAGNET_PULL = 'MAGNET_PULL',
  FLAMETHROWER_AMMO = 'FLAMETHROWER_AMMO',
  // Rare
  PIERCING_BULLETS = 'PIERCING_BULLETS',
  LIFESTEAL = 'LIFESTEAL',
  EXPLOSIVE_BULLETS = 'EXPLOSIVE_BULLETS',
  CRITICAL_HIT = 'CRITICAL_HIT',
  // Epic
  BULLET_STORM = 'BULLET_STORM',
  SHIELD_AURA = 'SHIELD_AURA',
  FREEZE_AURA = 'FREEZE_AURA',
  FLAMETHROWER_UNLOCK = 'FLAMETHROWER_UNLOCK',
  // Legendary (modify character model)
  DOUBLE_GUN = 'DOUBLE_GUN',
  AUTO_EXPLOSION = 'AUTO_EXPLOSION',
  ORBITAL_DRONES = 'ORBITAL_DRONES',
  // New weapon unlocks
  LASER_RIFLE_UNLOCK = 'LASER_RIFLE_UNLOCK',
  LASER_RIFLE_AMMO = 'LASER_RIFLE_AMMO',
  CROSSBOW_UNLOCK = 'CROSSBOW_UNLOCK',
  CROSSBOW_AMMO = 'CROSSBOW_AMMO',
}

/**
 * A power-up card definition.
 */
export interface PowerUpCard {
  id: string;
  name: string;
  description: string;
  rarity: CardRarity;
  effectType: CardEffectType;
  value: number;           // magnitude of the effect
  icon: string;            // emoji/symbol for the card
  duration?: number;       // permanent if undefined
}

/**
 * Event names used by the Observer pattern (EventBus).
 * Decouples game logic from UI updates.
 */
export enum GameEvent {
  SCORE_CHANGED = 'SCORE_CHANGED',
  WAVE_CHANGED = 'WAVE_CHANGED',
  PLAYER_HEALTH_CHANGED = 'PLAYER_HEALTH_CHANGED',
  WEAPON_CHANGED = 'WEAPON_CHANGED',
  GAME_OVER = 'GAME_OVER',
  GAME_STATE_CHANGED = 'GAME_STATE_CHANGED',
  ZOMBIE_KILLED = 'ZOMBIE_KILLED',
  WAVE_COMPLETE = 'WAVE_COMPLETE',
  POWERUP_COLLECTED = 'POWERUP_COLLECTED',
  AMMO_CHANGED = 'AMMO_CHANGED',
  CARD_SELECTION_READY = 'CARD_SELECTION_READY',
  CARD_SELECTED = 'CARD_SELECTED',
  ENEMY_SHOOT = 'ENEMY_SHOOT',
  SPAWN_MINION = 'SPAWN_MINION',
  BOSS_HEALTH_CHANGED = 'BOSS_HEALTH_CHANGED',
  BOSS_DEFEATED = 'BOSS_DEFEATED',
  PLAYER_STATS_CHANGED = 'PLAYER_STATS_CHANGED',
  ABILITY_CHANGED = 'ABILITY_CHANGED',
  ABILITY_COOLDOWN = 'ABILITY_COOLDOWN',
  EXP_CHANGED = 'EXP_CHANGED',
  LEVEL_UP = 'LEVEL_UP',
  CRIT_HIT = 'CRIT_HIT',
  HUD_READY = 'HUD_READY',
}

/**
 * Data payload for game over events.
 */
export interface GameOverData {
  score: number;
  wave: number;
  zombiesKilled: number;
  level?: number;
  accuracy?: number;
  favoriteWeapon?: string;
}

/**
 * Configuration for spawning zombies in a wave.
 */
export interface WaveConfig {
  waveNumber: number;
  totalZombies: number;
  zombieTypes: ZombieType[];
  spawnInterval: number;
  healthMultiplier: number;
  speedMultiplier: number;
  damageMultiplier: number;
}

/**
 * Rarity colors for rendering
 */
export const RARITY_COLORS: Record<CardRarity, { border: string; glow: string; bg: string; text: string }> = {
  [CardRarity.COMMON]: {
    border: '#9e9e9e',
    glow: 'rgba(158, 158, 158, 0.3)',
    bg: 'rgba(158, 158, 158, 0.08)',
    text: '#bdbdbd',
  },
  [CardRarity.UNCOMMON]: {
    border: '#4caf50',
    glow: 'rgba(76, 175, 80, 0.3)',
    bg: 'rgba(76, 175, 80, 0.08)',
    text: '#66bb6a',
  },
  [CardRarity.RARE]: {
    border: '#2196f3',
    glow: 'rgba(33, 150, 243, 0.3)',
    bg: 'rgba(33, 150, 243, 0.08)',
    text: '#42a5f5',
  },
  [CardRarity.EPIC]: {
    border: '#ab47bc',
    glow: 'rgba(171, 71, 188, 0.4)',
    bg: 'rgba(171, 71, 188, 0.1)',
    text: '#ce93d8',
  },
  [CardRarity.LEGENDARY]: {
    border: '#ff9800',
    glow: 'rgba(255, 152, 0, 0.5)',
    bg: 'rgba(255, 152, 0, 0.12)',
    text: '#ffb74d',
  },
};
