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
  CARD_SELECTION = 'CARD_SELECTION', // New: picking upgrades between waves
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
}

/**
 * Types of power-ups that can spawn between waves.
 */
export enum PowerUpType {
  HEALTH = 'HEALTH',
  AMMO_SHOTGUN = 'AMMO_SHOTGUN',
  AMMO_RIFLE = 'AMMO_RIFLE',
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
  // Rare
  PIERCING_BULLETS = 'PIERCING_BULLETS',
  LIFESTEAL = 'LIFESTEAL',
  EXPLOSIVE_BULLETS = 'EXPLOSIVE_BULLETS',
  // Epic
  BULLET_STORM = 'BULLET_STORM',
  SHIELD_AURA = 'SHIELD_AURA',
  FREEZE_AURA = 'FREEZE_AURA',
  // Legendary (modify character model)
  DOUBLE_GUN = 'DOUBLE_GUN',
  AUTO_EXPLOSION = 'AUTO_EXPLOSION',
  ORBITAL_DRONES = 'ORBITAL_DRONES',
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
}

/**
 * Data payload for game over events.
 */
export interface GameOverData {
  score: number;
  wave: number;
  zombiesKilled: number;
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
