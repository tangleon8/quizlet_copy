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
          <h1>Quizlet</h1>
        </header>
        <main className="App-main">
          <Auth />
        </main>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1 onClick={() => setView('home')} style={{ cursor: 'pointer' }}>Quizlet</h1>
        <div className="user-info">
          <span>Hi, {user.name}</span>
          <button className="btn-settings" onClick={handleOpenSettings} title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <button className="btn-logout" onClick={logout}>Log out</button>
        </div>
      </header>
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
