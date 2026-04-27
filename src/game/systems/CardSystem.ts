// ============================================================
// CardSystem.ts — Power-up card pool and selection logic
// Uses Factory-like creation for cards based on rarity
// ============================================================

import {
  PowerUpCard,
  CardRarity,
  CardEffectType,
} from '../interfaces/types';
import { randomElement } from '../utils/MathUtils';

/**
 * Maximum number of times a stackable power-up card can be picked.
 */
const MAX_STACK = 5;

/**
 * Effect types that do NOT count toward the stack cap
 * (consumables, one-time unlocks, ammo refills).
 */
const NON_STACKABLE: Set<CardEffectType> = new Set([
  CardEffectType.HEAL,
  CardEffectType.AMMO_REFILL,
  CardEffectType.FLAMETHROWER_UNLOCK,
  CardEffectType.FLAMETHROWER_AMMO,
  CardEffectType.LASER_RIFLE_UNLOCK,
  CardEffectType.LASER_RIFLE_AMMO,
  CardEffectType.CROSSBOW_UNLOCK,
  CardEffectType.CROSSBOW_AMMO,
]);

/**
 * The full card pool — all available power-up cards.
 * Organized by rarity tier for weighted random selection.
 */
const CARD_POOL: PowerUpCard[] = [
  // ===== COMMON =====
  {
    id: 'heal_small',
    name: 'First Aid',
    description: 'Restore 30 HP instantly. +10% more HP gained after each wave.',
    rarity: CardRarity.COMMON,
    effectType: CardEffectType.HEAL,
    value: 30,
    icon: '❤️',
  },
  {
    id: 'ammo_refill',
    name: 'Ammo Crate',
    description: 'Refill Shotgun to 30 and Rifle to 90 rounds. +10% more ammo gained after each wave.',
    rarity: CardRarity.COMMON,
    effectType: CardEffectType.AMMO_REFILL,
    value: 1,
    icon: '🔫',
  },
  {
    id: 'speed_boost',
    name: 'Adrenaline',
    description: '+15% movement speed',
    rarity: CardRarity.COMMON,
    effectType: CardEffectType.SPEED_BOOST,
    value: 0.15,
    icon: '💨',
  },

  // ===== UNCOMMON =====
  {
    id: 'max_hp_up',
    name: 'Reinforced Armor',
    description: '+25 Max HP (and heals)',
    rarity: CardRarity.UNCOMMON,
    effectType: CardEffectType.MAX_HEALTH_UP,
    value: 25,
    icon: '🛡️',
  },
  {
    id: 'damage_boost',
    name: 'Hollow Points',
    description: '+40% damage for all weapons',
    rarity: CardRarity.UNCOMMON,
    effectType: CardEffectType.DAMAGE_BOOST,
    value: 0.40,
    icon: '💥',
  },
  {
    id: 'fire_rate_boost',
    name: 'Quick Hands',
    description: '+30% fire rate for all weapons',
    rarity: CardRarity.UNCOMMON,
    effectType: CardEffectType.FIRE_RATE_BOOST,
    value: 0.30,
    icon: '⚡',
  },

  // ===== RARE =====
  {
    id: 'piercing',
    name: 'Piercing Rounds',
    description: '+1 pierce per stack. Bullets pass through more enemies.',
    rarity: CardRarity.RARE,
    effectType: CardEffectType.PIERCING_BULLETS,
    value: 1,
    icon: '🗡️',
  },
  {
    id: 'lifesteal',
    name: 'Vampiric Touch',
    description: '+1 HP per kill. Stacks per level',
    rarity: CardRarity.RARE,
    effectType: CardEffectType.LIFESTEAL,
    value: 0.05,
    icon: '🧛',
  },
  {
    id: 'explosive',
    name: 'Explosive Rounds',
    description: 'Bullets explode on hit. Starts weak, stacks up radius & damage.',
    rarity: CardRarity.RARE,
    effectType: CardEffectType.EXPLOSIVE_BULLETS,
    value: 1,
    icon: '💣',
  },

  // ===== EPIC =====
  {
    id: 'double_gun',
    name: 'Dual Wield',
    description: 'x2 shots! Fires a second set of bullets per trigger.',
    rarity: CardRarity.EPIC,
    effectType: CardEffectType.DOUBLE_GUN,
    value: 1,
    icon: '🔱',
  },
  {
    id: 'shield_aura',
    name: 'Shield Generator',
    description: 'Block 1 hit. -1.5s cooldown per stack (min 3s).',
    rarity: CardRarity.EPIC,
    effectType: CardEffectType.SHIELD_AURA,
    value: 1,
    icon: '🔰',
  },
  {
    id: 'freeze_aura',
    name: 'Cryo Field',
    description: 'Slow nearby enemies. Starts small, +20 radius & +8% slow per stack.',
    rarity: CardRarity.EPIC,
    effectType: CardEffectType.FREEZE_AURA,
    value: 1,
    icon: '❄️',
  },

  // ===== LEGENDARY =====
  {
    id: 'bullet_storm',
    name: 'Bullet Storm',
    description: '+1 extra shot per trigger. Stacks for massive volleys!',
    rarity: CardRarity.LEGENDARY,
    effectType: CardEffectType.BULLET_STORM,
    value: 1,
    icon: '🌪️',
  },
  {
    id: 'auto_explosion',
    name: 'Nova Pulse',
    description: 'Auto-explode every 5s. Starts weak, scales up damage per stack.',
    rarity: CardRarity.LEGENDARY,
    effectType: CardEffectType.AUTO_EXPLOSION,
    value: 1,
    icon: '☢️',
  },
  {
    id: 'orbital_drones',
    name: 'Orbital Strike',
    description: 'Starts with 3 orbiting drones, +1 per stack. Damages enemies on contact.',
    rarity: CardRarity.LEGENDARY,
    effectType: CardEffectType.ORBITAL_DRONES,
    value: 1,
    icon: '🛸',
  },
  {
    id: 'flamethrower_unlock',
    name: 'Dragon\'s Breath',
    description: 'Unlocks the Flamethrower (Weapon 4) and grants 120 fuel.',
    rarity: CardRarity.EPIC,
    effectType: CardEffectType.FLAMETHROWER_UNLOCK,
    value: 1,
    icon: '🔥',
  },
  {
    id: 'flamethrower_ammo',
    name: 'Napalm Fuel',
    description: '+150 Flamethrower fuel.',
    rarity: CardRarity.UNCOMMON,
    effectType: CardEffectType.FLAMETHROWER_AMMO,
    value: 150,
    icon: '🛢️',
  },
  {
    id: 'critical_hit',
    name: 'Critical Strike',
    description: '+15% chance to deal 3x damage per stack.',
    rarity: CardRarity.RARE,
    effectType: CardEffectType.CRITICAL_HIT,
    value: 0.15,
    icon: '🎯',
  },
  {
    id: 'magnet_pull',
    name: 'Magnetic Coil',
    description: 'Auto-collects drops instantly within 200px per stack.',
    rarity: CardRarity.UNCOMMON,
    effectType: CardEffectType.MAGNET_PULL,
    value: 200,
    icon: '🧲',
  },

  // ===== NEW WEAPON UNLOCKS =====
  {
    id: 'laser_rifle_unlock',
    name: 'Photon Core',
    description: 'Unlocks the Laser Rifle (Weapon 5) and grants 100 energy.',
    rarity: CardRarity.EPIC,
    effectType: CardEffectType.LASER_RIFLE_UNLOCK,
    value: 1,
    icon: '⚡',
  },
  {
    id: 'laser_rifle_ammo',
    name: 'Energy Cell',
    description: '+100 Laser Rifle energy.',
    rarity: CardRarity.UNCOMMON,
    effectType: CardEffectType.LASER_RIFLE_AMMO,
    value: 100,
    icon: '🔋',
  },
  {
    id: 'crossbow_unlock',
    name: 'Ancient Crossbow',
    description: 'Unlocks the Crossbow (Weapon 6) and grants 20 bolts.',
    rarity: CardRarity.LEGENDARY,
    effectType: CardEffectType.CROSSBOW_UNLOCK,
    value: 1,
    icon: '🏹',
  },
  {
    id: 'crossbow_ammo',
    name: 'Quiver of Bolts',
    description: '+15 Crossbow bolts.',
    rarity: CardRarity.UNCOMMON,
    effectType: CardEffectType.CROSSBOW_AMMO,
    value: 15,
    icon: '🎯',
  },
];

/**
 * Rarity weights — scales with wave. More tiers for smoother progression.
 */
function getRarityWeights(wave: number): Map<CardRarity, number> {
  const weights = new Map<CardRarity, number>();

  if (wave <= 1) {
    weights.set(CardRarity.COMMON, 70);
    weights.set(CardRarity.UNCOMMON, 25);
    weights.set(CardRarity.RARE, 5);
    weights.set(CardRarity.EPIC, 0);
    weights.set(CardRarity.LEGENDARY, 0);
  } else if (wave <= 3) {
    weights.set(CardRarity.COMMON, 45);
    weights.set(CardRarity.UNCOMMON, 35);
    weights.set(CardRarity.RARE, 15);
    weights.set(CardRarity.EPIC, 5);
    weights.set(CardRarity.LEGENDARY, 0);
  } else if (wave <= 5) {
    weights.set(CardRarity.COMMON, 30);
    weights.set(CardRarity.UNCOMMON, 30);
    weights.set(CardRarity.RARE, 25);
    weights.set(CardRarity.EPIC, 12);
    weights.set(CardRarity.LEGENDARY, 3);
  } else if (wave <= 7) {
    weights.set(CardRarity.COMMON, 15);
    weights.set(CardRarity.UNCOMMON, 25);
    weights.set(CardRarity.RARE, 30);
    weights.set(CardRarity.EPIC, 20);
    weights.set(CardRarity.LEGENDARY, 10);
  } else if (wave <= 10) {
    weights.set(CardRarity.COMMON, 5);
    weights.set(CardRarity.UNCOMMON, 15);
    weights.set(CardRarity.RARE, 30);
    weights.set(CardRarity.EPIC, 30);
    weights.set(CardRarity.LEGENDARY, 20);
  } else {
    // Wave 11+: legendary-heavy
    weights.set(CardRarity.COMMON, 0);
    weights.set(CardRarity.UNCOMMON, 10);
    weights.set(CardRarity.RARE, 20);
    weights.set(CardRarity.EPIC, 35);
    weights.set(CardRarity.LEGENDARY, 35);
  }

  return weights;
}

/**
 * Weighted random rarity selection.
 */
function pickRarity(wave: number): CardRarity {
  const weights = getRarityWeights(wave);
  const total = Array.from(weights.values()).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;

  for (const [rarity, weight] of weights) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }

  return CardRarity.COMMON;
}

/**
 * Minimum rarity guaranteed for one slot based on wave.
 */
function getGuaranteedMinRarity(wave: number): CardRarity | null {
  if (wave >= 8) return CardRarity.EPIC;
  if (wave >= 5) return CardRarity.RARE;
  if (wave >= 3) return CardRarity.UNCOMMON;
  return null;
}

/**
 * CardSystem manages the power-up card selection between waves.
 * Tracks which cards the player has collected (their build).
 */
export class CardSystem {
  private collectedCards: PowerUpCard[];

  constructor() {
    this.collectedCards = [];
  }

  /**
   * Generate 3 random cards for the player to choose from.
   * Rarity is weighted by wave. One slot has guaranteed minimum rarity.
   * Cards CAN repeat — stacking amplifies their effects.
   */
  generateCardChoices(wave: number): PowerUpCard[] {
    const choices: PowerUpCard[] = [];
    const usedInThisSelection = new Set<string>();

    // Slot 1: guaranteed minimum rarity (if applicable)
    const minRarity = getGuaranteedMinRarity(wave);
    if (minRarity) {
      const rarityOrder = [CardRarity.COMMON, CardRarity.UNCOMMON, CardRarity.RARE, CardRarity.EPIC, CardRarity.LEGENDARY];
      const minIdx = rarityOrder.indexOf(minRarity);
      const eligibleRarities = rarityOrder.slice(minIdx);
      const guaranteedPool = CARD_POOL.filter(
        (c) => eligibleRarities.includes(c.rarity) && !usedInThisSelection.has(c.id) &&
               !this.isFilteredOut(c),
      );
      if (guaranteedPool.length > 0) {
        const card = randomElement(guaranteedPool);
        choices.push(card);
        usedInThisSelection.add(card.id);
      }
    }

    // Fill remaining slots — no duplicate within same selection, but cards
    // the player already owns CAN appear again (enabling stacking)
    while (choices.length < 3) {
      const rarity = pickRarity(wave);
      const pool = CARD_POOL.filter(
        (c) => c.rarity === rarity && !usedInThisSelection.has(c.id) &&
               !this.isFilteredOut(c),
      );

      if (pool.length === 0) {
        const fallback = CARD_POOL.filter((c) => !usedInThisSelection.has(c.id) &&
                                          !this.isFilteredOut(c));
        if (fallback.length === 0) break;
        const card = randomElement(fallback);
        choices.push(card);
        usedInThisSelection.add(card.id);
      } else {
        const card = randomElement(pool);
        choices.push(card);
        usedInThisSelection.add(card.id);
      }
    }

    // Mark stack counts for display
    return choices.map((c) => {
      const count = this.getEffectCount(c.effectType);
      if (count > 0) {
        return { ...c, name: `${c.name} Lv.${count + 1}` };
      }
      return c;
    });
  }

  /**
   * Record a card as collected.
   */
  collectCard(card: PowerUpCard): void {
    this.collectedCards.push(card);
  }

  /**
   * Get all collected cards.
   */
  getCollectedCards(): PowerUpCard[] {
    return [...this.collectedCards];
  }

  /**
   * Check if player has a specific effect type.
   */
  hasEffect(effectType: CardEffectType): boolean {
    return this.collectedCards.some((c) => c.effectType === effectType);
  }

  /**
   * Get the total stacked value for an effect.
   * Some effects can stack (e.g., damage boost, speed boost).
   */
  getEffectValue(effectType: CardEffectType): number {
    return this.collectedCards
      .filter((c) => c.effectType === effectType)
      .reduce((sum, c) => sum + c.value, 0);
  }

  /**
   * Count how many of a specific effect the player has.
   */
  getEffectCount(effectType: CardEffectType): number {
    return this.collectedCards.filter((c) => c.effectType === effectType).length;
  }

  /**
   * Check if a card should be filtered out of the pool.
   * - Ammo cards for weapons not yet unlocked
   * - Stackable cards that hit the MAX_STACK cap
   */
  private isFilteredOut(card: PowerUpCard): boolean {
    // Hide ammo cards for weapons not unlocked yet
    if (card.id === 'flamethrower_ammo' && !this.hasEffect(CardEffectType.FLAMETHROWER_UNLOCK)) return true;
    if (card.id === 'laser_rifle_ammo' && !this.hasEffect(CardEffectType.LASER_RIFLE_UNLOCK)) return true;
    if (card.id === 'crossbow_ammo' && !this.hasEffect(CardEffectType.CROSSBOW_UNLOCK)) return true;
    // Hide unlock cards already owned (one-time)
    if (card.id === 'flamethrower_unlock' && this.hasEffect(CardEffectType.FLAMETHROWER_UNLOCK)) return true;
    if (card.id === 'laser_rifle_unlock' && this.hasEffect(CardEffectType.LASER_RIFLE_UNLOCK)) return true;
    if (card.id === 'crossbow_unlock' && this.hasEffect(CardEffectType.CROSSBOW_UNLOCK)) return true;
    // Stack cap for stackable effects
    if (!NON_STACKABLE.has(card.effectType) && this.getEffectCount(card.effectType) >= MAX_STACK) return true;
    return false;
  }

  /**
   * Reset for new game.
   */
  loadProgress(cards: PowerUpCard[]): void {
    this.collectedCards = [...cards];
  }

  reset(): void {
    this.collectedCards = [];
  }
}
