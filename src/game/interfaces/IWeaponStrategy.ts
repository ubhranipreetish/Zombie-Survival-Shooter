// ============================================================
// IWeaponStrategy.ts — Strategy Pattern interface
// Allows swapping weapon behavior at runtime without modifying
// the Player class (Open/Closed Principle).
// ============================================================

import { Vector2D } from '../utils/Vector2D';

/**
 * Represents a bullet configuration returned by a weapon's fire method.
 */
export interface BulletConfig {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  damage: number;
  size: number;
  color: string;
}

/**
 * Strategy interface for weapon behavior.
 * Each weapon implements this interface differently:
 * - Pistol: single accurate shot
 * - Shotgun: spread of pellets
 * - Rifle: fast precise shots
 *
 * The Player holds a reference to IWeaponStrategy and calls fire()
 * without knowing the concrete weapon type — Polymorphism + Strategy Pattern.
 */
export interface IWeaponStrategy {
  readonly name: string;
  readonly fireRate: number;       // shots per second
  readonly damage: number;         // base damage per bullet
  readonly maxAmmo: number;        // max ammo capacity
  readonly color: string;          // HUD color for this weapon

  /**
   * Fires the weapon from a given origin in a given direction.
   * Returns an array of BulletConfigs (shotgun returns multiple).
   */
  fire(origin: Vector2D, direction: Vector2D): BulletConfig[];

  /**
   * Time in milliseconds between shots (derived from fireRate).
   */
  getFireInterval(): number;
}
