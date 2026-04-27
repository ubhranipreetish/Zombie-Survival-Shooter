'use client';
// ============================================================
// GameCanvas.tsx — React wrapper for the HTML5 Canvas game
// Now includes CardSelection state between waves
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '@/game/engine/GameEngine';
import { GameState, PowerUpCard, GameEvent, GameOverData } from '@/game/interfaces/types';
import { EventBus } from '@/game/events/EventBus';
import HUD from './HUD';
import LandingPage from './LandingPage';
import GameOverScreen from './GameOverScreen';
import PauseMenu from './PauseMenu';
import CardSelection from './CardSelection';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [cardChoices, setCardChoices] = useState<PowerUpCard[]>([]);
  const [collectedCards, setCollectedCards] = useState<PowerUpCard[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const [savedProgress, setSavedProgress] = useState<any>(null);

  const getCanvasSize = useCallback(() => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, []);

  // Fetch progress from backend
  const fetchProgress = useCallback(async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    
    try {
      const res = await fetch('http://localhost:5001/api/game/progress', {
        headers: { 'x-user-id': user.id || user._id }
      });
      const data = await res.json();
      if (data.progress?.hasProgress) {
        setSavedProgress(data.progress);
      } else {
        setSavedProgress(null);
      }
    } catch (e) {
      console.error('Failed to fetch progress', e);
    }
  }, []);

  const saveProgress = useCallback(async (data: any) => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
      await fetch('http://localhost:5001/api/game/progress', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.id || user._id 
        },
        body: JSON.stringify({ progress: data })
      });
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  }, []);

  const clearProgress = useCallback(async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);

    try {
      await fetch('http://localhost:5001/api/game/progress', {
        method: 'DELETE',
        headers: { 'x-user-id': user.id || user._id }
      });
      setSavedProgress(null);
    } catch (e) {
      console.error('Failed to clear progress', e);
    }
  }, []);

  useEffect(() => {
    fetchProgress();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = getCanvasSize();
    canvas.width = width;
    canvas.height = height;

    const engine = new GameEngine(canvas);
    engine.setOnStateChange((state) => setGameState(state));
    engine.setOnCardChoices((cards) => setCardChoices(cards));
    engineRef.current = engine;

    const eb = EventBus.getInstance();
    const unsubScore = eb.subscribe(GameEvent.SCORE_CHANGED, (d: unknown) => {
      setScore((d as { score: number }).score);
    });
    const unsubExp = eb.subscribe(GameEvent.EXP_CHANGED, (d: unknown) => {
      setLevel((d as { level: number }).level);
    });
    const unsubGameOver = eb.subscribe(GameEvent.GAME_OVER, (d: unknown) => {
      setGameOverData(d as GameOverData);
      clearProgress();
    });
    const unsubWave = eb.subscribe(GameEvent.WAVE_CHANGED, (d: unknown) => {
      const w = (d as { wave: number }).wave;
      if (w > 1 && engineRef.current) {
        const saveData = engineRef.current.getSaveData();
        saveProgress(saveData);
        setSavedProgress(saveData);
      }
    });

    const handleResize = () => {
      const { width, height } = getCanvasSize();
      canvas.width = width;
      canvas.height = height;
      engine.resize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubScore();
      unsubExp();
      unsubGameOver();
      unsubWave();
      engine.destroy();
      engineRef.current = null;
    };
  }, [getCanvasSize, fetchProgress, saveProgress, clearProgress]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const engine = engineRef.current;
        if (!engine) return;
        if (gameState === GameState.PAUSED) {
          engine.resume();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  const handleStartGame = useCallback((startWave: number = 1, progressData?: any) => {
    if (startWave === 1) {
      clearProgress();
    }
    setCollectedCards([]);
    setScore(0);
    setLevel(1);
    
    engineRef.current?.startGame(startWave);
    
    if (progressData) {
      engineRef.current?.loadProgress(progressData);
      setCollectedCards(progressData.collectedCards || []);
      setScore(progressData.score || 0);
      setLevel(progressData.level || 1);
    }
  }, [clearProgress]);

  const handleResume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const handleCardSelect = useCallback((card: PowerUpCard) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.selectCard(card);
    setCollectedCards(engine.getCollectedCards());
    setCardChoices([]);
    
    // Save progress after picking a card too
    saveProgress(engine.getSaveData());
  }, [saveProgress]);

  const handleRestart = useCallback(() => {
    engineRef.current?.destroy();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engine.setOnStateChange((state) => setGameState(state));
    engine.setOnCardChoices((cards) => setCardChoices(cards));
    engineRef.current = engine;
    setCollectedCards([]);
    engine.startGame();
    clearProgress();
  }, [clearProgress]);

  const handleQuitToMenu = useCallback(() => {
    engineRef.current?.destroy();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engine.setOnStateChange((state) => setGameState(state));
    engine.setOnCardChoices((cards) => setCardChoices(cards));
    engineRef.current = engine;
    setCollectedCards([]);
    setGameState(GameState.MENU);
    fetchProgress();
  }, [fetchProgress]);

  return (
    <div id="game-container" className="game-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{ cursor: gameState === GameState.PLAYING ? 'none' : 'default' }}
      />

      {gameState === GameState.MENU && (
        <LandingPage onStartGame={handleStartGame} savedProgress={savedProgress} />
      )}

      {(gameState === GameState.PLAYING ||
        gameState === GameState.CARD_SELECTION ||
        gameState === GameState.LEVEL_UP) && <HUD />}

      {gameState === GameState.CARD_SELECTION && cardChoices.length > 0 && (
        <CardSelection
          cards={cardChoices}
          collectedCards={collectedCards}
          onSelect={handleCardSelect}
          score={score}
          level={level}
        />
      )}

      {gameState === GameState.PAUSED && (
        <PauseMenu onResume={handleResume} onQuit={handleQuitToMenu} />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverScreen gameOverData={gameOverData} onRestart={handleRestart} onMainMenu={handleQuitToMenu} />
      )}
    </div>
  );
}
