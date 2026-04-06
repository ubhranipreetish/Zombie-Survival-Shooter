'use client';
// ============================================================
// PauseMenu.tsx — Pause overlay with resume/quit options
// ============================================================

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
  return (
    <div id="pause-menu" className="menu-overlay pause-overlay">
      <div className="menu-content pause-content">
        <h2 className="pause-title">PAUSED</h2>
        <div className="menu-divider" />
        <div className="pause-buttons">
          <button
            id="resume-btn"
            className="menu-start-btn"
            onClick={onResume}
          >
            <span className="menu-start-btn-text">RESUME</span>
            <div className="menu-start-btn-glow" />
          </button>
          <button
            id="quit-btn"
            className="game-over-menu-btn"
            onClick={onQuit}
          >
            QUIT TO MENU
          </button>
        </div>
      </div>
    </div>
  );
}
