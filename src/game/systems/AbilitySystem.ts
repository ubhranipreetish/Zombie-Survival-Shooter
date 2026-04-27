// ============================================================
// AbilitySystem.ts — Spacebar-triggered boss abilities
// Earned by defeating bosses: Grenade → Teleport+Bomb → Bouncing Bullets
// ============================================================

import { EventBus } from '../events/EventBus';
import { GameEvent } from '../interfaces/types';

export enum AbilityType {
  NONE = 'NONE',
  GRENADE = 'GRENADE',
  TELEPORT_BOMB = 'TELEPORT_BOMB',
  BOUNCING_BULLETS = 'BOUNCING_BULLETS',
}

export interface AbilityAction {
  type: AbilityType;
  targetX: number;
  targetY: number;
}

export class AbilitySystem {
  private currentAbility: AbilityType = AbilityType.NONE;
  private cooldownTimer: number = 0;
  private cooldownDuration: number = 0;
  private activeTimer: number = 0;        // for timed abilities (bouncing bullets)
  private activeDuration: number = 0;
  private isAbilityActive: boolean = false;  // for timed abilities
  private abilityLevel: number = 0;       // upgrade on repeat boss kills

  // Cooldown durations per ability
  private static readonly COOLDOWNS: Record<AbilityType, number> = {
    [AbilityType.NONE]: 0,
    [AbilityType.GRENADE]: 3,
    [AbilityType.TELEPORT_BOMB]: 8,
    [AbilityType.BOUNCING_BULLETS]: 12,
  };

  grantAbility(type: AbilityType): void {
    if (this.currentAbility === type) {
      // Upgrade existing ability
      this.abilityLevel++;
    } else {
      this.currentAbility = type;
      this.abilityLevel = 1;
    }
    this.cooldownTimer = 0;
    this.cooldownDuration = AbilitySystem.COOLDOWNS[type];

    if (type === AbilityType.BOUNCING_BULLETS) {
      this.activeDuration = 7;
    }

    EventBus.getInstance().emit(GameEvent.ABILITY_CHANGED, {
      ability: type,
      level: this.abilityLevel,
    });
  }

  tryActivate(mouseX: number, mouseY: number): AbilityAction | null {
    if (this.currentAbility === AbilityType.NONE) return null;
    if (this.cooldownTimer > 0) return null;

    // For bouncing bullets, check if already active
    if (this.currentAbility === AbilityType.BOUNCING_BULLETS && this.isAbilityActive) {
      return null;
    }

    // Start cooldown
    this.cooldownTimer = this.cooldownDuration;

    // For bouncing bullets, start active timer
    if (this.currentAbility === AbilityType.BOUNCING_BULLETS) {
      this.isAbilityActive = true;
      this.activeTimer = this.activeDuration + this.abilityLevel; // +1s per level
    }

    return {
      type: this.currentAbility,
      targetX: mouseX,
      targetY: mouseY,
    };
  }

  emitUpdate(): void {
    if (this.currentAbility === AbilityType.NONE) return;
    EventBus.getInstance().emit(GameEvent.ABILITY_COOLDOWN, {
      ability: this.currentAbility,
      cooldownRemaining: this.cooldownTimer,
      cooldownTotal: this.cooldownDuration,
      isActive: this.isAbilityActive,
      activeRemaining: this.activeTimer,
      level: this.abilityLevel,
    });
  }

  update(deltaTime: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - deltaTime);
    }

    if (this.isAbilityActive) {
      this.activeTimer -= deltaTime;
      if (this.activeTimer <= 0) {
        this.isAbilityActive = false;
        this.activeTimer = 0;
      }
    }

    // Emit cooldown state for HUD
    if (this.currentAbility !== AbilityType.NONE) {
      EventBus.getInstance().emit(GameEvent.ABILITY_COOLDOWN, {
        ability: this.currentAbility,
        cooldownRemaining: this.cooldownTimer,
        cooldownTotal: this.cooldownDuration,
        isActive: this.isAbilityActive,
        activeRemaining: this.activeTimer,
        level: this.abilityLevel,
      });
    }
  }

  getCurrentAbility(): AbilityType {
    return this.currentAbility;
  }

  getAbilityLevel(): number {
    return this.abilityLevel;
  }

  isBouncingActive(): boolean {
    return this.currentAbility === AbilityType.BOUNCING_BULLETS && this.isAbilityActive;
  }

  getGrenadeDamage(): number {
    return 60 + this.abilityLevel * 20; // 80, 100, 120...
  }

  getGrenadeRadius(): number {
    return 100 + this.abilityLevel * 20; // 120, 140, 160...
  }

  getTeleportBombDamage(): number {
    return 100 + this.abilityLevel * 20; // 120, 140...
  }

  getTeleportBombRadius(): number {
    return 130 + this.abilityLevel * 20; // 150, 170...
  }

  reset(): void {
    this.currentAbility = AbilityType.NONE;
    this.cooldownTimer = 0;
    this.cooldownDuration = 0;
    this.activeTimer = 0;
    this.activeDuration = 0;
    this.isAbilityActive = false;
    this.abilityLevel = 0;
  }
}
