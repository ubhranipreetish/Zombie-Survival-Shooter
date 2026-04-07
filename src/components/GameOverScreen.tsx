'use client';
// ============================================================
// GameOverScreen.tsx — Animated end screen with stats + scoreboard
// ============================================================

import { useEffect, useState, useRef } from 'react';
import { GameOverData } from '@/game/interfaces/types';

interface ScoreEntry {
  score: number;
  wave: number;
  kills: number;
  date: string;
}

const SCOREBOARD_KEY = 'zombie_shooter_scores';
const MAX_SCORES = 5;

function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(SCOREBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScore(entry: ScoreEntry): ScoreEntry[] {
  const scores = loadScores();
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  const trimmed = scores.slice(0, MAX_SCORES);
  localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(trimmed));
  return trimmed;
}

interface GameOverScreenProps {
  gameOverData: GameOverData | null;
  onRestart: () => void;
  onMainMenu: () => void;
}

interface FireParticle {
  x: number; y: number; vx: number; vy: number;
  size: number; life: number; maxLife: number; hue: number;
}

export default function GameOverScreen({ gameOverData, onRestart, onMainMenu }: GameOverScreenProps) {
  const stats = gameOverData ?? { score: 0, wave: 0, zombiesKilled: 0 };
  const [scoreboard, setScoreboard] = useState<ScoreEntry[]>([]);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!gameOverData) return;
    const entry: ScoreEntry = {
      score: gameOverData.score,
      wave: gameOverData.wave,
      kills: gameOverData.zombiesKilled,
      date: new Date().toLocaleDateString(),
    };
    const updated = saveScore(entry);
    setScoreboard(updated);
    setIsNewHighScore(updated[0]?.score === gameOverData.score);
  }, [gameOverData]);

  // Rich fire particle canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: FireParticle[] = [];

    const spawnParticle = () => {
      const edge = Math.random();
      let x: number, y: number;
      if (edge < 0.5) {
        x = Math.random() * canvas.width;
        y = canvas.height + 10;
      } else if (edge < 0.75) {
        x = -10;
        y = canvas.height * 0.5 + Math.random() * canvas.height * 0.5;
      } else {
        x = canvas.width + 10;
        y = canvas.height * 0.5 + Math.random() * canvas.height * 0.5;
      }
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 3,
        vy: -(2 + Math.random() * 4),
        size: 5 + Math.random() * 15,
        life: 0,
        maxLife: 80 + Math.random() * 100,
        hue: 5 + Math.random() * 35,
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // intensity of fire
      for (let i = 0; i < 7; i++) spawnParticle();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.vx += (Math.random() - 0.5) * 0.3;

        const progress = p.life / p.maxLife;
        const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
        const currentSize = p.size * (1 - progress * 0.5);

        if (progress >= 1) {
          particles.splice(i, 1);
          continue;
        }

        // Outer glow — use additive blending for intense fire
        ctx.globalCompositeOperation = 'lighter';
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 4);
        gradient.addColorStop(0, `hsla(${p.hue + 10}, 100%, 70%, ${alpha * 0.8})`);
        gradient.addColorStop(0.3, `hsla(${p.hue}, 100%, 50%, ${alpha * 0.5})`);
        gradient.addColorStop(0.6, `hsla(${p.hue - 10}, 100%, 30%, ${alpha * 0.2})`);
        gradient.addColorStop(1, `hsla(${p.hue - 20}, 100%, 10%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 4, 0, Math.PI * 2);
        ctx.fill();

        // Hot white-yellow core
        ctx.fillStyle = `hsla(${p.hue + 30}, 100%, 90%, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div id="game-over-screen" className="menu-overlay game-over-overlay">
      {/* Fire particle canvas behind everything */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.8
      }} />

      <div className="menu-content game-over-content" style={{ position: 'relative', zIndex: 1 }}>
        {/* Neon glow title */}
        <h1 className="game-over-title" style={{
          color: '#ff0000ff',
          textShadow: '0 0 7px #ae2020ff, 0 0 10px #7c1414ff, 0 0 21px #881b1bff, 0 0 42px #922929ff, 0 0 82px #551515ff, 0 0 92px #a12c2cff, 0 0 102px #713737ff, 0 0 151px #551010ff',
          animation: 'neon-flicker 1.5s infinite alternate',
          whiteSpace: 'nowrap', fontSize: '3rem', letterSpacing: '3px',
        }}>
          GAME OVER
        </h1>

        {isNewHighScore && (
          <div style={{
            color: '#ffd700', fontSize: '1rem', fontWeight: 700, letterSpacing: '3px',
            textShadow: '0 0 7px #ffd700, 0 0 20px #ffd700, 0 0 40px #ff8c00',
            animation: 'neon-flicker 2s infinite alternate',
          }}>
            ★ NEW HIGH SCORE ★
          </div>
        )}

        <div className="menu-divider" />

        <div className="game-over-stats">
          {/* Big score */}
          <div className="game-over-stat">
            <div className="game-over-stat-label">FINAL SCORE</div>
            <div className="game-over-stat-value game-over-score">{stats.score.toLocaleString()}</div>
          </div>
          <div className="game-over-stat-row">
            <div className="game-over-stat">
              <div className="game-over-stat-label">WAVES</div>
              <div className="game-over-stat-value">{stats.wave}</div>
            </div>
            <div className="game-over-stat">
              <div className="game-over-stat-label">LEVEL</div>
              <div className="game-over-stat-value">{stats.level ?? 1}</div>
            </div>
            <div className="game-over-stat">
              <div className="game-over-stat-label">KILLS</div>
              <div className="game-over-stat-value">{stats.zombiesKilled}</div>
            </div>
            <div className="game-over-stat">
              <div className="game-over-stat-label">ACCURACY</div>
              <div className="game-over-stat-value">{stats.accuracy ?? 0}%</div>
            </div>
          </div>
          {/* Favorite Weapon Row */}
          {stats.favoriteWeapon && stats.favoriteWeapon !== 'None' && (
            <div className="game-over-stat-row" style={{ marginTop: '15px' }}>
              <div className="game-over-stat" style={{ width: '100%' }}>
                <div className="game-over-stat-label">FAVORITE WEAPON</div>
                <div className="game-over-stat-value" style={{ color: '#ffaa00' }}>
                  {stats.favoriteWeapon.toUpperCase()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Best Score (Single Player replacing Leaderboard) */}
        {!isNewHighScore && scoreboard.length > 0 && (
          <div className="game-over-stat" style={{ marginTop: '10px' }}>
            <div className="game-over-stat-label">BEST SCORE</div>
            <div className="game-over-stat-value" style={{ fontSize: '1.6rem', color: '#888' }}>
              {scoreboard[0].score.toLocaleString()}
            </div>
          </div>
        )}

        <div className="game-over-buttons">
          <button id="play-again-btn" className="menu-start-btn" onClick={onRestart}>
            <span className="menu-start-btn-text">PLAY AGAIN</span>
            <div className="menu-start-btn-glow" />
          </button>
          <button id="main-menu-btn" className="game-over-menu-btn" onClick={onMainMenu}>
            MAIN MENU
          </button>
        </div>
      </div>

      <style>{`
        @keyframes neon-flicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            opacity: 1;
          }
          20%, 24%, 55% {
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
}
