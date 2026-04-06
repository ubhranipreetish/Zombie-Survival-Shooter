'use client';
// ============================================================
// HUD.tsx — Heads-Up Display overlay
// Observer Pattern: subscribes to EventBus events
// Now includes boss health bar at top center
// ============================================================

import { useEffect, useState } from 'react';
import { EventBus } from '@/game/events/EventBus';
import { GameEvent } from '@/game/interfaces/types';

interface BossInfo {
  name: string;
  health: number;
  maxHealth: number;
  color: string;
}

export default function HUD() {
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [wave, setWave] = useState(0);
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);
  const [weaponName, setWeaponName] = useState('Pistol');
  const [weaponColor, setWeaponColor] = useState('#90caf9');
  const [ammo, setAmmo] = useState<number | string>('∞');
  const [showWaveComplete, setShowWaveComplete] = useState(false);
  const [boss, setBoss] = useState<BossInfo | null>(null);

  useEffect(() => {
    const eventBus = EventBus.getInstance();

    const unsubScore = eventBus.subscribe(GameEvent.SCORE_CHANGED, (data: unknown) => {
      const d = data as { score: number; kills?: number };
      setScore(d.score);
      if (d.kills !== undefined) setKills(d.kills);
    });

    const unsubWave = eventBus.subscribe(GameEvent.WAVE_CHANGED, (data: unknown) => {
      setWave((data as { wave: number }).wave);
      setShowWaveComplete(false);
      setBoss(null);
    });

    const unsubHealth = eventBus.subscribe(GameEvent.PLAYER_HEALTH_CHANGED, (data: unknown) => {
      const d = data as { health: number; maxHealth: number };
      setHealth(d.health);
      setMaxHealth(d.maxHealth);
    });

    const unsubWeapon = eventBus.subscribe(GameEvent.WEAPON_CHANGED, (data: unknown) => {
      const d = data as { name: string; color: string };
      setWeaponName(d.name);
      setWeaponColor(d.color);
    });

    const unsubAmmo = eventBus.subscribe(GameEvent.AMMO_CHANGED, (data: unknown) => {
      const d = data as { ammo: number; maxAmmo: number; weaponName: string };
      setAmmo(d.ammo === Infinity ? '∞' : d.ammo);
    });

    const unsubWaveComplete = eventBus.subscribe(GameEvent.WAVE_COMPLETE, () => {
      setShowWaveComplete(true);
      setTimeout(() => setShowWaveComplete(false), 2000);
    });

    const unsubBossHealth = eventBus.subscribe(GameEvent.BOSS_HEALTH_CHANGED, (data: unknown) => {
      const d = data as BossInfo;
      if (d.health > 0) {
        setBoss(d);
      } else {
        setBoss(null);
      }
    });

    const unsubBossDefeated = eventBus.subscribe(GameEvent.BOSS_DEFEATED, () => {
      setBoss(null);
    });

    return () => {
      unsubScore();
      unsubWave();
      unsubHealth();
      unsubWeapon();
      unsubAmmo();
      unsubWaveComplete();
      unsubBossHealth();
      unsubBossDefeated();
    };
  }, []);

  const healthPercent = (health / maxHealth) * 100;
  const healthColor = healthPercent > 60 ? '#4caf50' :
                      healthPercent > 30 ? '#ff9800' : '#f44336';

  return (
    <div id="game-hud" className="hud-container">
      {/* Boss Health Bar — top center */}
      {boss && (
        <div className="boss-health-container">
          <div className="boss-name" style={{ color: boss.color }}>
            ☠ {boss.name} ☠
          </div>
          <div className="boss-health-bar-bg">
            <div
              className="boss-health-bar-fill"
              style={{
                width: `${(boss.health / boss.maxHealth) * 100}%`,
                backgroundColor: boss.color,
                boxShadow: `0 0 12px ${boss.color}80`,
              }}
            />
          </div>
          <div className="boss-health-text">
            {Math.ceil(boss.health)} / {boss.maxHealth}
          </div>
        </div>
      )}

      {/* Top Left: Wave, Score, Kills */}
      <div className="hud-top-left">
        <div className="hud-wave">
          WAVE <span className="hud-wave-number">{wave}</span>
        </div>
        <div className="hud-score">
          SCORE: <span className="hud-score-value">{score.toLocaleString()}</span>
        </div>
        <div className="hud-score">
          KILLS: <span className="hud-score-value">{kills}</span>
        </div>
      </div>

      {/* Bottom Left: Health */}
      <div className="hud-bottom-left">
        <div className="hud-health-label">HP</div>
        <div className="hud-health-bar-bg">
          <div
            className="hud-health-bar-fill"
            style={{
              width: `${healthPercent}%`,
              backgroundColor: healthColor,
              boxShadow: `0 0 10px ${healthColor}80`,
            }}
          />
        </div>
        <div className="hud-health-text">
          {Math.ceil(health)} / {maxHealth}
        </div>
      </div>

      {/* Bottom Right: Weapon & Ammo */}
      <div className="hud-bottom-right">
        <div className="hud-weapon" style={{ color: weaponColor }}>
          {weaponName}
        </div>
        <div className="hud-ammo">
          AMMO: <span className="hud-ammo-value">{ammo}</span>
        </div>
        <div className="hud-weapon-slots">
          {['1: Pistol', '2: Shotgun', '3: Rifle'].map((label, idx) => (
            <div
              key={label}
              className={`hud-weapon-slot ${
                idx === ['Pistol', 'Shotgun', 'Rifle'].indexOf(weaponName)
                  ? 'hud-weapon-slot-active'
                  : ''
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Wave Complete Banner */}
      {showWaveComplete && (
        <div className="hud-wave-complete">
          WAVE {wave} COMPLETE!
        </div>
      )}
    </div>
  );
}
