import React, { useState, useEffect, useCallback } from 'react';
import { StudySet, Question } from '../types';

interface Props {
  studySet: StudySet;
  onBack: () => void;
}

type GameType = 'menu' | 'speed' | 'truefalse' | 'gravity';

interface SpeedRoundState {
  questions: Question[];
  currentIndex: number;
  score: number;
  timeLeft: number;
  isRunning: boolean;
  isComplete: boolean;
  showResult: 'correct' | 'wrong' | null;
  selectedAnswer: string | null;
}

interface TrueFalseState {
  questions: { question: Question; shownAnswer: string; isCorrect: boolean }[];
  currentIndex: number;
  score: number;
  streak: number;
  bestStreak: number;
  isComplete: boolean;
  showResult: 'correct' | 'wrong' | null;
}

interface GravityState {
  fallingWords: { id: string; word: string; correctAnswer: string; y: number; speed: number }[];
  score: number;
  lives: number;
  isRunning: boolean;
  isComplete: boolean;
  input: string;
  level: number;
}

export default function GamesMode({ studySet, onBack }: Props) {
  const [gameType, setGameType] = useState<GameType>('menu');

  // Speed Round state
  const [speedState, setSpeedState] = useState<SpeedRoundState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    timeLeft: 60,
    isRunning: false,
    isComplete: false,
    showResult: null,
    selectedAnswer: null,
  });

  // True/False state
  const [tfState, setTfState] = useState<TrueFalseState>({
    questions: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    isComplete: false,
    showResult: null,
  });

  // Gravity state
  const [gravityState, setGravityState] = useState<GravityState>({
    fallingWords: [],
    score: 0,
    lives: 3,
    isRunning: false,
    isComplete: false,
    input: '',
    level: 1,
  });

  // Parse question to get just the question part
  const parseQuestion = (text: string): string => {
    const choiceMatch = text.match(/[A-J][.)]\s/);
    let questionPart = text;
    if (choiceMatch && choiceMatch.index) {
      questionPart = text.substring(0, choiceMatch.index);
    }
    return questionPart.replace(/\s+/g, ' ').trim();
  };

  // Parse choices from question
  const parseChoices = (text: string): { letter: string; text: string }[] => {
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
    return matches;
  };

  // Shuffle array
  const shuffle = <T,>(arr: T[]): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize Speed Round
  const startSpeedRound = () => {
    const shuffled = shuffle(studySet.questions);
    setSpeedState({
      questions: shuffled,
      currentIndex: 0,
      score: 0,
      timeLeft: 60,
      isRunning: true,
      isComplete: false,
      showResult: null,
      selectedAnswer: null,
    });
    setGameType('speed');
  };

  // Speed Round timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (speedState.isRunning && speedState.timeLeft > 0) {
      interval = setInterval(() => {
        setSpeedState(prev => {
          if (prev.timeLeft <= 1) {
            return { ...prev, timeLeft: 0, isRunning: false, isComplete: true };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [speedState.isRunning, speedState.timeLeft]);

  // Handle Speed Round answer
  const handleSpeedAnswer = (answer: string) => {
    if (speedState.showResult || !speedState.isRunning) return;

    const currentQ = speedState.questions[speedState.currentIndex];
    const correctAnswers = currentQ.correctAnswer.split(',').map(a => a.trim().toUpperCase());
    const isCorrect = correctAnswers.includes(answer.toUpperCase());

    setSpeedState(prev => ({
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      showResult: isCorrect ? 'correct' : 'wrong',
      selectedAnswer: answer,
    }));

    setTimeout(() => {
      setSpeedState(prev => {
        if (prev.currentIndex >= prev.questions.length - 1) {
          return { ...prev, isRunning: false, isComplete: true, showResult: null, selectedAnswer: null };
        }
        return { ...prev, currentIndex: prev.currentIndex + 1, showResult: null, selectedAnswer: null };
      });
    }, 500);
  };

  // Initialize True/False
  const startTrueFalse = () => {
    const tfQuestions = studySet.questions.map(q => {
      const choices = parseChoices(q.questionText);
      const correctLetters = q.correctAnswer.split(',').map(a => a.trim().toUpperCase());

      // 50% chance to show correct answer, 50% to show wrong
      const showCorrect = Math.random() > 0.5;

      let shownAnswer: string;
      if (choices.length > 0) {
        if (showCorrect) {
          const correctChoice = choices.find(c => correctLetters.includes(c.letter));
          shownAnswer = correctChoice ? `${correctChoice.letter}. ${correctChoice.text}` : q.correctAnswer;
        } else {
          const wrongChoices = choices.filter(c => !correctLetters.includes(c.letter));
          if (wrongChoices.length > 0) {
            const wrongChoice = wrongChoices[Math.floor(Math.random() * wrongChoices.length)];
            shownAnswer = `${wrongChoice.letter}. ${wrongChoice.text}`;
          } else {
            shownAnswer = q.correctAnswer;
          }
        }
      } else {
        shownAnswer = q.correctAnswer;
      }

      return { question: q, shownAnswer, isCorrect: showCorrect };
    });

    setTfState({
      questions: shuffle(tfQuestions),
      currentIndex: 0,
      score: 0,
      streak: 0,
      bestStreak: 0,
      isComplete: false,
      showResult: null,
    });
    setGameType('truefalse');
  };

  // Handle True/False answer
  const handleTrueFalseAnswer = (answeredTrue: boolean) => {
    if (tfState.showResult) return;

    const current = tfState.questions[tfState.currentIndex];
    const isCorrect = answeredTrue === current.isCorrect;

    setTfState(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0;
      return {
        ...prev,
        score: isCorrect ? prev.score + 1 : prev.score,
        streak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        showResult: isCorrect ? 'correct' : 'wrong',
      };
    });

    setTimeout(() => {
      setTfState(prev => {
        if (prev.currentIndex >= prev.questions.length - 1) {
          return { ...prev, isComplete: true, showResult: null };
        }
        return { ...prev, currentIndex: prev.currentIndex + 1, showResult: null };
      });
    }, 800);
  };

  // Initialize Gravity
  const startGravity = useCallback(() => {
    setGravityState({
      fallingWords: [],
      score: 0,
      lives: 3,
      isRunning: true,
      isComplete: false,
      input: '',
      level: 1,
    });
    setGameType('gravity');
  }, []);

  // Gravity game loop
  useEffect(() => {
    if (!gravityState.isRunning || gameType !== 'gravity') return;

    // Spawn new words
    const spawnInterval = setInterval(() => {
      if (gravityState.fallingWords.length < 3 + gravityState.level) {
        const availableQuestions = studySet.questions.filter(
          q => !gravityState.fallingWords.find(w => w.id === q.id)
        );
        if (availableQuestions.length > 0) {
          const randomQ = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
          setGravityState(prev => ({
            ...prev,
            fallingWords: [
              ...prev.fallingWords,
              {
                id: randomQ.id + '-' + Date.now(),
                word: parseQuestion(randomQ.questionText).substring(0, 50) + '...',
                correctAnswer: randomQ.correctAnswer.toUpperCase(),
                y: 0,
                speed: 0.5 + prev.level * 0.2,
              },
            ],
          }));
        }
      }
    }, 2000);

    // Move words down
    const moveInterval = setInterval(() => {
      setGravityState(prev => {
        const newWords = prev.fallingWords.map(w => ({ ...w, y: w.y + w.speed }));
        const escaped = newWords.filter(w => w.y >= 100);
        const remaining = newWords.filter(w => w.y < 100);

        if (escaped.length > 0) {
          const newLives = prev.lives - escaped.length;
          if (newLives <= 0) {
            return { ...prev, fallingWords: [], lives: 0, isRunning: false, isComplete: true };
          }
          return { ...prev, fallingWords: remaining, lives: newLives };
        }
        return { ...prev, fallingWords: remaining };
      });
    }, 100);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(moveInterval);
    };
  }, [gravityState.isRunning, gravityState.level, gravityState.fallingWords.length, studySet.questions, gameType]);

  // Handle Gravity input
  const handleGravityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setGravityState(prev => ({ ...prev, input: value }));

    // Check if answer matches any falling word
    const matched = gravityState.fallingWords.find(w => w.correctAnswer === value);
    if (matched) {
      setGravityState(prev => {
        const newScore = prev.score + 1;
        const newLevel = Math.floor(newScore / 5) + 1;
        return {
          ...prev,
          fallingWords: prev.fallingWords.filter(w => w.id !== matched.id),
          score: newScore,
          level: newLevel,
          input: '',
        };
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render game menu
  if (gameType === 'menu') {
    return (
      <div className="games-mode">
        <div className="mode-header">
          <button className="btn-back" onClick={onBack}>
            Back
          </button>
          <span className="progress-text">Games</span>
        </div>

        <div className="games-menu">
          <h2>Choose a Game</h2>

          <div className="games-grid">
            <button className="game-card" onClick={startSpeedRound}>
              <div className="game-icon speed">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3>Speed Round</h3>
              <p>Answer as many questions as you can in 60 seconds!</p>
            </button>

            <button className="game-card" onClick={startTrueFalse}>
              <div className="game-icon truefalse">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3>True or False</h3>
              <p>Is this the correct answer? Build your streak!</p>
            </button>

            <button className="game-card" onClick={startGravity}>
              <div className="game-icon gravity">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="2" x2="12" y2="22"/>
                  <polyline points="19 15 12 22 5 15"/>
                </svg>
              </div>
              <h3>Gravity</h3>
              <p>Type the answer before questions fall! Don't let them escape!</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Speed Round
  if (gameType === 'speed') {
    if (speedState.isComplete) {
      return (
        <div className="games-mode">
          <div className="mode-header">
            <button className="btn-back" onClick={() => setGameType('menu')}>
              Back
            </button>
            <span className="progress-text">Speed Round Complete!</span>
          </div>

          <div className="game-complete">
            <h2>Time's Up!</h2>
            <div className="final-score">{speedState.score}</div>
            <p>questions answered correctly</p>
            <div className="complete-actions">
              <button className="btn-secondary" onClick={startSpeedRound}>
                Play Again
              </button>
              <button className="btn-primary" onClick={() => setGameType('menu')}>
                Back to Games
              </button>
            </div>
          </div>
        </div>
      );
    }

    const currentQ = speedState.questions[speedState.currentIndex];
    const questionPart = parseQuestion(currentQ.questionText);
    const choices = parseChoices(currentQ.questionText);

    return (
      <div className="games-mode">
        <div className="mode-header">
          <button className="btn-back" onClick={() => setGameType('menu')}>
            Exit
          </button>
          <span className="progress-text">Speed Round</span>
        </div>

        <div className="speed-round">
          <div className="speed-header">
            <div className={`speed-timer ${speedState.timeLeft <= 10 ? 'urgent' : ''}`}>
              {formatTime(speedState.timeLeft)}
            </div>
            <div className="speed-score">Score: {speedState.score}</div>
          </div>

          <div className={`speed-question ${speedState.showResult || ''}`}>
            <div className="question-text">{questionPart}</div>
          </div>

          <div className="speed-choices">
            {choices.map(c => (
              <button
                key={c.letter}
                className={`speed-choice ${
                  speedState.selectedAnswer === c.letter
                    ? speedState.showResult || ''
                    : ''
                }`}
                onClick={() => handleSpeedAnswer(c.letter)}
                disabled={!!speedState.showResult}
              >
                <span className="choice-letter">{c.letter}</span>
                <span className="choice-text">{c.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render True/False
  if (gameType === 'truefalse') {
    if (tfState.isComplete) {
      const percentage = Math.round((tfState.score / tfState.questions.length) * 100);

      return (
        <div className="games-mode">
          <div className="mode-header">
            <button className="btn-back" onClick={() => setGameType('menu')}>
              Back
            </button>
            <span className="progress-text">True or False Complete!</span>
          </div>

          <div className="game-complete">
            <h2>Game Over!</h2>
            <div className="final-score">{percentage}%</div>
            <p>{tfState.score} of {tfState.questions.length} correct</p>
            <div className="streak-display">
              <span>Best Streak: {tfState.bestStreak}</span>
            </div>
            <div className="complete-actions">
              <button className="btn-secondary" onClick={startTrueFalse}>
                Play Again
              </button>
              <button className="btn-primary" onClick={() => setGameType('menu')}>
                Back to Games
              </button>
            </div>
          </div>
        </div>
      );
    }

    const current = tfState.questions[tfState.currentIndex];
    const questionPart = parseQuestion(current.question.questionText);

    return (
      <div className="games-mode">
        <div className="mode-header">
          <button className="btn-back" onClick={() => setGameType('menu')}>
            Exit
          </button>
          <span className="progress-text">
            {tfState.currentIndex + 1} / {tfState.questions.length}
          </span>
        </div>

        <div className="truefalse-game">
          <div className="tf-header">
            <div className="tf-score">Score: {tfState.score}</div>
            <div className="tf-streak">
              Streak: {tfState.streak} {tfState.streak >= 3 && '🔥'}
            </div>
          </div>

          <div className={`tf-card ${tfState.showResult || ''}`}>
            <div className="tf-question">{questionPart}</div>
            <div className="tf-divider">
              <span>Is this correct?</span>
            </div>
            <div className="tf-answer">{current.shownAnswer}</div>
          </div>

          <div className="tf-buttons">
            <button
              className="tf-btn false"
              onClick={() => handleTrueFalseAnswer(false)}
              disabled={!!tfState.showResult}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              False
            </button>
            <button
              className="tf-btn true"
              onClick={() => handleTrueFalseAnswer(true)}
              disabled={!!tfState.showResult}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              True
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Gravity
  if (gameType === 'gravity') {
    if (gravityState.isComplete) {
      return (
        <div className="games-mode">
          <div className="mode-header">
            <button className="btn-back" onClick={() => setGameType('menu')}>
              Back
            </button>
            <span className="progress-text">Gravity Complete!</span>
          </div>

          <div className="game-complete">
            <h2>Game Over!</h2>
            <div className="final-score">{gravityState.score}</div>
            <p>questions answered</p>
            <div className="streak-display">
              <span>Reached Level {gravityState.level}</span>
            </div>
            <div className="complete-actions">
              <button className="btn-secondary" onClick={startGravity}>
                Play Again
              </button>
              <button className="btn-primary" onClick={() => setGameType('menu')}>
                Back to Games
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="games-mode">
        <div className="mode-header">
          <button className="btn-back" onClick={() => setGameType('menu')}>
            Exit
          </button>
          <span className="progress-text">Gravity - Level {gravityState.level}</span>
        </div>

        <div className="gravity-game">
          <div className="gravity-header">
            <div className="gravity-score">Score: {gravityState.score}</div>
            <div className="gravity-lives">
              {'❤️'.repeat(gravityState.lives)}{'🖤'.repeat(3 - gravityState.lives)}
            </div>
          </div>

          <div className="gravity-field">
            {gravityState.fallingWords.map(word => (
              <div
                key={word.id}
                className="falling-word"
                style={{ top: `${word.y}%` }}
              >
                <div className="word-text">{word.word}</div>
                <div className="word-hint">Answer: {word.correctAnswer}</div>
              </div>
            ))}
            <div className="gravity-ground" />
          </div>

          <div className="gravity-input">
            <input
              type="text"
              value={gravityState.input}
              onChange={handleGravityInput}
              placeholder="Type the answer letter (e.g., A, B, C)..."
              autoFocus
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
