import React, { useState } from 'react';
import { StudySet } from '../types';

interface Props {
  studySet: StudySet;
  onBack: () => void;
}

export default function FlashcardMode({ studySet, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentQuestion = studySet.questions[currentIndex];

  // Parse to get just the question part (without choices)
  const parseQuestion = (text: string): string => {
    const lines = text.split('\n');
    let questionPart = '';

    for (const line of lines) {
      const match = line.match(/^[A-E][.)]\s*.+/);
      if (match) break;
      questionPart += line + '\n';
    }

    return questionPart.trim();
  };

  const questionText = parseQuestion(currentQuestion.questionText);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = () => {
    if (currentIndex < studySet.questions.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 150);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex - 1), 150);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      handleFlip();
    } else if (e.key === 'ArrowRight') {
      nextCard();
    } else if (e.key === 'ArrowLeft') {
      prevCard();
    }
  };

  return (
    <div className="flashcard-mode" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="mode-header">
        <button className="btn-back" onClick={onBack}>
          Exit
        </button>
        <span className="progress-text">Flashcards</span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${((currentIndex + 1) / studySet.questions.length) * 100}%` }}
        />
      </div>

      <div className="flashcard-container">
        <div
          className={`flashcard ${isFlipped ? 'flipped' : ''}`}
          onClick={handleFlip}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <span className="flashcard-label">Question</span>
              <div className="flashcard-content">{questionText}</div>
              <span className="flashcard-hint">Click to reveal answer</span>
            </div>
            <div className="flashcard-back">
              <span className="flashcard-label">Answer</span>
              <div className="flashcard-content">{currentQuestion.correctAnswer}</div>
              <span className="flashcard-hint">Click to see question</span>
            </div>
          </div>
        </div>

        <div className="flashcard-nav">
          <button onClick={prevCard} disabled={currentIndex === 0}>
            ←
          </button>
          <span className="flashcard-counter">
            {currentIndex + 1} / {studySet.questions.length}
          </span>
          <button onClick={nextCard} disabled={currentIndex === studySet.questions.length - 1}>
            →
          </button>
        </div>
      </div>
    </div>
  );
}
