'use client';
// ============================================================
// CardSelection.tsx — Power-up card picker between waves
// Shows 3 cards with rarity-colored borders and glow effects
// ============================================================

import { useState, useEffect } from 'react';
import { PowerUpCard, RARITY_COLORS, CardRarity } from '@/game/interfaces/types';

interface CardSelectionProps {
  cards: PowerUpCard[];
  collectedCards: PowerUpCard[];
  onSelect: (card: PowerUpCard) => void;
  score?: number;
  level?: number;
}

export default function CardSelection({ cards, collectedCards, onSelect, score = 0, level = 1 }: CardSelectionProps) {
  // Delay pointer-events to prevent accidental clicks right as the screen opens
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div id="card-selection" className="menu-overlay card-selection-overlay">
      <div className="card-selection-content">
        <h2 className="card-selection-title">CHOOSE YOUR UPGRADE</h2>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: 3, color: '#9fa8da' }}>
            LV <span style={{ fontSize: 18, fontWeight: 700, color: '#ffd600' }}>{level}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: 3, color: 'var(--text-secondary)' }}>
            SCORE: <span style={{ color: 'var(--accent-cyan)' }}>{score.toLocaleString()}</span>
          </div>
        </div>
        <div className="menu-divider" />

        {/* Card Choices */}
        <div className="card-choices">
          {cards.map((card) => {
            const colors = RARITY_COLORS[card.rarity];
            return (
              <button
                key={card.id}
                id={`card-${card.id}`}
                className={`upgrade-card${ready ? '' : ' card-not-ready'}`}
                style={{
                  borderColor: colors.border,
                  boxShadow: `0 0 20px ${colors.glow}, inset 0 0 30px ${colors.bg}`,
                  background: `linear-gradient(180deg, ${colors.bg} 0%, rgba(10,10,18,0.95) 100%)`,
                  pointerEvents: ready ? 'auto' : 'none',
                  opacity: ready ? 1 : 0.6,
                  transition: 'opacity 0.4s ease',
                }}
                onClick={() => ready && onSelect(card)}
              >
                {/* Rarity Badge */}
                <div
                  className="card-rarity-badge"
                  style={{ color: colors.text, borderColor: colors.border }}
                >
                  {card.rarity}
                </div>

                {/* Icon */}
                <div className="card-icon">{card.icon}</div>

                {/* Name */}
                <div className="card-name" style={{ color: colors.text }}>
                  {card.name}
                </div>

                {/* Description */}
                <div className="card-description">{card.description}</div>

                {/* Legendary shimmer */}
                {card.rarity === CardRarity.LEGENDARY && (
                  <div className="card-legendary-shimmer" />
                )}
              </button>
            );
          })}
        </div>

        {/* Collected Cards */}
        {collectedCards.length > 0 && (
          <div className="collected-cards-section">
            <div className="collected-cards-label">YOUR COLLECTION</div>
            <div className="collected-cards-row">
              {collectedCards.map((card, index) => {
                const colors = RARITY_COLORS[card.rarity];
                return (
                  <div
                    key={`${card.id}-${index}`}
                    className="collected-card-mini"
                    style={{
                      borderColor: colors.border,
                      boxShadow: `0 0 6px ${colors.glow}`,
                    }}
                    title={`${card.name}: ${card.description}`}
                  >
                    <span className="collected-card-icon">{card.icon}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
