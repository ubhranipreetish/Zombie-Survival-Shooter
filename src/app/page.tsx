'use client';

import GameCanvas from '@/components/GameCanvas';

/**
 * Main page — renders the game.
 * Uses 'use client' because the game requires browser APIs
 * (Canvas, requestAnimationFrame, event listeners).
 */
export default function Home() {
  return <GameCanvas />;
}
