'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import GameCanvas from '@/components/GameCanvas';

/**
 * Main page — renders the game.
 * Uses 'use client' because the game requires browser APIs
 * (Canvas, requestAnimationFrame, event listeners).
 */
export default function Home() {
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
    } else {
      setIsAuthLoading(false);
    }
  }, [router]);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a12] flex-col gap-4">
        <div className="auth-spinner" />
        <p className="text-[#8888aa] font-heading text-sm tracking-[4px] animate-pulse">INITIATING SYSTEM...</p>
      </div>
    );
  }

  return <GameCanvas />;
}
