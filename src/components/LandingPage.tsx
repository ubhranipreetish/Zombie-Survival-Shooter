'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LandingPageProps {
  onStartGame: (startWave: number, progress?: any) => void;
  savedProgress: any;
}

export default function LandingPage({ onStartGame, savedProgress }: LandingPageProps) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<Array<{ left: string; delay: string; duration: string }>>([]);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }

    // Generate particles on client to avoid hydration mismatch
    const p = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${5 + Math.random() * 10}s`
    }));
    setParticles(p);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const onAction = (wave: number, progress?: any) => {
    setLoading(true);
    // Add a slight delay for cinematic effect
    setTimeout(() => {
      onStartGame(wave, progress);
    }, 1200);
  };

  const lastWave = savedProgress?.wave || 1;

  return (
    <div className="lp-root">
      {/* Background scene */}
      <div className="lp-bg-scene">
        <div className="lp-bg-overlay" />
        <div className="lp-bg-vignette" />
        <div className="lp-scanline" style={{ top: '20%' }} />
      </div>

      {/* Floating particles */}
      <div className="lp-particles">
        {particles.map((p, i) => (
          <div 
            key={i} 
            className="lp-particle" 
            style={{ 
              left: p.left, 
              animationDelay: p.delay,
              animationDuration: p.duration
            }} 
          />
        ))}
      </div>

      {/* Top Bar */}
      <nav className="lp-topbar">
        <div className="lp-topbar-logo">
          <span className="lp-topbar-skull">💀</span>
          <span className="lp-topbar-brand">ZOMBIE SURVIVAL</span>
        </div>
        
        {user ? (
          <div className="lp-topbar-user">
            <div className="lp-user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="lp-user-name">{user.name || 'Survivor'}</span>
            <button className="lp-signout-btn" onClick={handleLogout}>
              SIGNOUT
            </button>
          </div>
        ) : (
          <button className="lp-header-signin" onClick={() => router.push('/login')}>
            SIGN IN
          </button>
        )}
      </nav>

      {/* Hero Section */}
      <main className="lp-hero">
        <div className="lp-badge">
          <span className="lp-badge-icon">☣</span>
          <span className="lp-badge-text">SECTOR 7 QUARANTINE ACTIVE</span>
        </div>

        <div className="lp-title-block">
          <div className="lp-title-glow" />
          <h1 className="lp-title">
            <span className="lp-title-line1">ZOMBIE</span>
            <span className="lp-title-line2">SURVIVAL</span>
            <span className="lp-title-line3">SHOOTER</span>
          </h1>
        </div>

        <p className="lp-tagline">
          The city has fallen. Hordes of the undead are rising. 
          Grab your weapons, unlock powerful abilities, and survive 
          against the increasingly difficult waves.
        </p>

        {/* Stats Row */}
        <div className="lp-stats-row">
          <div className="lp-stat">
            <span className="lp-stat-value">{savedProgress ? savedProgress.score : '6'}</span>
            <span className="lp-stat-label">{savedProgress ? 'Current Score' : 'Zombie Types'}</span>
          </div>
          <div className="lp-stat-sep" />
          <div className="lp-stat">
            <span className="lp-stat-value">{savedProgress ? savedProgress.level : '5+'}</span>
            <span className="lp-stat-label">{savedProgress ? 'Level' : 'Boss Fights'}</span>
          </div>
          <div className="lp-stat-sep" />
          <div className="lp-stat">
            <span className="lp-stat-value">{savedProgress ? savedProgress.wave : '12+'}</span>
            <span className="lp-stat-label">{savedProgress ? 'Wave' : 'Abilities'}</span>
          </div>
        </div>

        {/* CTA Group */}
        <div className="lp-cta-group">
          {loading ? (
            <div className="lp-cta-loading">
              <div className="lp-spinner" />
            </div>
          ) : (
            <>
              {savedProgress && savedProgress.wave > 1 && (
                <button 
                  className="lp-cta-primary lp-cta-signin" 
                  onClick={() => onAction(lastWave, savedProgress)}
                >
                  <span className="lp-cta-shimmer" />
                  <span className="lp-cta-icon">⏯</span>
                  <span className="lp-cta-label">CONTINUE WAVE {lastWave}</span>
                </button>
              )}
              
              <button 
                className="lp-cta-primary" 
                onClick={() => onAction(1)}
              >
                <span className="lp-cta-shimmer" />
                <span className="lp-cta-icon">🔫</span>
                <span className="lp-cta-label">START NEW MISSION</span>
              </button>
            </>
          )}
          
          <p className="lp-cta-hint">Press [W][A][S][D] to move, [MOUSE] to aim & shoot</p>
        </div>
      </main>

      {/* Feature Pills */}
      <footer className="lp-features">
        <div className="lp-feature-pill">
          <span>🔥</span> Flamethrowers
        </div>
        <div className="lp-feature-pill">
          <span>🛡</span> Orbital Drones
        </div>
        <div className="lp-feature-pill">
          <span>⚡</span> Ability System
        </div>
        <div className="lp-feature-pill">
          <span>🃏</span> Card Selection
        </div>
        <div className="lp-feature-pill">
          <span>🎯</span> Boss Missions
        </div>
      </footer>
    </div>
  );
}
