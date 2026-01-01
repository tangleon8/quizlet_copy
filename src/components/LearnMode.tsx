import React, { useState, useEffect } from 'react';
import { StudySet } from '../types';

interface Props {
  studySet: StudySet;
  onBack: () => void;
}

interface SavedLearnProgress {
  currentIndex: number;
  wrongIndices: number[];
  isReviewMode: boolean;
  reviewIndex: number;
  masteredCount: number;
  timestamp: number;
}

const STORAGE_KEY_PREFIX = 'learn_progress_';

// Format question text with bullet points on separate lines
const formatQuestionText = (text: string): React.ReactNode => {
  // Check if text contains bullet points
  if (!text.includes('•')) {
    return text;
  }

  // Split by bullet points and format
  const parts = text.split('•').map(part => part.trim()).filter(Boolean);

  if (parts.length <= 1) {
    return text;
  }

  // First part is the main question, rest are bullet points
  const mainQuestion = parts[0];
  const bullets = parts.slice(1);

  return (
    <>
      <div>{mainQuestion}</div>
      <ul className="question-bullets">
        {bullets.map((bullet, index) => (
          <li key={index}>{bullet}</li>
        ))}
      </ul>
    </>
  );
};

export default function LearnMode({ studySet, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [wrongIndices, setWrongIndices] = useState<number[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgress, setSavedProgress] = useState<SavedLearnProgress | null>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${studySet.id}`;

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const progress: SavedLearnProgress = JSON.parse(saved);
        // Check if progress is valid and not too old (24 hours)
        const isRecent = Date.now() - progress.timestamp < 24 * 60 * 60 * 1000;
        const isValid = progress.currentIndex < studySet.questions.length;

        if (isValid && isRecent && (progress.currentIndex > 0 || progress.masteredCount > 0)) {
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

  // Save progress whenever state changes
  useEffect(() => {
    if (!isComplete && !showResumePrompt && (currentIndex > 0 || masteredCount > 0)) {
      const progress: SavedLearnProgress = {
        currentIndex,
        wrongIndices,
        isReviewMode,
        reviewIndex,
        masteredCount,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(progress));
    }
  }, [currentIndex, wrongIndices, isReviewMode, reviewIndex, masteredCount, isComplete, showResumePrompt, storageKey]);

  const resumeProgress = () => {
    if (savedProgress) {
      setCurrentIndex(savedProgress.currentIndex);
      setWrongIndices(savedProgress.wrongIndices);
      setIsReviewMode(savedProgress.isReviewMode);
      setReviewIndex(savedProgress.reviewIndex);
      setMasteredCount(savedProgress.masteredCount);
    }
    setShowResumePrompt(false);
  };

  const startFresh = () => {
    localStorage.removeItem(storageKey);
    setSavedProgress(null);
    setShowResumePrompt(false);
  };

  const getCurrentQuestion = () => {
    if (isReviewMode) {
      return studySet.questions[wrongIndices[reviewIndex]];
    }
    return studySet.questions[currentIndex];
  };

  const currentQuestion = getCurrentQuestion();

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
    if (showAnswer) return;

    if (isMultipleAnswer) {
      setSelectedAnswers(prev => {
        const index = prev.indexOf(letter);
        if (index === -1) {
          return [...prev, letter];
        } else {
          return prev.filter(l => l !== letter);
        }
      });
    } else {
      setSelectedAnswers([letter]);
      checkAndShowAnswer([letter]);
    }
  };

  const checkAndShowAnswer = (answers: string[]) => {
    const correct = checkAnswer(answers, currentQuestion.correctAnswer);
    setIsCorrect(correct);
    setShowAnswer(true);

    if (correct) {
      setMasteredCount((prev) => prev + 1);
      // Auto-advance after brief feedback
      setTimeout(() => {
        advanceToNext(true);
      }, 400);
    } else if (!isReviewMode) {
      const qIndex = currentIndex;
      if (!wrongIndices.includes(qIndex)) {
        setWrongIndices([...wrongIndices, qIndex]);
      }
    }
  };

  const advanceToNext = (wasCorrect: boolean) => {
    setSelectedAnswers([]);
    setShowAnswer(false);
    setIsCorrect(null);

    if (isReviewMode) {
      if (wasCorrect) {
        setWrongIndices((prevWrong) => {
          const newWrongIndices = prevWrong.filter((_, i) => i !== reviewIndex);
          if (newWrongIndices.length === 0) {
            localStorage.removeItem(storageKey);
            setIsComplete(true);
          } else if (reviewIndex >= newWrongIndices.length) {
            setReviewIndex(0);
          }
          return newWrongIndices;
        });
      } else {
        setReviewIndex((prev) =>
          prev < wrongIndices.length - 1 ? prev + 1 : 0
        );
      }
    } else {
      setCurrentIndex((prevIndex) => {
        if (prevIndex < studySet.questions.length - 1) {
          return prevIndex + 1;
        } else {
          if (wrongIndices.length > 0) {
            setIsReviewMode(true);
            setReviewIndex(0);
          } else {
            localStorage.removeItem(storageKey);
            setIsComplete(true);
          }
          return prevIndex;
        }
      });
    }
  };

  const submitMultipleAnswers = () => {
    if (selectedAnswers.length === 0) return;
    checkAndShowAnswer(selectedAnswers);
  };

  const checkAnswer = (selected: string[], correct: string): boolean => {
    if (selected.length === 0) return false;
    const correctArr = getCorrectAnswers(correct);

    if (selected.length !== correctArr.length) return false;

    const selectedSorted = [...selected].sort();
    const correctSorted = [...correctArr].sort();

    return selectedSorted.every((s, i) => s === correctSorted[i]);
  };

  const nextQuestion = () => {
    advanceToNext(false);
  };

  const restart = () => {
    localStorage.removeItem(storageKey);
    setCurrentIndex(0);
    setSelectedAnswers([]);
    setShowAnswer(false);
    setIsCorrect(null);
    setWrongIndices([]);
    setIsReviewMode(false);
    setReviewIndex(0);
    setMasteredCount(0);
    setIsComplete(false);
  };

  // Resume prompt
  if (showResumePrompt && savedProgress) {
    const progressPercent = Math.round((savedProgress.masteredCount / studySet.questions.length) * 100);

    return (
      <div className="learn-mode">
        <div className="mode-header">
          <button className="btn-back" onClick={onBack}>
            Exit
          </button>
          <span className="progress-text">Learn</span>
        </div>

        <div className="resume-prompt">
          <div className="resume-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <h2>Continue where you left off?</h2>
          <p>You have a learning session in progress</p>
          <div className="resume-stats">
            <div className="resume-stat">
              <span className="stat-value">{savedProgress.masteredCount}</span>
              <span className="stat-label">of {studySet.questions.length} mastered</span>
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

  if (isComplete) {
    return (
      <div className="learn-complete">
        <h2>Great job!</h2>
        <p>You've mastered all {studySet.questions.length} terms</p>

        <div className="complete-actions">
          <button className="btn-secondary" onClick={restart}>
            Learn Again
          </button>
          <button className="btn-primary" onClick={onBack}>
            Done
          </button>
        </div>
      </div>
    );
  }

  const progressText = isReviewMode
    ? `Review: ${wrongIndices.length} remaining`
    : `${currentIndex + 1} / ${studySet.questions.length}`;

  return (
    <div className="learn-mode">
      <div className="mode-header">
        <button className="btn-back" onClick={onBack}>
          Exit
        </button>
        <span className="progress-text">{progressText}</span>
      </div>

      {!isReviewMode && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentIndex + 1) / studySet.questions.length) * 100}%` }}
          />
        </div>
      )}

      {isReviewMode && (
        <div className="review-banner">
          Let's review the ones you missed
        </div>
      )}

      <div className="question-card">
        <div className="question-content">
          <div className="question-text">{formatQuestionText(questionPart)}</div>
          {isMultipleAnswer && !showAnswer && (
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
          {choices.map((choice) => {
            let className = 'choice-option';
            const isSelected = selectedAnswers.includes(choice.letter);
            const isThisCorrect = correctAnswersList.includes(choice.letter);

            if (showAnswer) {
              if (isThisCorrect) {
                className += ' correct';
              } else if (isSelected) {
                className += ' incorrect';
              }
            } else if (isSelected) {
              className += ' selected';
            }

            return (
              <button
                key={choice.letter}
                className={className}
                onClick={() => toggleAnswer(choice.letter)}
                disabled={showAnswer}
              >
                <span className="choice-letter">{choice.letter}</span>
                <span className="choice-text">{choice.text}</span>
                {isMultipleAnswer && isSelected && !showAnswer && (
                  <span className="choice-check">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {isMultipleAnswer && !showAnswer && selectedAnswers.length > 0 && (
          <div className="submit-multi-answer">
            <button className="btn-check" onClick={submitMultipleAnswers}>
              Check Answer
            </button>
          </div>
        )}

        {showAnswer && (
          <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
            {isCorrect ? (
              <p>Correct!</p>
            ) : (
              <p>
                The correct answer{correctAnswersList.length > 1 ? 's are' : ' is'}: <strong>{correctAnswersList.join(', ')}</strong>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="nav-buttons">
        {showAnswer && (
          <button className="btn-next" onClick={nextQuestion}>
            {isCorrect ? 'Continue' : 'Got it'}
          </button>
        )}
      </div>

      <div className="stats-bar">
        <span>Mastered: {masteredCount}</span>
        {wrongIndices.length > 0 && !isReviewMode && (
          <span>To review: {wrongIndices.length}</span>
        )}
      </div>
    </div>
  );
}
