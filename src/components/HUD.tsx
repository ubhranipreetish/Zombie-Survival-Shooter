'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { EventBus } from '@/game/events/EventBus';
import { GameEvent } from '@/game/interfaces/types';

interface BossInfo { name: string; health: number; maxHealth: number; color: string; skullThresholds?: number[]; skullsTriggered?: number; isInvincible?: boolean; }
interface PlayerStats {
  damageMultiplier: number; fireRateMultiplier: number; moveSpeed: number;
  pierceCount: number; explosionLevel: number; bulletBlastPercent: number;
  extraGunCount: number; bulletStormCount: number; lifestealPercent: number;
  shieldLevel: number; shieldCooldown: number; freezeLevel: number;
  freezeRadius: number; freezeStrength: number; autoExplosionLevel: number;
  autoExplosionDamage: number; droneCount: number; flamethrowerUnlocked: boolean;
  laserRifleUnlocked: boolean; crossbowUnlocked: boolean;
}
interface AbilityState {
  ability: string; cooldownRemaining: number; cooldownTotal: number;
  isActive: boolean; activeRemaining: number; level: number;
}

const ABILITY_META: Record<string, { icon: string; label: string; color: string }> = {
  GRENADE:          { icon: '💣', label: 'Grenade',   color: '#ff9800' },
  TELEPORT_BOMB:    { icon: '💜', label: 'Tele-Bomb', color: '#ce93d8' },
  BOUNCING_BULLETS: { icon: '🔵', label: 'Bounce',    color: '#29b6f6' },
  NONE:             { icon: '',   label: '',           color: '#555' },
};

// Banner types in priority order: LEVEL_UP shows first, WAVE_COMPLETE after, then WAVE_CHANGED
type BannerType = 'levelup' | 'wavecomplete' | 'wavechanged';

export default function HUD() {
  const [score, setScore]             = useState(0);
  const [kills, setKills]             = useState(0);
  const [wave, setWave]               = useState(0);
  const [health, setHealth]           = useState(100);
  const [maxHealth, setMaxHealth]     = useState(100);
  const [weaponName, setWeaponName]   = useState('Pistol');
  const [weaponColor, setWeaponColor] = useState('#90caf9');
  const [ammo, setAmmo]               = useState<number | string>('∞');
  const [boss, setBoss]               = useState<BossInfo | null>(null);
  const [stats, setStats]             = useState<PlayerStats>({
    damageMultiplier: 1, fireRateMultiplier: 1, moveSpeed: 200,
    pierceCount: 0, explosionLevel: 0, bulletBlastPercent: 0,
    extraGunCount: 0, bulletStormCount: 1, lifestealPercent: 0,
    shieldLevel: 0, shieldCooldown: 8, freezeLevel: 0,
    freezeRadius: 0, freezeStrength: 0, autoExplosionLevel: 0,
    autoExplosionDamage: 0, droneCount: 0, flamethrowerUnlocked: false,
    laserRifleUnlocked: false, crossbowUnlocked: false,
  });
  const [exp, setExp]                 = useState(0);
  const [expToNext, setExpToNext]     = useState(70);
  const [level, setLevel]             = useState(1);
  const [levelUpInline, setLevelUpInline] = useState(false); // inline glow next to bar
  const [ability, setAbility]         = useState<AbilityState>({
    ability: 'NONE', cooldownRemaining: 0, cooldownTotal: 0,
    isActive: false, activeRemaining: 0, level: 0,
  });

  // Floating CRIT texts
  const [crits, setCrits] = useState<{ id: number; x: number; y: number; text: string }[]>([]);
  const critIdRef = useRef(0);

  // Single banner slot — only one shows at a time, sequenced
  const [activeBanner, setActiveBanner] = useState<BannerType | null>(null);
  const bannerQueue = useRef<BannerType[]>([]);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bannerRunning = useRef(false);
  const levelInlineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const BANNER_DURATION: Record<BannerType, number> = { levelup: 1800, wavecomplete: 2000, wavechanged: 2500 };

  const drainQueue = useCallback(() => {
    if (bannerQueue.current.length === 0) {
      setActiveBanner(null);
      bannerRunning.current = false;
      return;
    }
    const next = bannerQueue.current.shift()!;
    bannerRunning.current = true;
    setActiveBanner(next);
    bannerTimer.current = setTimeout(() => {
      drainQueue();
    }, BANNER_DURATION[next]);
  }, []); // eslint-disable-line

  const enqueueBanner = useCallback((type: BannerType) => {
    if (bannerQueue.current.includes(type)) return;
    bannerQueue.current.push(type);
    if (!bannerRunning.current) {
      drainQueue();
    }
  }, [drainQueue]);

  useEffect(() => {
    const eb = EventBus.getInstance();

    const u1  = eb.subscribe(GameEvent.SCORE_CHANGED, (d: unknown) => {
      const data = d as { score: number; kills?: number };
      setScore(data.score);
      if (data.kills !== undefined) setKills(data.kills);
    });
    const u2  = eb.subscribe(GameEvent.WAVE_CHANGED, (d: unknown) => {
      setWave((d as { wave: number }).wave);
      setBoss(null);
      enqueueBanner('wavechanged');
    });
    const u3  = eb.subscribe(GameEvent.PLAYER_HEALTH_CHANGED, (d: unknown) => {
      const data = d as { health: number; maxHealth: number };
      setHealth(data.health); setMaxHealth(data.maxHealth);
    });
    const u4  = eb.subscribe(GameEvent.WEAPON_CHANGED, (d: unknown) => {
      const data = d as { name: string; color: string };
      setWeaponName(data.name); setWeaponColor(data.color);
    });
    const u5  = eb.subscribe(GameEvent.AMMO_CHANGED, (d: unknown) => {
      setAmmo((d as { ammo: number }).ammo === Infinity ? '∞' : (d as { ammo: number }).ammo);
    });
    const u6  = eb.subscribe(GameEvent.WAVE_COMPLETE, () => {
      enqueueBanner('wavecomplete');
    });
    const u7  = eb.subscribe(GameEvent.BOSS_HEALTH_CHANGED, (d: unknown) => {
      const data = d as BossInfo;
      setBoss(data.health > 0 ? data : null);
    });
    const u8  = eb.subscribe(GameEvent.BOSS_DEFEATED, () => setBoss(null));
    const u9  = eb.subscribe(GameEvent.PLAYER_STATS_CHANGED, (d: unknown) => setStats(d as PlayerStats));
    const u10 = eb.subscribe(GameEvent.EXP_CHANGED, (d: unknown) => {
      const data = d as { exp: number; expToNext: number; level: number };
      setExp(data.exp); setExpToNext(data.expToNext); setLevel(data.level);
    });
    const u11 = eb.subscribe(GameEvent.LEVEL_UP, () => {
      // Inline glow on EXP bar
      setLevelUpInline(true);
      if (levelInlineTimer.current) clearTimeout(levelInlineTimer.current);
      levelInlineTimer.current = setTimeout(() => setLevelUpInline(false), 1600);
      // Queued center banner
      enqueueBanner('levelup');
    });
    const u12 = eb.subscribe(GameEvent.ABILITY_COOLDOWN, (d: unknown) => setAbility(d as AbilityState));
    const u13 = eb.subscribe(GameEvent.ABILITY_CHANGED, (d: unknown) => {
      const data = d as { ability: string; level: number };
      setAbility(prev => ({ ...prev, ability: data.ability, level: data.level, cooldownRemaining: 0 }));
    });
    const u14 = eb.subscribe(GameEvent.CRIT_HIT, (d: unknown) => {
      const data = d as { x: number; y: number };
      const id = ++critIdRef.current;
      setCrits(prev => [...prev, { id, x: data.x, y: data.y, text: 'CRIT' }]);
      setTimeout(() => setCrits(prev => prev.filter(c => c.id !== id)), 900);
    });

    // Tell engine that HUD is ready to receive state
    eb.emit(GameEvent.HUD_READY);

    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); u9(); u10(); u11(); u12(); u13(); u14(); };
  }, [enqueueBanner]);

  const healthPercent = (health / maxHealth) * 100;
  const healthColor   = healthPercent > 60 ? '#4caf50' : healthPercent > 30 ? '#ff9800' : '#f44336';
  const expPercent    = expToNext > 0 ? (exp / expToNext) * 100 : 0;

  const abilityMeta = ABILITY_META[ability.ability] ?? ABILITY_META.NONE;
  const hasAbility  = ability.ability !== 'NONE';
  const cdPercent   = ability.cooldownTotal > 0
    ? Math.max(0, 1 - ability.cooldownRemaining / ability.cooldownTotal) : 1;
  const onCooldown  = ability.cooldownRemaining > 0;

  const weaponSlots = ['Pistol', 'Shotgun', 'Rifle'];
  if (stats.flamethrowerUnlocked) weaponSlots.push('Flamethrower');
  if (stats.laserRifleUnlocked) weaponSlots.push('LaserRifle');
  if (stats.crossbowUnlocked) weaponSlots.push('Crossbow');

  const activeEffects: { label: string; level: number; icon: string; color: string }[] = [];
  if (stats.pierceCount > 0)        activeEffects.push({ label: 'Pierce',       level: stats.pierceCount,                        icon: '🗡️', color: '#90caf9' });
  if (stats.explosionLevel > 0)     activeEffects.push({ label: 'Explosion',    level: stats.explosionLevel,                     icon: '💣', color: '#ff6600' });
  if (stats.extraGunCount > 0)      activeEffects.push({ label: 'Dual Guns',    level: stats.extraGunCount,                      icon: '🔱', color: '#ce93d8' });
  if (stats.bulletStormCount > 1)   activeEffects.push({ label: 'Bullet Storm', level: stats.bulletStormCount - 1,               icon: '🌪️', color: '#ffab40' });
  if (stats.lifestealPercent > 0)   activeEffects.push({ label: 'Lifesteal',    level: stats.lifestealPercent > 0 ? 1 : 0, icon: '🧛', color: '#ef5350' });
  if (stats.shieldLevel > 0)        activeEffects.push({ label: 'Shield',       level: stats.shieldLevel,                        icon: '🔰', color: '#00e5ff' });
  if (stats.freezeLevel > 0)        activeEffects.push({ label: 'Cryo Field',   level: stats.freezeLevel,                        icon: '❄️', color: '#81d4fa' });
  if (stats.autoExplosionLevel > 0) activeEffects.push({ label: 'Nova Pulse',   level: stats.autoExplosionLevel,                 icon: '☢️', color: '#ff5722' });
  if (stats.droneCount > 0)         activeEffects.push({ label: 'Drones',       level: stats.droneCount,                         icon: '🛸', color: '#b388ff' });

  return (
    <div id="game-hud" className="hud-container">
      {/* Low Health Screen Tint */}
      {healthPercent < 25 && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          boxShadow: 'inset 0 0 150px rgba(255, 0, 0, 0.6)',
          pointerEvents: 'none', zIndex: 1000,
          animation: 'pulse-alpha 1s infinite alternate'
        }}>
           <style>{`@keyframes pulse-alpha { from { opacity: 0.6; } to { opacity: 1; } }`}</style>
        </div>
      )}

      {/* Boss Health Bar — top center */}
      {boss && (
        <div className="boss-health-container">
          <div className="boss-name" style={{ color: boss.color }}>☠ {boss.name} ☠</div>
          <div className="boss-health-bar-bg" style={{ position: 'relative' }}>
            <div className="boss-health-bar-fill" style={{
              width: `${(boss.health / boss.maxHealth) * 100}%`,
              backgroundColor: boss.isInvincible ? '#ffd700' : boss.color,
              boxShadow: boss.isInvincible ? `0 0 20px #ffd700` : `0 0 12px ${boss.color}80`,
            }} />
            {boss.skullThresholds && boss.skullThresholds.map((threshold, i) => {
              const triggered = boss.skullsTriggered !== undefined && i < boss.skullsTriggered;
              return (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${threshold * 100}%`,
                  top: '-8px',
                  transform: 'translateX(-50%)',
                  fontSize: '14px',
                  textShadow: '0 0 4px #000',
                  opacity: triggered ? 0.3 : 1
                }}>💀</div>
              );
            })}
          </div>
          <div className="boss-health-text">{Math.ceil(boss.health)} / {boss.maxHealth}</div>
        </div>
      )}

      {/* Top Left: Wave / Score / Kills */}
      <div className="hud-top-left">
        <div className="hud-wave">WAVE <span className="hud-wave-number">{wave}</span></div>
        <div className="hud-score">SCORE: <span className="hud-score-value">{score.toLocaleString()}</span></div>
        <div className="hud-score">KILLS: <span className="hud-score-value">{kills}</span></div>
      </div>

      {/* Right Side: Stats Panel */}
      <div className="hud-stats-panel">
        <div className="hud-stats-title">STATS</div>
        <div className="hud-stats-divider" />
        <div className="hud-stat-row">
          <span className="hud-stat-label">⚔ Damage</span>
          <span className="hud-stat-value" style={{ color: stats.damageMultiplier > 1 ? '#ffca28' : '#8888aa' }}>x{stats.damageMultiplier.toFixed(1)}</span>
        </div>
        <div className="hud-stat-row">
          <span className="hud-stat-label">⚡ Fire Rate</span>
          <span className="hud-stat-value" style={{ color: stats.fireRateMultiplier > 1 ? '#ffca28' : '#8888aa' }}>x{stats.fireRateMultiplier.toFixed(1)}</span>
        </div>
        <div className="hud-stat-row">
          <span className="hud-stat-label">🗡️ Pierce</span>
          <span className="hud-stat-value" style={{ color: stats.pierceCount > 0 ? '#90caf9' : '#8888aa' }}>{stats.pierceCount}</span>
        </div>
        <div className="hud-stat-row">
          <span className="hud-stat-label">💨 Speed</span>
          <span className="hud-stat-value" style={{ color: stats.moveSpeed > 200 ? '#4fc3f7' : '#8888aa' }}>{Math.round(stats.moveSpeed)}</span>
        </div>
        <div className="hud-stat-row">
          <span className="hud-stat-label">🔫 Shots</span>
          <span className="hud-stat-value" style={{ color: (stats.bulletStormCount > 1 || stats.extraGunCount > 0) ? '#ffab40' : '#8888aa' }}>
            {stats.bulletStormCount + (stats.extraGunCount > 0 ? stats.bulletStormCount : 0)}
          </span>
        </div>
        {stats.bulletBlastPercent > 0 && (
          <div className="hud-stat-row">
            <span className="hud-stat-label">💥 Blast</span>
            <span className="hud-stat-value" style={{ color: '#ff6600' }}>{stats.bulletBlastPercent}%</span>
          </div>
        )}
        {stats.autoExplosionLevel > 0 && (
          <div className="hud-stat-row">
            <span className="hud-stat-label">☢️ Nova</span>
            <span className="hud-stat-value" style={{ color: '#ff5722' }}>{Math.round(stats.autoExplosionDamage)}</span>
          </div>
        )}
        {stats.freezeLevel > 0 && (
          <div className="hud-stat-row">
            <span className="hud-stat-label">❄️ Slow</span>
            <span className="hud-stat-value" style={{ color: '#81d4fa' }}>{Math.round(stats.freezeStrength * 100)}%</span>
          </div>
        )}
        {activeEffects.length > 0 && (
          <>
            <div className="hud-stats-divider" />
            <div className="hud-stats-subtitle">EFFECTS</div>
            {activeEffects.map((e) => (
              <div key={e.label} className="hud-effect-row">
                <span className="hud-effect-icon">{e.icon}</span>
                <span className="hud-effect-label">{e.label}</span>
                <span className="hud-effect-level" style={{ color: e.color }}>Lv.{e.level}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bottom Left: HP + EXP stacked */}
      <div className="hud-bottom-left" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
        {/* HP row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="hud-health-label">HP</div>
          <div className="hud-health-bar-bg">
            <div className="hud-health-bar-fill" style={{
              width: `${healthPercent}%`,
              backgroundColor: healthColor,
              boxShadow: `0 0 10px ${healthColor}80`,
            }} />
          </div>
          <div className="hud-health-text">{Math.ceil(health)} / {maxHealth}</div>
        </div>

        {/* EXP row — level-up text inline to the right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="hud-exp-label" style={{ color: levelUpInline ? '#ffd600' : '#7986cb' }}>
            LV<span className="hud-exp-level" style={{ color: levelUpInline ? '#ffd600' : '#9fa8da' }}>{level}</span>
          </div>
          <div className="hud-exp-bar-bg">
            <div className="hud-exp-bar-fill" style={{
              width: `${expPercent}%`,
              boxShadow: levelUpInline ? '0 0 12px #ffd600' : '0 0 6px #5c6bc080',
            }} />
          </div>
          <div className="hud-health-text" style={{ minWidth: 60 }}>{exp} / {expToNext}</div>
          {/* Inline level-up label — appears right of the numbers, never overlaps center */}
          {levelUpInline && (
            <div className="hud-levelup-inline">⬆ LEVEL UP!</div>
          )}
        </div>
      </div>

      {/* Bottom Right: Weapon + Ammo + Slots */}
      <div className="hud-bottom-right">
        <div className="hud-weapon" style={{ color: weaponColor }}>{weaponName}</div>
        <div className="hud-ammo">AMMO: <span className="hud-ammo-value">{ammo}</span></div>
        <div className="hud-weapon-slots">
          {weaponSlots.map((name, idx) => (
            <div key={name} className={`hud-weapon-slot ${name === weaponName ? 'hud-weapon-slot-active' : ''}`}>
              {idx + 1}: {name === 'Flamethrower' ? '🔥' : name === 'LaserRifle' ? '⚡' : name === 'Crossbow' ? '🏹' : name}
            </div>
          ))}
        </div>
      </div>

      {/* Spacebar Ability — bottom center */}
      {hasAbility && (
        <div className="hud-ability-container">
          <div className="hud-ability-ring" style={{
            borderColor: onCooldown ? 'rgba(255,255,255,0.15)' : abilityMeta.color,
            boxShadow: onCooldown ? 'none' : `0 0 14px ${abilityMeta.color}80`,
          }}>
            {onCooldown && (
              <svg className="hud-ability-cd-svg" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                <circle
                  cx="24" cy="24" r="20" fill="none"
                  stroke={abilityMeta.color} strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - cdPercent)}`}
                  strokeLinecap="round" transform="rotate(-90 24 24)"
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
              </svg>
            )}
            <span className="hud-ability-icon" style={{ opacity: onCooldown ? 0.4 : 1 }}>
              {abilityMeta.icon}
            </span>
          </div>
          <div className="hud-ability-info">
            <div className="hud-ability-name" style={{ color: abilityMeta.color }}>
              {abilityMeta.label}{ability.level > 1 ? ` Lv.${ability.level}` : ''}
            </div>
            <div className="hud-ability-key">SPACE</div>
            {onCooldown
              ? <div className="hud-ability-cd-text" style={{ color: '#aaa' }}>{ability.cooldownRemaining.toFixed(1)}s</div>
              : ability.isActive
                ? <div className="hud-ability-cd-text" style={{ color: abilityMeta.color }}>ACTIVE {ability.activeRemaining.toFixed(1)}s</div>
                : <div className="hud-ability-cd-text" style={{ color: '#4caf50' }}>READY</div>
            }
          </div>
        </div>
      )}

      {/* Single sequenced center banner — LEVEL UP first, then WAVE COMPLETE */}
      {activeBanner === 'levelup' && (
        <div key="banner-levelup" className="hud-center-banner hud-banner-levelup">
          ⬆ LEVEL {level}
        </div>
      )}
      {activeBanner === 'wavecomplete' && (
        <div key="banner-wave" className="hud-center-banner hud-banner-wave">
          WAVE {wave} CLEARED!
        </div>
      )}
      {activeBanner === 'wavechanged' && (
        <div key="banner-wave-next" className="hud-center-banner hud-banner-wave" style={{ color: '#4fc3f7' }}>
          — WAVE {wave} —
        </div>
      )}
      {/* Floating CRIT texts — rendered at world position via absolute positioning */}
      {crits.map((c) => (
        <div
          key={c.id}
          className="hud-crit-text"
          style={{ left: c.x, top: c.y }}
        >
          {c.text}
        </div>
      ))}
    </div>
  );
}
