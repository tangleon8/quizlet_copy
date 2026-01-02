import React, { useState, useEffect } from 'react';

interface Props {
  userName: string;
  onCreateSet: () => void;
  onImportQuestions: () => void;
  onStartTutorial: () => void;
  onClose: () => void;
}

export default function WelcomeModal({ userName, onCreateSet, onImportQuestions, onStartTutorial, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleCreateSet = () => {
    setIsVisible(false);
    setTimeout(onCreateSet, 200);
  };

  const handleImport = () => {
    setIsVisible(false);
    setTimeout(onImportQuestions, 200);
  };

  const handleTutorial = () => {
    setIsVisible(false);
    setTimeout(onStartTutorial, 200);
  };

  return (
    <div className={`welcome-modal-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`welcome-modal ${isVisible ? 'visible' : ''}`}>
        {/* Close button */}
        <button className="welcome-close" onClick={handleClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Animated illustration */}
        <div className="welcome-illustration">
          <div className="welcome-icon-container">
            <div className="welcome-icon-bg"></div>
            <svg className="welcome-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              <line x1="8" y1="6" x2="16" y2="6"/>
              <line x1="8" y1="10" x2="14" y2="10"/>
            </svg>
          </div>
          <div className="welcome-sparkles">
            <span className="sparkle s1">✦</span>
            <span className="sparkle s2">✦</span>
            <span className="sparkle s3">✦</span>
          </div>
        </div>

        {/* Content */}
        <div className="welcome-content">
          <h1>Welcome to Questly{userName ? `, ${userName.split(' ')[0]}` : ''}!</h1>
          <p>
            Create, import, and master your study sets with flashcards, quizzes, matching games, and more.
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="welcome-actions">
          <button className="welcome-btn primary" onClick={handleCreateSet}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create your first set
          </button>
          <button className="welcome-btn secondary" onClick={handleImport}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Import from PDF
          </button>
        </div>

        {/* Tutorial link */}
        <button className="welcome-tutorial-link" onClick={handleTutorial}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Take a quick tour
        </button>

        {/* Feature highlights */}
        <div className="welcome-features">
          <div className="welcome-feature">
            <div className="feature-icon flashcards">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <span>Flashcards</span>
          </div>
          <div className="welcome-feature">
            <div className="feature-icon learn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <span>Learn Mode</span>
          </div>
          <div className="welcome-feature">
            <div className="feature-icon quiz">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <span>Quizzes</span>
          </div>
          <div className="welcome-feature">
            <div className="feature-icon games">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
            </div>
            <span>Games</span>
          </div>
        </div>
      </div>
    </div>
  );
}
