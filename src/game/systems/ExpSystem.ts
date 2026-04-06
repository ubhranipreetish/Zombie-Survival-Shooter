// ============================================================
// ExpSystem.ts — Player EXP, leveling, and card triggers
// EXP required scales: 100 * level^1.4 (gets harder each level)
// ============================================================

import { EventBus } from '../events/EventBus';
import { GameEvent } from '../interfaces/types';

export class ExpSystem {
  private exp: number = 0;
  private level: number = 1;
  private pendingLevelUps: number = 0;

  getExpForLevel(level: number): number {
    // Level 1→2: 70, then *1.25 each level: 88, 110, 137, 171...
    return Math.floor(70 * Math.pow(1.25, level - 1));
  }

  getExp(): number { return this.exp; }
  getLevel(): number { return this.level; }
  getExpToNext(): number { return this.getExpForLevel(this.level); }

  addExp(amount: number): void {
    this.exp += amount;
    let threshold = this.getExpForLevel(this.level);

    while (this.exp >= threshold) {
      this.exp -= threshold;
      this.level++;
      this.pendingLevelUps++;
      threshold = this.getExpForLevel(this.level);
    }

    EventBus.getInstance().emit(GameEvent.EXP_CHANGED, {
      exp: this.exp,
      expToNext: this.getExpForLevel(this.level),
      level: this.level,
    });
  }

  consumeLevelUp(): boolean {
    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps--;
      EventBus.getInstance().emit(GameEvent.LEVEL_UP, { level: this.level });
      return true;
    }
    return false;
  }

  reset(): void {
    this.exp = 0;
    this.level = 1;
    this.pendingLevelUps = 0;
  }
}
