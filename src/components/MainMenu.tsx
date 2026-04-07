'use client';
// ============================================================
// MainMenu.tsx — Title screen with premium dark UI
// ============================================================

import { useState } from 'react';

interface MainMenuProps {
  onStartGame: (startWave: number) => void;
}

export default function MainMenu({ onStartGame }: MainMenuProps) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [startWave, setStartWave] = useState(1);
  return (
    <div id="main-menu" className="menu-overlay">
      <div className="menu-content">
        {/* Title */}
        <div className="menu-title-container">
          <h1 className="menu-title">
            ZOMBIE<br />
            <span className="menu-title-accent">SURVIVAL</span>
          </h1>
          <div className="menu-subtitle">SHOOTER</div>
        </div>

        {/* Decorative line */}
        <div className="menu-divider" />

        {/* Start Button */}
        <button
          id="start-game-btn"
          className="menu-start-btn"
          onClick={() => onStartGame(isAdminMode ? startWave : 1)}
        >
          <span className="menu-start-btn-text">START GAME</span>
          <div className="menu-start-btn-glow" />
        </button>

        {/* Admin Mode Toggle */}
        <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#888', fontSize: '0.8rem', letterSpacing: '2px' }}>
            <input 
              type="checkbox" 
              checked={isAdminMode} 
              onChange={e => setIsAdminMode(e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
            ADMIN MODE
          </label>
          
          {isAdminMode && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#aaa', fontSize: '0.9rem' }}>START WAVE:</span>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={startWave}
                onChange={e => setStartWave(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ 
                  width: '60px', padding: '4px', background: 'rgba(0,0,0,0.5)', 
                  border: '1px solid #ff4444', color: '#fff', textAlign: 'center',
                  borderRadius: '4px', outline: 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="menu-instructions">
          <div className="menu-instruction-title">HOW TO PLAY</div>
          <div className="menu-instruction-grid">
            <div className="menu-instruction-item">
              <div className="menu-key-group">
                <kbd className="menu-key">W</kbd>
                <kbd className="menu-key">A</kbd>
                <kbd className="menu-key">S</kbd>
                <kbd className="menu-key">D</kbd>
              </div>
              <span>Move</span>
            </div>
            <div className="menu-instruction-item">
              <div className="menu-key-group">
                <kbd className="menu-key menu-key-wide">MOUSE</kbd>
              </div>
              <span>Aim</span>
            </div>
            <div className="menu-instruction-item">
              <div className="menu-key-group">
                <kbd className="menu-key menu-key-wide">CLICK</kbd>
              </div>
              <span>Shoot</span>
            </div>
            <div className="menu-instruction-item">
              <div className="menu-key-group">
                <kbd className="menu-key">1</kbd>
                <kbd className="menu-key">2</kbd>
                <kbd className="menu-key">3</kbd>
              </div>
              <span>Switch Weapon</span>
            </div>
          </div>
        </div>

        {/* Zombie Types */}
        <div className="menu-zombies">
          <div className="menu-zombie-type">
            <div className="menu-zombie-dot" style={{ backgroundColor: '#5cb85c' }} />
            <span>Normal</span>
          </div>
          <div className="menu-zombie-type">
            <div className="menu-zombie-dot" style={{ backgroundColor: '#f0ad4e' }} />
            <span>Fast (W3)</span>
          </div>
          <div className="menu-zombie-type">
            <div className="menu-zombie-dot" style={{ backgroundColor: '#7e57c2' }} />
            <span>Shooter (W4)</span>
          </div>
          <div className="menu-zombie-type">
            <div className="menu-zombie-dot" style={{ backgroundColor: '#d9534f' }} />
            <span>Tank (W5)</span>
          </div>
          <div className="menu-zombie-type">
            <div className="menu-zombie-dot" style={{ backgroundColor: '#26a69a' }} />
            <span>Shield (W6)</span>
          </div>
          <div className="menu-zombie-type">
            <div className="menu-zombie-dot" style={{ backgroundColor: '#e65100' }} />
            <span>Spawner (W7)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
