'use client';
// ============================================================
// GameOverScreen.tsx — End screen with stats + persistent scoreboard
// ============================================================

import { useEffect, useState } from 'react';
import { EventBus } from '@/game/events/EventBus';
import { GameEvent, GameOverData } from '@/game/interfaces/types';

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
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function GameOverScreen({ onRestart, onMainMenu }: GameOverScreenProps) {
  const [stats, setStats] = useState<GameOverData>({
    score: 0,
    wave: 0,
    zombiesKilled: 0,
  });
  const [scoreboard, setScoreboard] = useState<ScoreEntry[]>([]);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  useEffect(() => {
    const eventBus = EventBus.getInstance();
    const unsub = eventBus.subscribe(GameEvent.GAME_OVER, (data: unknown) => {
      const d = data as GameOverData;
      setStats(d);

      // Save to scoreboard
      const entry: ScoreEntry = {
        score: d.score,
        wave: d.wave,
        kills: d.zombiesKilled,
        date: new Date().toLocaleDateString(),
      };
      const updated = saveScore(entry);
      setScoreboard(updated);

      // Check if this is a new high score
      setIsNewHighScore(updated[0]?.score === d.score);
    });
    return unsub;
  }, []);

  return (
    <div id="game-over-screen" className="menu-overlay game-over-overlay">
      <div className="menu-content game-over-content">
        <h1 className="game-over-title">GAME OVER</h1>
        {isNewHighScore && (
          <div className="new-high-score">★ NEW HIGH SCORE ★</div>
        )}

        <div className="menu-divider" />

        <div className="game-over-stats">
          <div className="game-over-stat">
            <div className="game-over-stat-label">FINAL SCORE</div>
            <div className="game-over-stat-value game-over-score">
              {stats.score.toLocaleString()}
            </div>
          </div>
          <div className="game-over-stat-row">
            <div className="game-over-stat">
              <div className="game-over-stat-label">WAVES SURVIVED</div>
              <div className="game-over-stat-value">{stats.wave}</div>
            </div>
            <div className="game-over-stat">
              <div className="game-over-stat-label">ZOMBIES KILLED</div>
              <div className="game-over-stat-value">{stats.zombiesKilled}</div>
            </div>
          </div>
        </div>

        {/* Scoreboard */}
        {scoreboard.length > 0 && (
          <div className="scoreboard-section">
            <div className="scoreboard-title">LEADERBOARD</div>
            <div className="scoreboard-table">
              <div className="scoreboard-header">
                <span className="sb-rank">#</span>
                <span className="sb-score-col">SCORE</span>
                <span className="sb-wave-col">WAVE</span>
                <span className="sb-kills-col">KILLS</span>
              </div>
              {scoreboard.map((entry, idx) => (
                <div
                  key={idx}
                  className={`scoreboard-row ${entry.score === stats.score ? 'scoreboard-row-current' : ''}`}
                >
                  <span className="sb-rank">{idx + 1}</span>
                  <span className="sb-score-col">{entry.score.toLocaleString()}</span>
                  <span className="sb-wave-col">{entry.wave}</span>
                  <span className="sb-kills-col">{entry.kills}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="game-over-buttons">
          <button
            id="play-again-btn"
            className="menu-start-btn"
            onClick={onRestart}
          >
            <span className="menu-start-btn-text">PLAY AGAIN</span>
            <div className="menu-start-btn-glow" />
          </button>
          <button
            id="main-menu-btn"
            className="game-over-menu-btn"
            onClick={onMainMenu}
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
