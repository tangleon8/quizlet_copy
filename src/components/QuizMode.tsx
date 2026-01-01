import React, { useState, useEffect } from 'react';
import { StudySet } from '../types';

interface Props {
  studySet: StudySet;
  onBack: () => void;
}

interface SavedQuizProgress {
  currentIndex: number;
  selectedAnswers: string[][];
  timestamp: number;
}

const STORAGE_KEY_PREFIX = 'quiz_progress_';

export default function QuizMode({ studySet, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[][]>(
    new Array(studySet.questions.length).fill(null).map(() => [])
  );
  const [showResults, setShowResults] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedQuizProgress | null>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${studySet.id}`;

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const progress: SavedQuizProgress = JSON.parse(saved);
        // Check if progress is valid and not too old (24 hours)
        const isValid = progress.selectedAnswers.length === studySet.questions.length;
        const isRecent = Date.now() - progress.timestamp < 24 * 60 * 60 * 1000;

        if (isValid && isRecent) {
          setSavedProgress(progress);
          setShowResumePrompt(true);
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (e) {
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey, studySet.questions.length]);

  // Save progress whenever answers change
  useEffect(() => {
    if (!showResults && !showResumePrompt) {
      const hasAnyAnswers = selectedAnswers.some(a => a.length > 0);
      if (hasAnyAnswers) {
        const progress: SavedQuizProgress = {
          currentIndex,
          selectedAnswers,
          timestamp: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(progress));
      }
    }
  }, [currentIndex, selectedAnswers, showResults, showResumePrompt, storageKey]);

  const resumeProgress = () => {
    if (savedProgress) {
      setCurrentIndex(savedProgress.currentIndex);
      setSelectedAnswers(savedProgress.selectedAnswers);
    }
    setShowResumePrompt(false);
  };

  const startFresh = () => {
    localStorage.removeItem(storageKey);
    setSavedProgress(null);
    setShowResumePrompt(false);
  };

  const currentQuestion = studySet.questions[currentIndex];

  // Check if a question has multiple correct answers
  const hasMultipleAnswers = (correctAnswer: string): boolean => {
    return correctAnswer.includes(',');
  };

  // Get correct answers as an array
  const getCorrectAnswers = (correctAnswer: string): string[] => {
    return correctAnswer.split(',').map(a => a.trim().toUpperCase());
  };

  // Parse choices from question text
  const parseChoices = (text: string): { questionPart: string; choices: { letter: string; text: string }[] } => {
    const choices: { letter: string; text: string }[] = [];
    const choiceRegex = /([A-E])[.)]\s*([\s\S]*?)(?=(?:[A-E][.)]\s)|$)/gi;

    let match;
    const matches: { letter: string; text: string; index: number }[] = [];

    while ((match = choiceRegex.exec(text)) !== null) {
      const letter = match[1].toUpperCase();
      const choiceText = match[2].trim().replace(/\s+/g, ' ');

      if (choiceText && !matches.find(m => m.letter === letter)) {
        matches.push({ letter, text: choiceText, index: match.index });
      }
    }

    matches.sort((a, b) => a.letter.localeCompare(b.letter));

    let questionPart = text;
    if (matches.length > 0) {
      const firstChoiceIndex = Math.min(...matches.map(m => m.index));
      questionPart = text.substring(0, firstChoiceIndex).trim();
      choices.push(...matches.map(m => ({ letter: m.letter, text: m.text })));
    }

    questionPart = questionPart.replace(/\s+/g, ' ').trim();

    return { questionPart, choices };
  };

  const { questionPart, choices } = parseChoices(currentQuestion.questionText);
  const isMultipleAnswer = hasMultipleAnswers(currentQuestion.correctAnswer);
  const correctAnswersList = getCorrectAnswers(currentQuestion.correctAnswer);

  const toggleAnswer = (letter: string) => {
    const updated = [...selectedAnswers];
    const currentSelections = [...updated[currentIndex]];

    if (isMultipleAnswer) {
      const index = currentSelections.indexOf(letter);
      if (index === -1) {
        currentSelections.push(letter);
      } else {
        currentSelections.splice(index, 1);
      }
    } else {
      currentSelections.length = 0;
      currentSelections.push(letter);
    }

    updated[currentIndex] = currentSelections;
    setSelectedAnswers(updated);
  };

  const nextQuestion = () => {
    if (currentIndex < studySet.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const submitQuiz = () => {
    // Clear saved progress when quiz is submitted
    localStorage.removeItem(storageKey);
    setShowResults(true);
  };

  const retake = () => {
    localStorage.removeItem(storageKey);
    setCurrentIndex(0);
    setSelectedAnswers(new Array(studySet.questions.length).fill(null).map(() => []));
    setShowResults(false);
  };

  const checkAnswer = (selected: string[], correct: string): boolean => {
    if (selected.length === 0) return false;
    const correctArr = getCorrectAnswers(correct);

    if (selected.length !== correctArr.length) return false;

    const selectedSorted = [...selected].sort();
    const correctSorted = [...correctArr].sort();

    return selectedSorted.every((s, i) => s === correctSorted[i]);
  };

  const calculateScore = () => {
    let correct = 0;
    studySet.questions.forEach((q, i) => {
      if (checkAnswer(selectedAnswers[i], q.correctAnswer)) {
        correct++;
      }
    });
    return correct;
  };

  // Resume prompt
  if (showResumePrompt && savedProgress) {
    const answeredCount = savedProgress.selectedAnswers.filter(a => a.length > 0).length;
    const progressPercent = Math.round((answeredCount / studySet.questions.length) * 100);

    return (
      <div className="quiz-mode">
        <div className="mode-header">
          <button className="btn-back" onClick={onBack}>
            Exit
          </button>
          <span className="progress-text">Test</span>
        </div>

        <div className="resume-prompt">
          <div className="resume-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h2>Continue where you left off?</h2>
          <p>You have a quiz in progress</p>
          <div className="resume-stats">
            <div className="resume-stat">
              <span className="stat-value">{answeredCount}</span>
              <span className="stat-label">of {studySet.questions.length} answered</span>
            </div>
            <div className="resume-stat">
              <span className="stat-value">{progressPercent}%</span>
              <span className="stat-label">complete</span>
            </div>
          </div>
          <div className="resume-actions">
            <button className="btn-secondary" onClick={startFresh}>
              Start Over
            </button>
            <button className="btn-primary" onClick={resumeProgress}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / studySet.questions.length) * 100);

    return (
      <div className="quiz-results">
        <div className="results-header">
          <button className="btn-back" onClick={onBack}>
            Back to Set
          </button>
        </div>

        <div className="score-section">
          <div className="score-circle">
            <span className="score-percent">{percentage}%</span>
          </div>
          <p className="score-text">
            {score} of {studySet.questions.length} correct
          </p>
        </div>

        <div className="results-list">
          {studySet.questions.map((q, index) => {
            const isCorrect = checkAnswer(selectedAnswers[index], q.correctAnswer);
            const { questionPart: qText } = parseChoices(q.questionText);
            const correctAnswers = getCorrectAnswers(q.correctAnswer);
            return (
              <div key={q.id} className={`result-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="result-status">
                  {isCorrect ? '✓' : '✗'}
                </div>
                <div className="result-content">
                  <div className="result-question">{qText}</div>
                  {!isCorrect && selectedAnswers[index].length > 0 && (
                    <div className="your-answer">
                      Your answer: <span>{selectedAnswers[index].sort().join(', ')}</span>
                    </div>
                  )}
                  <div className="correct-answer">
                    Correct: <span>{correctAnswers.join(', ')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="results-actions">
          <button className="btn-secondary" onClick={retake}>
            Retake Quiz
          </button>
          <button className="btn-primary" onClick={onBack}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-mode">
      <div className="mode-header">
        <button className="btn-back" onClick={onBack}>
          Exit
        </button>
        <span className="progress-text">
          {currentIndex + 1} / {studySet.questions.length}
        </span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentIndex + 1) / studySet.questions.length) * 100}%` }}
        />
      </div>

      <div className="question-card">
        <div className="question-content">
          <div className="question-text">{questionPart}</div>
          {isMultipleAnswer && (
            <div className="multi-answer-hint">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Select all that apply ({correctAnswersList.length} answers)
            </div>
          )}
        </div>

        <div className="choices-list">
          {choices.map((choice) => (
            <button
              key={choice.letter}
              className={`choice-option ${selectedAnswers[currentIndex].includes(choice.letter) ? 'selected' : ''}`}
              onClick={() => toggleAnswer(choice.letter)}
            >
              <span className="choice-letter">{choice.letter}</span>
              <span className="choice-text">{choice.text}</span>
              {isMultipleAnswer && selectedAnswers[currentIndex].includes(choice.letter) && (
                <span className="choice-check">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="nav-buttons">
        <button
          className="btn-nav"
          onClick={prevQuestion}
          disabled={currentIndex === 0}
        >
          Previous
        </button>

        {currentIndex === studySet.questions.length - 1 ? (
          <button className="btn-submit" onClick={submitQuiz}>
            Submit
          </button>
        ) : (
          <button className="btn-nav btn-next" onClick={nextQuestion}>
            Next
          </button>
        )}
      </div>

      <div className="question-dots">
        {studySet.questions.map((_, index) => (
          <button
            key={index}
            className={`dot ${currentIndex === index ? 'active' : ''} ${
              selectedAnswers[index].length > 0 ? 'answered' : ''
            }`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}
