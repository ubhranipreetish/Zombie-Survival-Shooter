'use client';
// ============================================================
// HUD.tsx — Heads-Up Display overlay
// Observer Pattern: subscribes to EventBus events
// Now includes boss health bar and player stats panel
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

interface PlayerStats {
  damageMultiplier: number;
  fireRateMultiplier: number;
  moveSpeed: number;
  pierceCount: number;
  explosionLevel: number;
  bulletBlastPercent: number;
  extraGunCount: number;
  bulletStormCount: number;
  lifestealPercent: number;
  shieldLevel: number;
  shieldCooldown: number;
  freezeLevel: number;
  freezeRadius: number;
  freezeStrength: number;
  autoExplosionLevel: number;
  autoExplosionDamage: number;
  droneCount: number;
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
  const [stats, setStats] = useState<PlayerStats>({
    damageMultiplier: 1,
    fireRateMultiplier: 1,
    moveSpeed: 200,
    pierceCount: 0,
    explosionLevel: 0,
    bulletBlastPercent: 0,
    extraGunCount: 0,
    bulletStormCount: 1,
    lifestealPercent: 0,
    shieldLevel: 0,
    shieldCooldown: 8,
    freezeLevel: 0,
    freezeRadius: 0,
    freezeStrength: 0,
    autoExplosionLevel: 0,
    autoExplosionDamage: 0,
    droneCount: 0,
  });

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

    const unsubStats = eventBus.subscribe(GameEvent.PLAYER_STATS_CHANGED, (data: unknown) => {
      setStats(data as PlayerStats);
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
      unsubStats();
    };
  }, []);

  const healthPercent = (health / maxHealth) * 100;
  const healthColor = healthPercent > 60 ? '#4caf50' :
                      healthPercent > 30 ? '#ff9800' : '#f44336';

  // Build active effects list from stats
  const activeEffects: { label: string; level: number; icon: string; color: string }[] = [];
  if (stats) {
    if (stats.pierceCount > 0)
      activeEffects.push({ label: 'Pierce', level: stats.pierceCount, icon: '🗡️', color: '#90caf9' });
    if (stats.explosionLevel > 0)
      activeEffects.push({ label: 'Explosion', level: stats.explosionLevel, icon: '💣', color: '#ff6600' });
    if (stats.extraGunCount > 0)
      activeEffects.push({ label: 'Dual Guns', level: stats.extraGunCount, icon: '🔱', color: '#ce93d8' });
    if (stats.bulletStormCount > 1)
      activeEffects.push({ label: 'Bullet Storm', level: stats.bulletStormCount - 1, icon: '🌪️', color: '#ffab40' });
    if (stats.lifestealPercent > 0)
      activeEffects.push({ label: 'Lifesteal', level: Math.round(stats.lifestealPercent * 100), icon: '🧛', color: '#ef5350' });
    if (stats.shieldLevel > 0)
      activeEffects.push({ label: 'Shield', level: stats.shieldLevel, icon: '🔰', color: '#00e5ff' });
    if (stats.freezeLevel > 0)
      activeEffects.push({ label: 'Cryo Field', level: stats.freezeLevel, icon: '❄️', color: '#81d4fa' });
    if (stats.autoExplosionLevel > 0)
      activeEffects.push({ label: 'Nova Pulse', level: stats.autoExplosionLevel, icon: '☢️', color: '#ff5722' });
    if (stats.droneCount > 0)
      activeEffects.push({ label: 'Drones', level: stats.droneCount, icon: '🛸', color: '#b388ff' });
  }

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

      {/* Right Side: Player Stats Panel */}
      {stats && (
        <div className="hud-stats-panel">
          <div className="hud-stats-title">STATS</div>
          <div className="hud-stats-divider" />

          <div className="hud-stat-row">
            <span className="hud-stat-label">⚔ Damage</span>
            <span className="hud-stat-value" style={{ color: stats.damageMultiplier > 1 ? '#ffca28' : '#8888aa' }}>
              x{stats.damageMultiplier.toFixed(1)}
            </span>
          </div>

          <div className="hud-stat-row">
            <span className="hud-stat-label">⚡ Fire Rate</span>
            <span className="hud-stat-value" style={{ color: stats.fireRateMultiplier > 1 ? '#ffca28' : '#8888aa' }}>
              x{stats.fireRateMultiplier.toFixed(1)}
            </span>
          </div>

          <div className="hud-stat-row">
            <span className="hud-stat-label">🗡️ Pierce</span>
            <span className="hud-stat-value" style={{ color: stats.pierceCount > 0 ? '#90caf9' : '#8888aa' }}>
              {stats.pierceCount}
            </span>
          </div>

          <div className="hud-stat-row">
            <span className="hud-stat-label">💨 Speed</span>
            <span className="hud-stat-value" style={{ color: stats.moveSpeed > 200 ? '#4fc3f7' : '#8888aa' }}>
              {Math.round(stats.moveSpeed)}
            </span>
          </div>

          <div className="hud-stat-row">
            <span className="hud-stat-label">🔫 Shots/Trigger</span>
            <span className="hud-stat-value" style={{ color: (stats.bulletStormCount > 1 || stats.extraGunCount > 0) ? '#ffab40' : '#8888aa' }}>
              {stats.bulletStormCount + (stats.extraGunCount > 0 ? stats.bulletStormCount : 0)}
            </span>
          </div>

          {stats.bulletBlastPercent > 0 && (
            <div className="hud-stat-row">
              <span className="hud-stat-label">💥 Blast DMG</span>
              <span className="hud-stat-value" style={{ color: '#ff6600' }}>
                {stats.bulletBlastPercent}%
              </span>
            </div>
          )}

          {stats.autoExplosionLevel > 0 && (
            <div className="hud-stat-row">
              <span className="hud-stat-label">☢️ Self Blast</span>
              <span className="hud-stat-value" style={{ color: '#ff5722' }}>
                {Math.round(stats.autoExplosionDamage)}
              </span>
            </div>
          )}

          {stats.freezeLevel > 0 && (
            <div className="hud-stat-row">
              <span className="hud-stat-label">❄️ Slow</span>
              <span className="hud-stat-value" style={{ color: '#81d4fa' }}>
                {Math.round(stats.freezeStrength * 100)}%
              </span>
            </div>
          )}

          {/* Active Effects with levels */}
          {activeEffects.length > 0 && (
            <>
              <div className="hud-stats-divider" />
              <div className="hud-stats-subtitle">EFFECTS</div>
              {activeEffects.map((effect) => (
                <div key={effect.label} className="hud-effect-row">
                  <span className="hud-effect-icon">{effect.icon}</span>
                  <span className="hud-effect-label">{effect.label}</span>
                  <span className="hud-effect-level" style={{ color: effect.color }}>
                    Lv.{effect.level}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

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
