// ============================================================
// EventBus.ts — Observer Pattern implementation
// Decouples game engine from UI: the HUD subscribes to events
// like SCORE_CHANGED without the engine knowing about React.
// ============================================================

import { GameEvent } from '../interfaces/types';

type EventCallback = (data?: unknown) => void;

/**
 * A publish/subscribe event bus implementing the Observer Pattern.
 *
 * - Publishers (game engine, WaveManager, etc.) call emit()
 * - Subscribers (HUD, GameOverScreen, etc.) call subscribe()
 * - Neither side knows about the other — loose coupling
 *
 * This is a Singleton to ensure all parts of the game
 * share the same event bus instance.
 */
export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, EventCallback[]>;

  private constructor() {
    this.listeners = new Map();
  }

  /** Singleton access — ensures one shared event bus */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe a callback to an event.
   * Returns an unsubscribe function for cleanup.
   */
  subscribe(event: GameEvent | string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function (useful for React useEffect cleanup)
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event with optional data payload.
   * All registered callbacks for this event are invoked.
   */
  emit(event: GameEvent | string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  /**
   * Remove all listeners. Used when resetting the game.
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Reset the singleton instance. Useful for testing or full game restart.
   */
  static resetInstance(): void {
    if (EventBus.instance) {
      EventBus.instance.clear();
    }
    EventBus.instance = new EventBus();
  }
}
