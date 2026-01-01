import React, { useState } from 'react';
import { StudySet } from '../types';

interface Props {
  studySet: StudySet;
  onBack: () => void;
}

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

  // Parse choices from question text (looks for A., B., C., D. patterns)
  const parseChoices = (text: string): { questionPart: string; choices: { letter: string; text: string }[] } => {
    const lines = text.split('\n');
    const choices: { letter: string; text: string }[] = [];
    let questionPart = '';
    let foundChoice = false;

    for (const line of lines) {
      const match = line.match(/^([A-E])[.)]\s*(.+)/);
      if (match) {
        foundChoice = true;
        choices.push({ letter: match[1], text: match[2].trim() });
      } else if (!foundChoice) {
        questionPart += line + '\n';
      } else {
        // Continue previous choice if it's a multi-line choice
        if (choices.length > 0) {
          choices[choices.length - 1].text += ' ' + line.trim();
        }
      }
    }

    return { questionPart: questionPart.trim(), choices };
  };

  const { questionPart, choices } = parseChoices(currentQuestion.questionText);
  const isMultipleAnswer = hasMultipleAnswers(currentQuestion.correctAnswer);
  const correctAnswersList = getCorrectAnswers(currentQuestion.correctAnswer);

  const toggleAnswer = (letter: string) => {
    if (showAnswer) return;

    if (isMultipleAnswer) {
      // Multiple answer mode - toggle selection
      setSelectedAnswers(prev => {
        const index = prev.indexOf(letter);
        if (index === -1) {
          return [...prev, letter];
        } else {
          return prev.filter(l => l !== letter);
        }
      });
    } else {
      // Single answer mode - replace and check immediately
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
    } else if (!isReviewMode) {
      const qIndex = currentIndex;
      if (!wrongIndices.includes(qIndex)) {
        setWrongIndices([...wrongIndices, qIndex]);
      }
    }
  };

  const submitMultipleAnswers = () => {
    if (selectedAnswers.length === 0) return;
    checkAndShowAnswer(selectedAnswers);
  };

  const checkAnswer = (selected: string[], correct: string): boolean => {
    if (selected.length === 0) return false;
    const correctArr = getCorrectAnswers(correct);

    // Check if all correct answers are selected and no extras
    if (selected.length !== correctArr.length) return false;

    const selectedSorted = [...selected].sort();
    const correctSorted = [...correctArr].sort();

    return selectedSorted.every((s, i) => s === correctSorted[i]);
  };

  const nextQuestion = () => {
    setSelectedAnswers([]);
    setShowAnswer(false);
    setIsCorrect(null);

    if (isReviewMode) {
      if (isCorrect) {
        const newWrongIndices = wrongIndices.filter((_, i) => i !== reviewIndex);
        setWrongIndices(newWrongIndices);

        if (newWrongIndices.length === 0) {
          setIsComplete(true);
        } else if (reviewIndex >= newWrongIndices.length) {
          setReviewIndex(0);
        }
      } else {
        if (reviewIndex < wrongIndices.length - 1) {
          setReviewIndex(reviewIndex + 1);
        } else {
          setReviewIndex(0);
        }
      }
    } else {
      if (currentIndex < studySet.questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        if (wrongIndices.length > 0) {
          setIsReviewMode(true);
          setReviewIndex(0);
        } else {
          setIsComplete(true);
        }
      }
    }
  };

  const restart = () => {
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
          <div className="question-text">{questionPart}</div>
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
