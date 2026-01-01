import React, { useState } from 'react';
import { StudySet } from '../types';

interface Props {
  studySet: StudySet;
  onBack: () => void;
}

export default function SetView({ studySet, onBack }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnswers, setShowAnswers] = useState(true);

  // Parse choices from question text
  const parseChoices = (text: string): { questionPart: string; choices: { letter: string; text: string }[] } => {
    const choices: { letter: string; text: string }[] = [];
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

  // Get display text for answer
  const getAnswerDisplay = (q: { questionText: string; correctAnswer: string }) => {
    const { choices } = parseChoices(q.questionText);
    const correctLetters = q.correctAnswer.split(',').map(a => a.trim().toUpperCase());

    if (choices.length > 0) {
      const correctChoices = choices.filter(c => correctLetters.includes(c.letter));
      if (correctChoices.length > 0) {
        return correctChoices.map(c => `${c.letter}. ${c.text}`).join(' | ');
      }
    }
    return q.correctAnswer;
  };

  // Filter questions by search term
  const filteredQuestions = studySet.questions.filter(q => {
    const { questionPart } = parseChoices(q.questionText);
    const searchLower = searchTerm.toLowerCase();
    return (
      questionPart.toLowerCase().includes(searchLower) ||
      q.correctAnswer.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="set-view">
      <div className="mode-header">
        <button className="btn-back" onClick={onBack}>
          Back
        </button>
        <span className="progress-text">{studySet.title}</span>
      </div>

      <div className="set-view-controls">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className={`btn-toggle ${showAnswers ? 'active' : ''}`}
          onClick={() => setShowAnswers(!showAnswers)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {showAnswers ? (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </>
            ) : (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </>
            )}
          </svg>
          {showAnswers ? 'Hide Answers' : 'Show Answers'}
        </button>
      </div>

      <div className="set-view-stats">
        <div className="stat">
          <span className="stat-value">{studySet.questions.length}</span>
          <span className="stat-label">Questions</span>
        </div>
        <div className="stat">
          <span className="stat-value">{filteredQuestions.length}</span>
          <span className="stat-label">Showing</span>
        </div>
      </div>

      <div className="questions-list">
        {filteredQuestions.map((q, index) => {
          const { questionPart, choices } = parseChoices(q.questionText);
          const originalIndex = studySet.questions.findIndex(sq => sq.id === q.id);

          return (
            <div key={q.id} className="question-item">
              <div className="question-number">{originalIndex + 1}</div>
              <div className="question-content">
                <div className="question-text">{questionPart}</div>
                {choices.length > 0 && (
                  <div className="question-choices">
                    {choices.map(c => (
                      <div
                        key={c.letter}
                        className={`choice ${
                          showAnswers && q.correctAnswer.toUpperCase().includes(c.letter)
                            ? 'correct'
                            : ''
                        }`}
                      >
                        <span className="choice-letter">{c.letter}.</span>
                        <span>{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                {showAnswers && (
                  <div className="question-answer">
                    <span className="answer-label">Answer:</span>
                    <span className="answer-value">{getAnswerDisplay(q)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
