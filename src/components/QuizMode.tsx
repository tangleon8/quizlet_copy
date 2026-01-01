import React, { useState } from 'react';
import { StudySet } from '../types';

interface Props {
  studySet: StudySet;
  onBack: () => void;
}

export default function QuizMode({ studySet, onBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[][]>(
    new Array(studySet.questions.length).fill(null).map(() => [])
  );
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = studySet.questions[currentIndex];

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
    const updated = [...selectedAnswers];
    const currentSelections = [...updated[currentIndex]];

    if (isMultipleAnswer) {
      // Multiple answer mode - toggle selection
      const index = currentSelections.indexOf(letter);
      if (index === -1) {
        currentSelections.push(letter);
      } else {
        currentSelections.splice(index, 1);
      }
    } else {
      // Single answer mode - replace selection
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
    setShowResults(true);
  };

  const retake = () => {
    setCurrentIndex(0);
    setSelectedAnswers(new Array(studySet.questions.length).fill(null).map(() => []));
    setShowResults(false);
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

  const calculateScore = () => {
    let correct = 0;
    studySet.questions.forEach((q, i) => {
      if (checkAnswer(selectedAnswers[i], q.correctAnswer)) {
        correct++;
      }
    });
    return correct;
  };

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
