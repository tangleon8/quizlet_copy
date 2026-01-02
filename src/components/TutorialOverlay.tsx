import React, { useState, useEffect } from 'react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string; // CSS selector to highlight (optional)
}

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'create',
    title: 'Create a Study Set',
    description: 'Start by creating your first study set. Add questions and answers to build your knowledge base.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    id: 'import',
    title: 'Import Questions',
    description: 'Already have study materials? Import questions from PDFs or paste them directly to save time.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
  },
  {
    id: 'study',
    title: 'Choose Your Study Mode',
    description: 'Study with flashcards, learn mode, quizzes, matching games, or fun mini-games. Pick what works best for you!',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    id: 'progress',
    title: 'Track Your Progress',
    description: 'See how well you know each topic. Questly remembers your progress so you can pick up right where you left off.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
];

export default function TutorialOverlay({ onComplete, onSkip }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setDirection('next');
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection('prev');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(onComplete, 200);
  };

  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onSkip, 200);
  };

  const step = tutorialSteps[currentStep];
  const isLastStep = currentStep === tutorialSteps.length - 1;

  return (
    <div className={`tutorial-overlay ${isVisible ? 'visible' : ''}`}>
      <div className={`tutorial-modal ${isVisible ? 'visible' : ''}`}>
        {/* Progress indicator */}
        <div className="tutorial-progress">
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => {
                setDirection(index > currentStep ? 'next' : 'prev');
                setCurrentStep(index);
              }}
            />
          ))}
        </div>

        {/* Skip button */}
        <button className="tutorial-skip" onClick={handleSkip}>
          Skip tutorial
        </button>

        {/* Step content */}
        <div className={`tutorial-content ${direction}`} key={step.id}>
          <div className="tutorial-icon-container">
            <div className="tutorial-icon-bg"></div>
            <div className="tutorial-icon">{step.icon}</div>
          </div>

          <div className="tutorial-step-number">
            Step {currentStep + 1} of {tutorialSteps.length}
          </div>

          <h2>{step.title}</h2>
          <p>{step.description}</p>
        </div>

        {/* Navigation */}
        <div className="tutorial-nav">
          <button
            className="tutorial-btn secondary"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </button>
          <button className="tutorial-btn primary" onClick={handleNext}>
            {isLastStep ? (
              <>
                Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </>
            ) : (
              <>
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="tutorial-hint">
          Use <kbd>←</kbd> <kbd>→</kbd> to navigate
        </div>
      </div>
    </div>
  );
}
