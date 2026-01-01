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

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [sets, setSets] = useState<StudySet[]>([]);
  const [view, setView] = useState<AppView>('home');
  const [currentSet, setCurrentSet] = useState<StudySet | null>(null);
  const [loadingSets, setLoadingSets] = useState(false);

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

  const handleSelectSet = (set: StudySet, mode: 'flashcards' | 'learn' | 'quiz' | 'match' | 'edit' | 'view' | 'games') => {
    setCurrentSet(set);
    setView(mode);
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
    } catch (error) {
      console.error('Failed to save set:', error);
    }
    setView('home');
    setCurrentSet(null);
  };

  const handleBack = () => {
    setView('home');
    setCurrentSet(null);
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
        {view === 'flashcards' && currentSet && (
          <FlashcardMode studySet={currentSet} onBack={handleBack} />
        )}
        {view === 'learn' && currentSet && (
          <LearnMode studySet={currentSet} onBack={handleBack} />
        )}
        {view === 'quiz' && currentSet && (
          <QuizMode studySet={currentSet} onBack={handleBack} />
        )}
        {view === 'match' && currentSet && (
          <MatchMode studySet={currentSet} onBack={handleBack} />
        )}
        {view === 'view' && currentSet && (
          <SetView studySet={currentSet} onBack={handleBack} />
        )}
        {view === 'games' && currentSet && (
          <GamesMode studySet={currentSet} onBack={handleBack} />
        )}
      </main>
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
