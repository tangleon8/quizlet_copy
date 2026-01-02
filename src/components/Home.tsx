import React from 'react';
import { StudySet } from '../types';

type StudyMode = 'flashcards' | 'learn' | 'quiz' | 'match' | 'edit' | 'view' | 'games';
type ActiveStudyMode = 'flashcards' | 'learn' | 'quiz' | 'match' | 'games';

interface LastStudyInfo {
  mode: ActiveStudyMode;
  timestamp: number;
}

interface Props {
  sets: StudySet[];
  onCreateNew: () => void;
  onBulkImport: () => void;
  onSelectSet: (set: StudySet, mode: StudyMode) => void;
  onDeleteSet: (id: string) => void;
  lastStudyMap: Record<string, LastStudyInfo>;
  showWelcomeBack?: boolean;
  onDismissWelcomeBack?: () => void;
  userName?: string;
}

// Mode display info
const modeInfo: Record<ActiveStudyMode, { label: string; icon: React.ReactNode }> = {
  flashcards: {
    label: 'Flashcards',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  },
  learn: {
    label: 'Learn',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  },
  quiz: {
    label: 'Test',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
  },
  match: {
    label: 'Match',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  },
  games: {
    label: 'Games',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
  }
};

export default function Home({ sets, onCreateNew, onBulkImport, onSelectSet, onDeleteSet, lastStudyMap, showWelcomeBack, onDismissWelcomeBack, userName }: Props) {
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this study set?')) {
      onDeleteSet(id);
    }
  };

  // Get the last mode for a set, default to flashcards
  const getLastMode = (setId: string): ActiveStudyMode => {
    return lastStudyMap[setId]?.mode || 'flashcards';
  };

  // Get recent sets (last 3 modified)
  const recentSets = [...sets]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  // Get sets that have been studied (those with lastStudyMap entries), sorted by most recent
  const jumpBackInSets = [...sets]
    .filter(s => lastStudyMap[s.id])
    .sort((a, b) => (lastStudyMap[b.id]?.timestamp || 0) - (lastStudyMap[a.id]?.timestamp || 0))
    .slice(0, 3);

  // Get a random set for suggestions
  const getRandomSet = () => sets.length > 0 ? sets[Math.floor(Math.random() * sets.length)] : null;
  const suggestedSet = getRandomSet();

  // Get first name for personalized greeting
  const firstName = userName?.split(' ')[0] || '';

  return (
    <div className="home">
      {/* Welcome Back Banner - dismissible for returning users */}
      {showWelcomeBack && sets.length > 0 && (
        <div className="welcome-back-banner">
          <div className="welcome-back-content">
            <h2>Welcome back{firstName ? `, ${firstName}` : ''}!</h2>
            <p>Ready to continue learning? Pick up where you left off.</p>
          </div>
          <button className="welcome-back-dismiss" onClick={onDismissWelcomeBack} aria-label="Dismiss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Suggestions */}
      {sets.length > 0 && (
        <div className="suggestions-section">
          <h3>Suggested for you</h3>
          <div className="suggestion-cards">
            {suggestedSet && (
              <>
                <div className="suggestion-card" onClick={() => onSelectSet(suggestedSet, 'flashcards')}>
                  <div className="suggestion-icon flashcards">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </div>
                  <div className="suggestion-content">
                    <span className="suggestion-action">Review with flashcards</span>
                    <span className="suggestion-set">{suggestedSet.title}</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                <div className="suggestion-card" onClick={() => onSelectSet(suggestedSet, 'learn')}>
                  <div className="suggestion-icon learn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                  </div>
                  <div className="suggestion-content">
                    <span className="suggestion-action">Practice with Learn mode</span>
                    <span className="suggestion-set">{suggestedSet.title}</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                <div className="suggestion-card" onClick={() => onSelectSet(suggestedSet, 'games')}>
                  <div className="suggestion-icon games">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polygon points="10 8 16 12 10 16 10 8"/>
                    </svg>
                  </div>
                  <div className="suggestion-content">
                    <span className="suggestion-action">Play a quick game</span>
                    <span className="suggestion-set">{suggestedSet.title}</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                <div className="suggestion-card" onClick={() => onSelectSet(suggestedSet, 'quiz')}>
                  <div className="suggestion-icon quiz">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <div className="suggestion-content">
                    <span className="suggestion-action">Take a practice test</span>
                    <span className="suggestion-set">{suggestedSet.title}</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {sets.length === 0 ? (
        <div className="empty-state-container">
          {/* Main empty state card */}
          <div className="empty-state-card">
            <div className="empty-state-illustration">
              <div className="empty-illustration-bg"></div>
              <svg className="empty-illustration-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <div className="empty-sparkle s1">+</div>
              <div className="empty-sparkle s2">+</div>
            </div>
            <h2>Your study journey starts here</h2>
            <p>Create your first study set to start learning with flashcards, quizzes, games, and more.</p>
            <div className="empty-state-actions">
              <button className="empty-btn primary" onClick={onCreateNew}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create your first set
              </button>
              <button className="empty-btn secondary" onClick={onBulkImport}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Import from PDF
              </button>
            </div>
          </div>

          {/* Feature cards */}
          <div className="empty-features-grid">
            <div className="empty-feature-card">
              <div className="empty-feature-icon flashcards">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h4>Flashcards</h4>
              <p>Flip through cards to memorize terms and definitions</p>
            </div>
            <div className="empty-feature-card">
              <div className="empty-feature-icon learn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <h4>Learn Mode</h4>
              <p>Type answers to reinforce your knowledge</p>
            </div>
            <div className="empty-feature-card">
              <div className="empty-feature-icon quiz">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <h4>Quizzes</h4>
              <p>Test yourself with multiple choice questions</p>
            </div>
            <div className="empty-feature-card">
              <div className="empty-feature-icon games">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
              </div>
              <h4>Games</h4>
              <p>Make learning fun with interactive games</p>
            </div>
          </div>

          {/* Tips section */}
          <div className="empty-tips">
            <div className="tip-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div className="tip-content">
              <strong>Pro tip:</strong> Import questions from a PDF to quickly create study sets from your notes or textbooks.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Jump Back In Section */}
          {jumpBackInSets.length > 0 && (
            <div className="home-section">
              <div className="section-header">
                <div className="section-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  <h3>Jump back in</h3>
                </div>
              </div>
              <div className="sets-row">
                {jumpBackInSets.map((set) => {
                  const lastMode = getLastMode(set.id);
                  const info = modeInfo[lastMode];
                  return (
                    <div key={set.id} className="set-card-mini" onClick={() => onSelectSet(set, lastMode)}>
                      <div className="mini-icon">
                        {info.icon}
                      </div>
                      <div className="mini-content">
                        <h4>{set.title}</h4>
                        <span className="mini-mode">{info.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Section */}
          <div className="home-section">
            <div className="section-header">
              <div className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <h3>Recent</h3>
              </div>
            </div>
            <div className="sets-row">
              {recentSets.map((set) => {
                const lastMode = getLastMode(set.id);
                const info = modeInfo[lastMode];
                const hasStudied = !!lastStudyMap[set.id];
                return (
                  <div key={set.id} className="set-card-mini" onClick={() => onSelectSet(set, lastMode)}>
                    <div className={`mini-icon ${hasStudied ? '' : 'blue'}`}>
                      {hasStudied ? info.icon : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                      )}
                    </div>
                    <div className="mini-content">
                      <h4>{set.title}</h4>
                      <span className={hasStudied ? 'mini-mode' : ''}>{hasStudied ? info.label : `${set.questions.length} terms`}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Your Folders Section */}
          <div className="home-section">
            <div className="section-header">
              <div className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <h3>Your folders</h3>
              </div>
              <button className="btn-add-folder">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New folder
              </button>
            </div>
            <div className="folders-grid">
              <div className="folder-card">
                <div className="folder-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <h4>All sets</h4>
                <span>{sets.length} sets</span>
              </div>
            </div>
          </div>

          {/* All Study Sets */}
          <div className="home-section">
            <div className="section-header">
              <div className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <h3>All study sets</h3>
              </div>
            </div>
            <div className="sets-grid">
              {sets.map((set) => (
                <div key={set.id} className="set-card">
                  <div className="set-card-header">
                    <h3>{set.title}</h3>
                    <span className="term-count">{set.questions.length} terms</span>
                  </div>

                  <div className="set-card-modes">
                    <button onClick={() => onSelectSet(set, 'flashcards')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                      Flashcards
                    </button>
                    <button onClick={() => onSelectSet(set, 'learn')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                      Learn
                    </button>
                    <button onClick={() => onSelectSet(set, 'quiz')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      Test
                    </button>
                    <button onClick={() => onSelectSet(set, 'match')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                      </svg>
                      Match
                    </button>
                    <button onClick={() => onSelectSet(set, 'games')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polygon points="10 8 16 12 10 16 10 8"/>
                      </svg>
                      Games
                    </button>
                    <button onClick={() => onSelectSet(set, 'view')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      View
                    </button>
                  </div>

                  <div className="set-card-actions">
                    <button onClick={() => onSelectSet(set, 'edit')}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                    <button
                      className="delete"
                      onClick={(e) => handleDelete(e, set.id)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
