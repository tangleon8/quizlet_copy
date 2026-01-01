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

  // Parse choices from question text (looks for A., B., C., D. patterns)
  // Works with both line-separated and inline formats (for PDF imports)
  const parseChoices = (text: string): { questionPart: string; choices: { letter: string; text: string }[] } => {
    const choices: { letter: string; text: string }[] = [];

    // Try to find choices using regex that matches A. B. C. D. E. or A) B) C) D) E) patterns
    const choiceRegex = /([A-J])[.)]\s*([\s\S]*?)(?=(?:[A-J][.)]\s)|$)/gi;

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

  // Get the correct answer text(s)
  const getAnswerDisplay = () => {
    const correctLetters = currentQuestion.correctAnswer.split(',').map(a => a.trim().toUpperCase());

    if (choices.length > 0) {
      const correctChoices = choices.filter(c => correctLetters.includes(c.letter));
      if (correctChoices.length > 0) {
        return correctChoices.map(c => `${c.letter}. ${c.text}`).join('\n\n');
      }
    }

    return currentQuestion.correctAnswer;
  };

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
              <div className="flashcard-content">
                <div className="flashcard-question">{questionPart}</div>
                {choices.length > 0 && (
                  <div className="flashcard-choices">
                    {choices.map(c => (
                      <div key={c.letter} className="flashcard-choice">
                        <span className="flashcard-choice-letter">{c.letter}.</span>
                        <span>{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="flashcard-hint">Click to reveal answer</span>
            </div>
            <div className="flashcard-back">
              <span className="flashcard-label">Answer</span>
              <div className="flashcard-content flashcard-answer">{getAnswerDisplay()}</div>
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
