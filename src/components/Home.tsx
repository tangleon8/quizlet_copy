import React from 'react';
import { StudySet } from '../types';

type StudyMode = 'flashcards' | 'learn' | 'quiz' | 'match' | 'edit' | 'view' | 'games';

interface Props {
  sets: StudySet[];
  onCreateNew: () => void;
  onBulkImport: () => void;
  onSelectSet: (set: StudySet, mode: StudyMode) => void;
  onDeleteSet: (id: string) => void;
}

export default function Home({ sets, onCreateNew, onBulkImport, onSelectSet, onDeleteSet }: Props) {
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this study set?')) {
      onDeleteSet(id);
    }
  };

  // Get recent sets (last 3 modified)
  const recentSets = [...sets]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  // Get sets that have been studied (simulated as sets with more than 5 questions)
  const jumpBackInSets = sets.filter(s => s.questions.length >= 3).slice(0, 2);

  return (
    <div className="home">
      <div className="home-header">
        <h2>Your library</h2>
        <div className="header-buttons">
          <button className="btn-import" onClick={onBulkImport}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>
          <button className="btn-create" onClick={onCreateNew}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create
          </button>
        </div>
      </div>

      {sets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No study sets yet</h3>
          <p>Create your first set or import questions</p>
          <div className="empty-buttons">
            <button className="btn-create-large" onClick={onCreateNew}>
              Create set
            </button>
            <button className="btn-import-large" onClick={onBulkImport}>
              Import questions
            </button>
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
                {jumpBackInSets.map((set) => (
                  <div key={set.id} className="set-card-mini" onClick={() => onSelectSet(set, 'flashcards')}>
                    <div className="mini-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    </div>
                    <div className="mini-content">
                      <h4>{set.title}</h4>
                      <span>{set.questions.length} terms</span>
                    </div>
                  </div>
                ))}
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
              {recentSets.map((set) => (
                <div key={set.id} className="set-card-mini" onClick={() => onSelectSet(set, 'flashcards')}>
                  <div className="mini-icon blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </div>
                  <div className="mini-content">
                    <h4>{set.title}</h4>
                    <span>{set.questions.length} terms</span>
                  </div>
                </div>
              ))}
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
