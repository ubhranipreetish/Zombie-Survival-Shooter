// ============================================================
// SpawnerZombie.ts — Boss-type that spawns minion zombies
// Demonstrates: Polymorphism, Observer Pattern (spawn events)
// ============================================================

import { Enemy } from './Enemy';
import { ZombieType } from '../interfaces/types';
import { EventBus } from '../events/EventBus';
import { GameEvent } from '../interfaces/types';

/**
 * A large zombie that periodically spawns small minion zombies.
 * Must be killed to stop the flood. Introduced at wave 7.
 */
export class SpawnerZombie extends Enemy {
  private spawnCooldown: number;
  private spawnTimer: number;
  private maxSpawns: number;
  private spawnsRemaining: number;
  private pulsePhase: number;

  constructor(x: number, y: number, healthMultiplier: number = 1, speedMultiplier: number = 1) {
    super(
      x, y,
      22,                            // large
      120 * healthMultiplier,        // high health (must focus fire)
      35 * speedMultiplier,          // very slow
      15,                            // moderate contact damage
      30,                            // high score (mini-boss)
    );
    this.spawnCooldown = 4.0;
    this.spawnTimer = 2.0;           // first spawn at 2s
    this.maxSpawns = 6;
    this.spawnsRemaining = 6;
    this.pulsePhase = 0;
  }

  getColor(): string {
    return '#e65100'; // deep orange
  }

  protected getGlowColor(): string {
    return 'rgba(230, 81, 0, 0.25)';
  }

  getType(): ZombieType {
    return ZombieType.SPAWNER;
  }

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.pulsePhase += deltaTime;

    // Spawn minions periodically
    if (this.spawnsRemaining > 0) {
      this.spawnTimer += deltaTime;
      if (this.spawnTimer >= this.spawnCooldown) {
        this.spawnTimer = 0;
        this.spawnsRemaining--;

        // Emit spawn event — GameEngine creates the minion
        EventBus.getInstance().emit(GameEvent.SPAWN_MINION, {
          x: this.position.x + (Math.random() - 0.5) * 40,
          y: this.position.y + (Math.random() - 0.5) * 40,
          parentId: this.getType(),
        });
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx);

    const x = this.position.x;
    const y = this.position.y;

    // Spawn readiness indicator (pulsing ring)
    if (this.spawnsRemaining > 0) {
      const pulseScale = 1 + Math.sin(this.pulsePhase * 3) * 0.1;
      const chargePercent = this.spawnTimer / this.spawnCooldown;

      ctx.strokeStyle = `rgba(255, 152, 0, ${chargePercent * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, this.size * 1.6 * pulseScale, 0, Math.PI * 2 * chargePercent);
      ctx.stroke();
    }

    // Spawn counter dots
    const dotRadius = 3;
    const dotDistance = this.size + 14;
    for (let i = 0; i < this.maxSpawns; i++) {
      const angle = (i / this.maxSpawns) * Math.PI * 2 - Math.PI / 2;
      const dx = x + Math.cos(angle) * dotDistance;
      const dy = y + Math.sin(angle) * dotDistance;

      ctx.fillStyle = i < this.spawnsRemaining
        ? '#ff9800'
        : 'rgba(255, 152, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(dx, dy, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
