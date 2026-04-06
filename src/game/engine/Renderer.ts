// ============================================================
// Renderer.ts — Canvas rendering orchestrator
// Single Responsibility: only handles drawing to canvas
// Dependency Inversion: works with IRenderable, not concrete types
// ============================================================

import { IRenderable } from '../interfaces/IRenderable';

/**
 * Manages the canvas rendering pipeline.
 *
 * SRP: Only responsible for drawing. Does not update game state.
 * DIP: Accepts IRenderable[] — works with any renderable object
 * without knowing its concrete type.
 */
export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private gridOpacity: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D rendering context');
    this.ctx = context;
    this.gridOpacity = 0.07;
  }

  /** Clear the canvas */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Draw the background */
  drawBackground(): void {
    // Dark ground
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2,
      0,
      this.canvas.width / 2, this.canvas.height / 2,
      Math.max(this.canvas.width, this.canvas.height) * 0.7,
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f1a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle grid pattern
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.gridOpacity})`;
    this.ctx.lineWidth = 0.5;
    const gridSize = 50;

    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
  }

  /** Render an array of IRenderable objects (Polymorphism in action) */
  renderObjects(objects: IRenderable[]): void {
    for (const obj of objects) {
      obj.render(this.ctx);
    }
  }

  /** Draw wave transition text */
  drawWaveText(wave: number, alpha: number): void {
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 48px "Orbitron", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Glow effect
    this.ctx.shadowColor = '#00bcd4';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText(
      `WAVE ${wave}`,
      this.canvas.width / 2,
      this.canvas.height / 2,
    );

    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;
  }

  /** Draw crosshair at mouse position */
  drawCrosshair(x: number, y: number): void {
    const size = 15;
    const gap = 5;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.lineWidth = 1.5;

    // Horizontal lines
    this.ctx.beginPath();
    this.ctx.moveTo(x - size, y);
    this.ctx.lineTo(x - gap, y);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(x + gap, y);
    this.ctx.lineTo(x + size, y);
    this.ctx.stroke();

    // Vertical lines
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - size);
    this.ctx.lineTo(x, y - gap);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(x, y + gap);
    this.ctx.lineTo(x, y + size);
    this.ctx.stroke();

    // Center dot
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.beginPath();
    this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /** Get the canvas rendering context */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /** Get canvas dimensions */
  getWidth(): number {
    return this.canvas.width;
  }

  getHeight(): number {
    return this.canvas.height;
  }
}
