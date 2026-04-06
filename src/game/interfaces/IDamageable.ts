// ============================================================
// IDamageable.ts — Interface Segregation Principle
// Only entities that can take damage implement this.
// ============================================================

/**
 * Contract for any entity that has health and can be damaged.
 * Bullets and PowerUps do NOT implement this — they don't take damage.
 * This is Interface Segregation in action.
 */
export interface IDamageable {
  takeDamage(amount: number): void;
  isAlive(): boolean;
  getHealth(): number;
  getMaxHealth(): number;
}
