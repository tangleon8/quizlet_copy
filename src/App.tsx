import React, { useState, useEffect } from 'react';
import './App.css';
import { StudySet, AppView } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setsAPI } from './api';
import Auth from './components/Auth';
import Home from './components/Home';
import CreateEditSet from './components/CreateEditSet';
import BulkImport from './components/BulkImport';
import FlashcardMode from './components/FlashcardMode';
import LearnMode from './components/LearnMode';
import QuizMode from './components/QuizMode';
import MatchMode from './components/MatchMode';
import SetView from './components/SetView';
import GamesMode from './components/GamesMode';
import Settings from './components/Settings';
import StudyConfig from './components/StudyConfig';

type StudyMode = 'flashcards' | 'learn' | 'quiz' | 'match' | 'games';

interface LastStudyInfo {
  mode: StudyMode;
  timestamp: number;
}

const SETTINGS_KEY = 'study_settings';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [sets, setSets] = useState<StudySet[]>([]);
  const [view, setView] = useState<AppView>('home');
  const [currentSet, setCurrentSet] = useState<StudySet | null>(null);
  const [studySubset, setStudySubset] = useState<StudySet | null>(null);
  const [loadingSets, setLoadingSets] = useState(false);
  const [lastStudyMap, setLastStudyMap] = useState<Record<string, LastStudyInfo>>({});
  const [showStudyConfig, setShowStudyConfig] = useState(false);
  const [pendingMode, setPendingMode] = useState<StudyMode | null>(null);

  // Load last study info from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('lastStudyMap');
    if (stored) {
      try {
        setLastStudyMap(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse lastStudyMap:', e);
      }
    }
  }, []);

  // Load sets from API when user logs in
  useEffect(() => {
    if (user) {
      loadSets();
    } else {
      setSets([]);
    }
  }, [user]);

  const loadSets = async () => {
    setLoadingSets(true);
    try {
      const data = await setsAPI.getAll();
      setSets(data);
    } catch (error) {
      console.error('Failed to load sets:', error);
    } finally {
      setLoadingSets(false);
    }
  };

  const handleCreateNew = () => {
    setCurrentSet(null);
    setView('create');
  };

  const handleBulkImport = () => {
    setView('import');
  };

  const shouldShowConfig = (): boolean => {
    try {
      const settingsStr = localStorage.getItem(SETTINGS_KEY);
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        return settings.showConfigBeforeStudy !== false;
      }
    } catch (e) {
      // Default to showing config
    }
    return true;
  };

  const handleSelectSet = (set: StudySet, mode: 'flashcards' | 'learn' | 'quiz' | 'match' | 'edit' | 'view' | 'games') => {
    setCurrentSet(set);

    // For edit/view, go directly without config
    if (mode === 'edit' || mode === 'view') {
      setView(mode);
      return;
    }

    // For study modes, check if we should show config
    const studyModes: StudyMode[] = ['flashcards', 'learn', 'quiz', 'match', 'games'];
    if (studyModes.includes(mode as StudyMode)) {
      // Track last study mode
      const newMap = {
        ...lastStudyMap,
        [set.id]: {
          mode: mode as StudyMode,
          timestamp: Date.now(),
        },
      };
      setLastStudyMap(newMap);
      localStorage.setItem('lastStudyMap', JSON.stringify(newMap));

      // Check if we should show config (only for sets with more than 20 questions)
      if (shouldShowConfig() && set.questions.length > 20) {
        setPendingMode(mode as StudyMode);
        setShowStudyConfig(true);
      } else {
        setStudySubset(set);
        setView(mode);
      }
    }
  };

  const handleStudyConfigStart = (subset: StudySet) => {
    setStudySubset(subset);
    setShowStudyConfig(false);
    if (pendingMode) {
      setView(pendingMode);
    }
    setPendingMode(null);
  };

  const handleStudyConfigCancel = () => {
    setShowStudyConfig(false);
    setPendingMode(null);
    setCurrentSet(null);
  };

  const handleDeleteSet = async (id: string) => {
    try {
      await setsAPI.delete(id);
      setSets(sets.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete set:', error);
    }
  };

  const handleSaveSet = async (set: StudySet) => {
    try {
      const existing = sets.find((s) => s.id === set.id);
      if (existing) {
        const updated = await setsAPI.update(
          set.id,
          set.title,
          set.questions.map((q) => ({
            questionText: q.questionText,
            correctAnswer: q.correctAnswer,
          }))
        );
        setSets(sets.map((s) => (s.id === set.id ? updated : s)));
      } else {
        const created = await setsAPI.create(
          set.title,
          set.questions.map((q) => ({
            questionText: q.questionText,
            correctAnswer: q.correctAnswer,
          }))
        );
        setSets([...sets, created]);
      }
      setView('home');
      setCurrentSet(null);
    } catch (error: any) {
      console.error('Failed to save set:', error);
      alert(`Failed to save study set: ${error.message || 'Unknown error'}. Please try again.`);
    }
  };

  const handleBack = () => {
    setView('home');
    setCurrentSet(null);
    setStudySubset(null);
  };

  const handleOpenSettings = () => {
    setView('settings');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="App">
        <div className="loading-screen">Loading...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Questly</h1>
        </header>
        <main className="App-main">
          <Auth />
        </main>
      </div>
    );
  }

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Get recent sets for sidebar
  const recentSets = [...sets]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  return (
    <div className="App app-with-sidebar">
      {/* Header */}
      <header className="App-header">
        <div className="header-left">
          <button className="btn-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="header-brand" onClick={() => setView('home')}>
            <img src="/Questly.png" alt="Questly" className="header-logo" />
            <span className="header-title">Questly</span>
          </div>
        </div>

        <div className="header-center">
          <div className="header-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Search your sets..." />
          </div>
        </div>

        <div className="header-right">
          <button className="btn-header-action" onClick={handleBulkImport} title="Import">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          <button className="btn-header-action" onClick={handleCreateNew} title="Create">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button className="btn-header-action" onClick={handleOpenSettings} title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>
          <div className="header-user">
            <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <button className="btn-logout-small" onClick={logout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="app-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${view === 'home' ? 'active' : ''}`}
              onClick={() => setView('home')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span>Home</span>
            </button>
            <button className="nav-item" onClick={handleCreateNew}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <span>Create Set</span>
            </button>
            <button className="nav-item" onClick={handleBulkImport}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <span>Import PDF</span>
            </button>
          </nav>

          <div className="sidebar-section">
            <h4>Your Sets</h4>
            <div className="sidebar-sets">
              {recentSets.map((set) => (
                <button
                  key={set.id}
                  className="sidebar-set-item"
                  onClick={() => handleSelectSet(set, 'view')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  <span>{set.title}</span>
                  <small>{set.questions.length}</small>
                </button>
              ))}
              {sets.length > 5 && (
                <button className="sidebar-set-item see-all" onClick={() => setView('home')}>
                  <span>See all {sets.length} sets</span>
                </button>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h4>Quick Actions</h4>
            <div className="quick-actions">
              {sets.length > 0 && (
                <>
                  <button
                    className="quick-action"
                    onClick={() => sets[0] && handleSelectSet(sets[0], 'flashcards')}
                  >
                    <div className="quick-icon flashcards">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    </div>
                    <span>Flashcards</span>
                  </button>
                  <button
                    className="quick-action"
                    onClick={() => sets[0] && handleSelectSet(sets[0], 'learn')}
                  >
                    <div className="quick-icon learn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                    </div>
                    <span>Learn</span>
                  </button>
                  <button
                    className="quick-action"
                    onClick={() => sets[0] && handleSelectSet(sets[0], 'games')}
                  >
                    <div className="quick-icon games">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polygon points="10 8 16 12 10 16 10 8"/>
                      </svg>
                    </div>
                    <span>Games</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="App-main">
          {loadingSets && view === 'home' && (
            <div className="loading-sets">Loading your sets...</div>
          )}
          {view === 'home' && !loadingSets && (
            <Home
              sets={sets}
              onCreateNew={handleCreateNew}
              onBulkImport={handleBulkImport}
              onSelectSet={handleSelectSet}
              onDeleteSet={handleDeleteSet}
              lastStudyMap={lastStudyMap}
            />
          )}
          {(view === 'create' || view === 'edit') && (
            <CreateEditSet
              existingSet={currentSet}
              onSave={handleSaveSet}
              onCancel={handleBack}
            />
          )}
          {view === 'import' && (
            <BulkImport
              onSave={handleSaveSet}
              onCancel={handleBack}
            />
          )}
          {view === 'flashcards' && (studySubset || currentSet) && (
            <FlashcardMode studySet={studySubset || currentSet!} onBack={handleBack} />
          )}
          {view === 'learn' && (studySubset || currentSet) && (
            <LearnMode studySet={studySubset || currentSet!} onBack={handleBack} />
          )}
          {view === 'quiz' && (studySubset || currentSet) && (
            <QuizMode studySet={studySubset || currentSet!} onBack={handleBack} />
          )}
          {view === 'match' && (studySubset || currentSet) && (
            <MatchMode studySet={studySubset || currentSet!} onBack={handleBack} />
          )}
          {view === 'view' && currentSet && (
            <SetView studySet={currentSet} onBack={handleBack} />
          )}
          {view === 'games' && (studySubset || currentSet) && (
            <GamesMode studySet={studySubset || currentSet!} onBack={handleBack} />
          )}
          {view === 'settings' && (
            <Settings onBack={handleBack} />
          )}
        </main>
      </div>

      {showStudyConfig && currentSet && pendingMode && (
        <StudyConfig
          studySet={currentSet}
          mode={pendingMode}
          onStart={handleStudyConfigStart}
          onCancel={handleStudyConfigCancel}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
