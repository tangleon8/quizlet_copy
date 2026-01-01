import React, { useState, useRef } from 'react';
import { StudySet } from '../types';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set worker source
GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

interface Props {
  onSave: (set: StudySet) => void;
  onCancel: () => void;
}

interface ParsedQuestion {
  questionText: string;
  correctAnswer: string;
}

type ImportMode = 'text' | 'pdf';

export default function BulkImport({ onSave, onCancel }: Props) {
  const [mode, setMode] = useState<ImportMode>('text');
  const [title, setTitle] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isParsed, setIsParsed] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFileName, setPdfFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseQuestions = (text: string): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];

    // Split by "Answer:" to find question blocks
    // Pattern: Question text with choices, followed by "Answer: X" or "Answer: A, C" for multiple

    // Regex to match each question block
    // Looks for text followed by choices (A. B. C. D.) and then Answer: X (supports multiple like A, C or AC)
    const questionPattern = /([^]*?(?:A[.)][^]*?B[.)][^]*?C[.)][^]*?D[.)][^]*?))Answer[s]?:\s*([A-E](?:\s*[,&and\s]+\s*[A-E])*)/gi;

    let match;
    while ((match = questionPattern.exec(text)) !== null) {
      const questionText = match[1].trim();
      // Extract all answer letters and normalize to comma-separated uppercase
      const answerRaw = match[2].toUpperCase();
      const answers = answerRaw.match(/[A-E]/g);
      const correctAnswer = answers ? answers.join(',') : answerRaw;

      if (questionText) {
        questions.push({
          questionText,
          correctAnswer
        });
      }
    }

    // Alternative parsing if the regex didn't work well
    if (questions.length === 0) {
      // Try splitting by "Answer:" and working backwards
      const parts = text.split(/Answer[s]?:\s*/i);

      for (let i = 0; i < parts.length - 1; i++) {
        let questionBlock = parts[i];
        const answerPart = parts[i + 1];

        // Get all answer letters (supports multiple like "A, C" or "AC" or "A and C")
        const answerMatch = answerPart.match(/^([A-E](?:\s*[,&and\s]+\s*[A-E])*)/i);
        if (!answerMatch) continue;

        const answerRaw = answerMatch[1].toUpperCase();
        const answers = answerRaw.match(/[A-E]/g);
        const correctAnswer = answers ? answers.join(',') : answerRaw;

        // If this isn't the first block, we need to extract just this question
        // The previous answer might be at the start of this block
        if (i > 0) {
          // Remove any leading answer letters from previous question
          questionBlock = questionBlock.replace(/^[A-E](?:\s*,\s*[A-E])*\s*/i, '').trim();
        }

        // Clean up the question text
        questionBlock = questionBlock.trim();

        if (questionBlock && questionBlock.length > 10) {
          questions.push({
            questionText: questionBlock,
            correctAnswer
          });
        }
      }
    }

    return questions;
  };

  const handleParseText = () => {
    if (!bulkText.trim()) {
      setError('Please paste your questions');
      return;
    }

    const questions = parseQuestions(bulkText);

    if (questions.length === 0) {
      setError('Could not parse any questions. Make sure your format includes questions with A, B, C, D choices followed by "Answer: X"');
      return;
    }

    setParsedQuestions(questions);
    setIsParsed(true);
    setError('');
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setIsLoading(true);
    setError('');
    setPdfFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;

      let fullText = '';

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      // Set the extracted text and auto-set title from filename
      setBulkText(fullText);
      if (!title) {
        setTitle(file.name.replace('.pdf', ''));
      }

      // Try to parse questions from the PDF text
      const questions = parseQuestions(fullText);

      if (questions.length > 0) {
        setParsedQuestions(questions);
        setIsParsed(true);
      } else {
        setError('Could not automatically find questions in the PDF. The text has been extracted - you can review and edit it below.');
        setMode('text');
      }
    } catch (err) {
      console.error('PDF parsing error:', err);
      setError('Failed to read PDF. Please try a different file or paste the text manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      setError('Please enter a title for your set');
      return;
    }

    if (parsedQuestions.length === 0) {
      setError('No questions to save');
      return;
    }

    const now = Date.now();
    const studySet: StudySet = {
      id: `set-${now}`,
      title: title.trim(),
      questions: parsedQuestions.map((q, index) => ({
        id: `q-${now}-${index}`,
        questionText: q.questionText,
        correctAnswer: q.correctAnswer,
      })),
      createdAt: now,
      updatedAt: now,
    };

    onSave(studySet);
  };

  const removeQuestion = (index: number) => {
    setParsedQuestions(parsedQuestions.filter((_, i) => i !== index));
  };

  const resetParse = () => {
    setIsParsed(false);
    setParsedQuestions([]);
    setPdfFileName('');
  };

  return (
    <div className="bulk-import">
      <div className="form-header">
        <button className="btn-back" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back
        </button>
        <h2>Import Questions</h2>
        {isParsed ? (
          <button className="btn-save" onClick={handleSave}>
            Save Set
          </button>
        ) : (
          <div></div>
        )}
      </div>

      <div className="bulk-content">
        {!isParsed ? (
          <>
            {/* Import Mode Tabs */}
            <div className="import-tabs">
              <button
                className={`import-tab ${mode === 'text' ? 'active' : ''}`}
                onClick={() => setMode('text')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Paste Text
              </button>
              <button
                className={`import-tab ${mode === 'pdf' ? 'active' : ''}`}
                onClick={() => setMode('pdf')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="M9 15v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/>
                  <rect x="9" y="15" width="6" height="4"/>
                </svg>
                Upload PDF
              </button>
            </div>

            {mode === 'pdf' ? (
              <div className="pdf-upload-section">
                <div
                  className={`pdf-dropzone ${isLoading ? 'loading' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    style={{ display: 'none' }}
                  />
                  {isLoading ? (
                    <>
                      <div className="pdf-spinner"></div>
                      <p>Scanning PDF for questions...</p>
                    </>
                  ) : pdfFileName ? (
                    <>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <polyline points="9 15 12 12 15 15"/>
                      </svg>
                      <p className="pdf-filename">{pdfFileName}</p>
                      <span>Click to upload a different file</span>
                    </>
                  ) : (
                    <>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <p>Click to upload a PDF</p>
                      <span>We'll scan it for questions and answers</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="bulk-instructions">
                  <h3>Paste your questions below</h3>
                  <p>Format: Questions with A, B, C, D choices followed by "Answer: X" (use "A, C" for multiple answers)</p>
                  <div className="format-example">
                    <strong>Example format:</strong>
                    <pre>{`What is 2 + 2?
A. 3
B. 4
C. 5
D. 6
Answer: B

Which are primary colors? (Select all that apply)
A. Red
B. Green
C. Blue
D. Yellow
Answer: A, C`}</pre>
                  </div>
                </div>

                <div className="form-row">
                  <label>Paste All Questions</label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="Paste your questions here..."
                    className="bulk-textarea"
                    rows={15}
                  />
                </div>
              </>
            )}

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

            {error && <div className="error-message">{error}</div>}

            {mode === 'text' && (
              <div className="form-footer">
                <button className="btn-save-large" onClick={handleParseText}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  Parse Questions
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="parse-success">
              <span className="success-icon">✓</span>
              <span>Found {parsedQuestions.length} questions</span>
              <button className="btn-reset" onClick={resetParse}>
                Re-import
              </button>
            </div>

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

            {error && <div className="error-message">{error}</div>}

            <div className="parsed-questions">
              <h3>Preview ({parsedQuestions.length} questions)</h3>
              {parsedQuestions.map((q, index) => (
                <div key={index} className="parsed-question-card">
                  <div className="parsed-header">
                    <span className="question-number">{index + 1}</span>
                    <button
                      className="btn-remove-small"
                      onClick={() => removeQuestion(index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="parsed-content">
                    <pre className="parsed-question-text">{q.questionText}</pre>
                    <div className="parsed-answer">
                      <strong>Answer:</strong> {q.correctAnswer}
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
          </>
        )}
      </div>
    </div>
  );
}
