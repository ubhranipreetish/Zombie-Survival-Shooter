// ============================================================
// InputManager.ts — Captures and normalizes user input
// Single Responsibility: only handles input, no game logic
// ============================================================

import { Vector2D } from '../utils/Vector2D';
import { AudioSystem } from '../systems/AudioSystem';

/**
 * Manages keyboard and mouse input state.
 * Provides a clean query API for other systems (Player, GameEngine).
 *
 * SRP: This class only captures input. It doesn't decide what
 * to do with that input — that's the Player's and GameEngine's job.
 */
export class InputManager {
  private keys: Set<string>;
  private mousePosition: Vector2D;
  private mouseDown: boolean;
  private canvas: HTMLCanvasElement;

  // Key bindings
  private static readonly MOVE_UP = ['w', 'W', 'ArrowUp'];
  private static readonly MOVE_DOWN = ['s', 'S', 'ArrowDown'];
  private static readonly MOVE_LEFT = ['a', 'A', 'ArrowLeft'];
  private static readonly MOVE_RIGHT = ['d', 'D', 'ArrowRight'];

  constructor(canvas: HTMLCanvasElement) {
    this.keys = new Set();
    this.mousePosition = Vector2D.zero();
    this.mouseDown = false;
    this.canvas = canvas;

    this.bindEvents();
  }

  private bindEvents(): void {
    // Keyboard
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // If the window loses focus (alt-tab, devtools click, etc.) the browser
    // suppresses the keyup event, leaving keys stuck in the Set and causing
    // the player to keep drifting forever.  Clearing on blur/visibility fixes this.
    window.addEventListener('blur', this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    // Mouse
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mouseup', this.onMouseUp);

    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key);
    AudioSystem.getInstance().init();
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key);
  };

  /** Clear all input when the window loses focus to avoid stuck keys. */
  private onWindowBlur = (): void => {
    this.clearInputs();
  };

  /** Clear all input when the tab is hidden (e.g. switching tabs). */
  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.clearInputs();
    }
  };

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mousePosition = new Vector2D(
      e.clientX - rect.left,
      e.clientY - rect.top,
    );
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0) { // left click only
      this.mouseDown = true;
      AudioSystem.getInstance().init();
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.mouseDown = false;
    }
  };

  /**
   * Returns normalized movement direction based on WASD/Arrow keys.
   * Returns zero vector if no movement keys are pressed.
   */
  getMoveDirection(): Vector2D {
    let x = 0;
    let y = 0;

    if (this.isAnyKeyDown(InputManager.MOVE_LEFT)) x -= 1;
    if (this.isAnyKeyDown(InputManager.MOVE_RIGHT)) x += 1;
    if (this.isAnyKeyDown(InputManager.MOVE_UP)) y -= 1;
    if (this.isAnyKeyDown(InputManager.MOVE_DOWN)) y += 1;

    const dir = new Vector2D(x, y);
    return dir.magnitude() > 0 ? dir.normalize() : dir;
  }

  /** Get current mouse position relative to canvas */
  getMousePosition(): Vector2D {
    return this.mousePosition;
  }

  /** Is the left mouse button currently held down? */
  isMouseDown(): boolean {
    return this.mouseDown;
  }

  /** Check if a specific key is currently pressed */
  isKeyDown(key: string): boolean {
    return this.keys.has(key);
  }

  /** Check if any key in a list is pressed */
  private isAnyKeyDown(keys: string[]): boolean {
    return keys.some((k) => this.keys.has(k));
  }

  /** Check if a key was just pressed (one-shot detection) */
  consumeKey(key: string): boolean {
    if (this.keys.has(key)) {
      this.keys.delete(key);
      return true;
    }
    return false;
  }

  /** Clear all held input state (used after UI overlays) */
  clearInputs(): void {
    this.keys.clear();
    this.mouseDown = false;
  }

  /** Clean up event listeners */
  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
  }
}
