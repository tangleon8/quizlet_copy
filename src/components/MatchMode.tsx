import React, { useState, useEffect, useCallback } from 'react';
import { StudySet } from '../types';

interface Props {
  studySet: StudySet;
  onBack: () => void;
}

interface MatchCard {
  id: string;
  content: string;
  type: 'question' | 'answer';
  pairId: number;
}

export default function MatchMode({ studySet, onBack }: Props) {
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [timer, setTimer] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Parse to get just the question part (without choices)
  // Works with both line-separated and inline formats (for PDF imports)
  const parseQuestion = (text: string): string => {
    // Find the first choice pattern to know where the question ends
    const choiceMatch = text.match(/[A-E][.)]\s/);

    let questionPart = text;
    if (choiceMatch && choiceMatch.index) {
      questionPart = text.substring(0, choiceMatch.index);
    }

    // Clean up whitespace
    questionPart = questionPart.replace(/\s+/g, ' ').trim();

    // Truncate for display
    return questionPart.substring(0, 80) + (questionPart.length > 80 ? '...' : '');
  };

  const initializeGame = useCallback(() => {
    // Take up to 6 questions for the match game (12 cards total)
    const gameQuestions = studySet.questions.slice(0, 6);

    const matchCards: MatchCard[] = [];

    gameQuestions.forEach((q, index) => {
      matchCards.push({
        id: `q-${index}`,
        content: parseQuestion(q.questionText),
        type: 'question',
        pairId: index,
      });
      matchCards.push({
        id: `a-${index}`,
        content: q.correctAnswer,
        type: 'answer',
        pairId: index,
      });
    });

    // Shuffle cards
    for (let i = matchCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matchCards[i], matchCards[j]] = [matchCards[j], matchCards[i]];
    }

    setCards(matchCards);
    setSelected(null);
    setMatched(new Set());
    setWrong(new Set());
    setTimer(0);
    setIsComplete(false);
    setIsStarted(true);
  }, [studySet.questions]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStarted && !isComplete) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isStarted, isComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCardClick = (cardId: string) => {
    if (matched.has(cardId) || wrong.has(cardId)) return;

    const clickedCard = cards.find((c) => c.id === cardId);
    if (!clickedCard) return;

    if (!selected) {
      setSelected(cardId);
    } else if (selected === cardId) {
      setSelected(null);
    } else {
      const selectedCard = cards.find((c) => c.id === selected);
      if (!selectedCard) return;

      // Check if match (same pairId but different type)
      if (
        selectedCard.pairId === clickedCard.pairId &&
        selectedCard.type !== clickedCard.type
      ) {
        // Correct match
        const newMatched = new Set(matched);
        newMatched.add(selected);
        newMatched.add(cardId);
        setMatched(newMatched);
        setSelected(null);

        // Check if game complete
        if (newMatched.size === cards.length) {
          setIsComplete(true);
        }
      } else {
        // Wrong match
        setWrong(new Set([selected, cardId]));
        setTimeout(() => {
          setWrong(new Set());
          setSelected(null);
        }, 500);
      }
    }
  };

  if (isComplete) {
    return (
      <div className="match-mode">
        <div className="mode-header">
          <button className="btn-back" onClick={onBack}>
            Back
          </button>
          <span className="progress-text">Match Complete!</span>
        </div>

        <div className="match-complete">
          <h2>Great job!</h2>
          <div className="final-time">{formatTime(timer)}</div>
          <p>You matched all {cards.length / 2} pairs</p>

          <div className="complete-actions">
            <button className="btn-secondary" onClick={initializeGame}>
              Play Again
            </button>
            <button className="btn-primary" onClick={onBack}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="match-mode">
      <div className="mode-header">
        <button className="btn-back" onClick={onBack}>
          Exit
        </button>
        <span className="progress-text">Match Game</span>
      </div>

      <div className="match-container">
        <div className="match-header">
          <div className="match-timer">{formatTime(timer)}</div>
          <div className="match-score">
            {matched.size / 2} / {cards.length / 2} matched
          </div>
        </div>

        <div className="match-grid">
          {cards.map((card) => (
            <button
              key={card.id}
              className={`match-card ${selected === card.id ? 'selected' : ''} ${
                matched.has(card.id) ? 'matched' : ''
              } ${wrong.has(card.id) ? 'wrong' : ''}`}
              onClick={() => handleCardClick(card.id)}
              disabled={matched.has(card.id)}
            >
              {card.content}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
