'use client';
// ============================================================
// CardSelection.tsx — Power-up card picker between waves
// Shows 3 cards with rarity-colored borders and glow effects
// ============================================================

import { PowerUpCard, RARITY_COLORS, CardRarity } from '@/game/interfaces/types';

interface CardSelectionProps {
  cards: PowerUpCard[];
  collectedCards: PowerUpCard[];
  onSelect: (card: PowerUpCard) => void;
}

export default function CardSelection({ cards, collectedCards, onSelect }: CardSelectionProps) {
  return (
    <div id="card-selection" className="menu-overlay card-selection-overlay">
      <div className="card-selection-content">
        <h2 className="card-selection-title">CHOOSE YOUR UPGRADE</h2>
        <div className="menu-divider" />

        {/* Card Choices */}
        <div className="card-choices">
          {cards.map((card) => {
            const colors = RARITY_COLORS[card.rarity];
            return (
              <button
                key={card.id}
                id={`card-${card.id}`}
                className="upgrade-card"
                style={{
                  borderColor: colors.border,
                  boxShadow: `0 0 20px ${colors.glow}, inset 0 0 30px ${colors.bg}`,
                  background: `linear-gradient(180deg, ${colors.bg} 0%, rgba(10,10,18,0.95) 100%)`,
                }}
                onClick={() => onSelect(card)}
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
