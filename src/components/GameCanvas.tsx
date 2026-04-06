'use client';
// ============================================================
// GameCanvas.tsx — React wrapper for the HTML5 Canvas game
// Now includes CardSelection state between waves
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '@/game/engine/GameEngine';
import { GameState, PowerUpCard } from '@/game/interfaces/types';
import HUD from './HUD';
import MainMenu from './MainMenu';
import GameOverScreen from './GameOverScreen';
import PauseMenu from './PauseMenu';
import CardSelection from './CardSelection';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [cardChoices, setCardChoices] = useState<PowerUpCard[]>([]);
  const [collectedCards, setCollectedCards] = useState<PowerUpCard[]>([]);

  const getCanvasSize = useCallback(() => {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = getCanvasSize();
    canvas.width = width;
    canvas.height = height;

    const engine = new GameEngine(canvas);
    engine.setOnStateChange((state) => setGameState(state));
    engine.setOnCardChoices((cards) => setCardChoices(cards));
    engineRef.current = engine;

    const handleResize = () => {
      const { width, height } = getCanvasSize();
      canvas.width = width;
      canvas.height = height;
      engine.resize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, [getCanvasSize]);

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

  const handleStartGame = useCallback(() => {
    setCollectedCards([]);
    engineRef.current?.startGame();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const handleCardSelect = useCallback((card: PowerUpCard) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.selectCard(card);
    setCollectedCards(engine.getCollectedCards());
    setCardChoices([]);
  }, []);

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
  }, []);

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
  }, []);

  return (
    <div id="game-container" className="game-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{ cursor: gameState === GameState.PLAYING ? 'none' : 'default' }}
      />

      {gameState === GameState.MENU && (
        <MainMenu onStartGame={handleStartGame} />
      )}

      {(gameState === GameState.PLAYING || gameState === GameState.CARD_SELECTION) && <HUD />}

      {gameState === GameState.CARD_SELECTION && cardChoices.length > 0 && (
        <CardSelection
          cards={cardChoices}
          collectedCards={collectedCards}
          onSelect={handleCardSelect}
        />
      )}

      {gameState === GameState.PAUSED && (
        <PauseMenu onResume={handleResume} onQuit={handleQuitToMenu} />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverScreen onRestart={handleRestart} onMainMenu={handleQuitToMenu} />
      )}
    </div>
  );
}
