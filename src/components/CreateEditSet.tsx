import React, { useState, useEffect } from 'react';
import { StudySet } from '../types';

interface Props {
  existingSet?: StudySet | null;
  onSave: (set: StudySet) => void;
  onCancel: () => void;
}

interface QuestionDraft {
  id: string;
  questionText: string;
  correctAnswer: string;
}

export default function CreateEditSet({ existingSet, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(existingSet?.title || '');
  const [questionCount, setQuestionCount] = useState(
    existingSet?.questions.length || 5
  );
  const [customCount, setCustomCount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  useEffect(() => {
    if (existingSet) {
      setQuestions(
        existingSet.questions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          correctAnswer: q.correctAnswer,
        }))
      );
      setQuestionCount(existingSet.questions.length);
      // Check if existing count is beyond preset options
      if (existingSet.questions.length > 50) {
        setIsCustom(true);
        setCustomCount(existingSet.questions.length.toString());
      }
    } else {
      // Initialize with default count for new sets
      const defaultCount = 5;
      const newQuestions: QuestionDraft[] = [];
      for (let i = 0; i < defaultCount; i++) {
        newQuestions.push({
          id: `q-${Date.now()}-${i}`,
          questionText: '',
          correctAnswer: '',
        });
      }
      setQuestions(newQuestions);
    }
  }, [existingSet]);

  const handleCountChange = (newCount: number) => {
    if (newCount < 1) newCount = 1;
    if (newCount > 200) newCount = 200;

    setQuestionCount(newCount);

    if (newCount > questions.length) {
      const additional: QuestionDraft[] = [];
      for (let i = questions.length; i < newCount; i++) {
        additional.push({
          id: `q-${Date.now()}-${i}`,
          questionText: '',
          correctAnswer: '',
        });
      }
      setQuestions([...questions, ...additional]);
    } else if (newCount < questions.length) {
      setQuestions(questions.slice(0, newCount));
    }
  };

  const handleSelectChange = (value: string) => {
    if (value === 'custom') {
      setIsCustom(true);
      setCustomCount(questionCount.toString());
    } else {
      setIsCustom(false);
      handleCountChange(Number(value));
    }
  };

  const handleCustomCountChange = (value: string) => {
    setCustomCount(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1) {
      handleCountChange(num);
    }
  };

  const updateQuestion = (index: number, field: 'questionText' | 'correctAnswer', value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a title for your set');
      return;
    }

    const filledQuestions = questions.filter(
      (q) => q.questionText.trim() && q.correctAnswer.trim()
    );

    if (filledQuestions.length === 0) {
      alert('Please add at least one question with an answer');
      return;
    }

    const now = Date.now();
    const studySet: StudySet = {
      id: existingSet?.id || `set-${now}`,
      title: title.trim(),
      questions: filledQuestions.map((q) => ({
        id: q.id,
        questionText: q.questionText.trim(),
        correctAnswer: q.correctAnswer.trim(),
      })),
      createdAt: existingSet?.createdAt || now,
      updatedAt: now,
    };

    onSave(studySet);
  };

  const presetCounts = [5, 10, 15, 20, 25, 30, 40, 50];

  return (
    <div className="create-edit-set">
      <div className="form-header">
        <button className="btn-back" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back
        </button>
        <h2>{existingSet ? 'Edit Study Set' : 'Create Study Set'}</h2>
        <div></div>
      </div>

      <div className="set-form">
        <div className="form-row">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for your set"
            className="title-input"
          />
        </div>

        <div className="form-row">
          <label>Number of Questions</label>
          <div className="count-selector">
            <select
              value={isCustom ? 'custom' : questionCount}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="count-select"
            >
              {presetCounts.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
              <option value="custom">Custom</option>
            </select>
            {isCustom && (
              <input
                type="number"
                value={customCount}
                onChange={(e) => handleCustomCountChange(e.target.value)}
                placeholder="Enter number"
                className="custom-count-input"
                min="1"
                max="200"
              />
            )}
          </div>
        </div>

        <div className="questions-form">
          {questions.map((q, index) => (
            <div key={q.id} className="question-row">
              <div className="question-number">{index + 1}</div>
              <div className="question-inputs">
                <div className="input-group">
                  <label>Question & Choices</label>
                  <textarea
                    value={q.questionText}
                    onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                    placeholder="Paste your question with all answer choices here..."
                    rows={4}
                  />
                </div>
                <div className="input-group answer-group">
                  <label>Correct Answer(s)</label>
                  <input
                    type="text"
                    value={q.correctAnswer}
                    onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                    placeholder="e.g., A or A,C for multiple"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-footer">
          <button className="btn-save-large" onClick={handleSave}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save Study Set
          </button>
        </div>
      </div>
    </div>
  );
}
