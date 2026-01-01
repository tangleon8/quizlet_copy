import React, { useState, useEffect } from 'react';
import './App.css';
import { StudySet, AppView } from './types';
import Home from './components/Home';
import CreateEditSet from './components/CreateEditSet';
import BulkImport from './components/BulkImport';
import FlashcardMode from './components/FlashcardMode';
import LearnMode from './components/LearnMode';
import QuizMode from './components/QuizMode';
import MatchMode from './components/MatchMode';

const STORAGE_KEY = 'quizme-sets';

function App() {
  const [sets, setSets] = useState<StudySet[]>([]);
  const [view, setView] = useState<AppView>('home');
  const [currentSet, setCurrentSet] = useState<StudySet | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved sets');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  }, [sets]);

  const handleCreateNew = () => {
    setCurrentSet(null);
    setView('create');
  };

  const handleBulkImport = () => {
    setView('import');
  };

  const handleSelectSet = (set: StudySet, mode: 'flashcards' | 'learn' | 'quiz' | 'match' | 'edit') => {
    setCurrentSet(set);
    setView(mode);
  };

  const handleDeleteSet = (id: string) => {
    setSets(sets.filter((s) => s.id !== id));
  };

  const handleSaveSet = (set: StudySet) => {
    const existing = sets.find((s) => s.id === set.id);
    if (existing) {
      setSets(sets.map((s) => (s.id === set.id ? set : s)));
    } else {
      setSets([...sets, set]);
    }
    setView('home');
    setCurrentSet(null);
  };

  const handleBack = () => {
    setView('home');
    setCurrentSet(null);
  };

  return (
    <div className="App">
      <header className="App-header" onClick={() => setView('home')}>
        <h1>Quizlet</h1>
      </header>
      <main className="App-main">
        {view === 'home' && (
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
      </main>
    </div>
  );
}

export default App;
