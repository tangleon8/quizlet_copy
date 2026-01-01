import React, { useState, useEffect } from 'react';
import { StudySet } from '../types';

interface Props {
  studySet: StudySet;
  mode: 'flashcards' | 'learn' | 'quiz' | 'match' | 'games';
  onStart: (subset: StudySet) => void;
  onCancel: () => void;
}

interface Settings {
  defaultQuestionsPerSession: number;
  rememberLastRange: boolean;
}

const SETTINGS_KEY = 'study_settings';
const LAST_RANGE_KEY_PREFIX = 'last_range_';

export default function StudyConfig({ studySet, mode, onStart, onCancel }: Props) {
  const totalQuestions = studySet.questions.length;

  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(Math.min(20, totalQuestions));
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Load settings and last range
  useEffect(() => {
    const settingsStr = localStorage.getItem(SETTINGS_KEY);
    if (settingsStr) {
      try {
        const settings: Settings = JSON.parse(settingsStr);
        if (settings.rememberLastRange) {
          const lastRangeStr = localStorage.getItem(`${LAST_RANGE_KEY_PREFIX}${studySet.id}`);
          if (lastRangeStr) {
            const lastRange = JSON.parse(lastRangeStr);
            setRangeStart(lastRange.start);
            setRangeEnd(Math.min(lastRange.end, totalQuestions));
            return;
          }
        }
        // Use default from settings
        setRangeEnd(Math.min(settings.defaultQuestionsPerSession, totalQuestions));
      } catch (e) {
        // Use defaults
      }
    }
  }, [studySet.id, totalQuestions]);

  // Generate preset options based on set size
  const generatePresets = () => {
    const presets: { label: string; start: number; end: number }[] = [];

    // All questions
    presets.push({ label: `All (${totalQuestions})`, start: 1, end: totalQuestions });

    // Common chunk sizes
    const chunkSizes = [10, 20, 25, 50];

    for (const size of chunkSizes) {
      if (totalQuestions > size) {
        let current = 1;
        let chunkNum = 1;
        while (current <= totalQuestions) {
          const end = Math.min(current + size - 1, totalQuestions);
          if (end - current + 1 >= size / 2) { // Only show if at least half the size
            presets.push({
              label: `${current}-${end} (${end - current + 1})`,
              start: current,
              end: end
            });
          }
          current += size;
          chunkNum++;
          if (chunkNum > 10) break; // Limit number of presets
        }
        break; // Only show one chunk size
      }
    }

    return presets;
  };

  const presets = generatePresets();

  const handlePresetClick = (preset: { start: number; end: number }, label: string) => {
    setRangeStart(preset.start);
    setRangeEnd(preset.end);
    setSelectedPreset(label);
  };

  const handleStartChange = (value: number) => {
    const newStart = Math.max(1, Math.min(value, totalQuestions));
    setRangeStart(newStart);
    if (newStart > rangeEnd) {
      setRangeEnd(newStart);
    }
    setSelectedPreset(null);
  };

  const handleEndChange = (value: number) => {
    const newEnd = Math.max(rangeStart, Math.min(value, totalQuestions));
    setRangeEnd(newEnd);
    setSelectedPreset(null);
  };

  const handleStart = () => {
    // Save last range
    localStorage.setItem(`${LAST_RANGE_KEY_PREFIX}${studySet.id}`, JSON.stringify({
      start: rangeStart,
      end: rangeEnd
    }));

    // Create subset
    const subsetQuestions = studySet.questions.slice(rangeStart - 1, rangeEnd);
    const subset: StudySet = {
      ...studySet,
      id: studySet.id, // Keep same ID for progress tracking
      questions: subsetQuestions
    };

    onStart(subset);
  };

  const selectedCount = rangeEnd - rangeStart + 1;

  const getModeLabel = () => {
    switch (mode) {
      case 'flashcards': return 'Flashcards';
      case 'learn': return 'Learn';
      case 'quiz': return 'Test';
      case 'match': return 'Match';
      case 'games': return 'Games';
      default: return 'Study';
    }
  };

  return (
    <div className="study-config-overlay">
      <div className="study-config-modal">
        <div className="config-header">
          <h2>Configure {getModeLabel()}</h2>
          <p className="set-title">{studySet.title}</p>
        </div>

        <div className="config-body">
          <div className="config-section">
            <h3>Select Questions</h3>
            <p className="config-hint">Choose which questions to study ({totalQuestions} total)</p>

            <div className="preset-chips">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  className={`preset-chip ${selectedPreset === preset.label ? 'active' : ''}`}
                  onClick={() => handlePresetClick(preset, preset.label)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="config-section">
            <h3>Custom Range</h3>
            <div className="range-inputs">
              <div className="range-input-group">
                <label>From</label>
                <input
                  type="number"
                  min={1}
                  max={totalQuestions}
                  value={rangeStart}
                  onChange={(e) => handleStartChange(parseInt(e.target.value) || 1)}
                />
              </div>
              <span className="range-separator">to</span>
              <div className="range-input-group">
                <label>To</label>
                <input
                  type="number"
                  min={rangeStart}
                  max={totalQuestions}
                  value={rangeEnd}
                  onChange={(e) => handleEndChange(parseInt(e.target.value) || rangeStart)}
                />
              </div>
            </div>
            <div className="range-slider">
              <input
                type="range"
                min={1}
                max={totalQuestions}
                value={rangeStart}
                onChange={(e) => handleStartChange(parseInt(e.target.value))}
                className="slider-start"
              />
              <input
                type="range"
                min={1}
                max={totalQuestions}
                value={rangeEnd}
                onChange={(e) => handleEndChange(parseInt(e.target.value))}
                className="slider-end"
              />
            </div>
          </div>

          <div className="selected-summary">
            <span className="summary-count">{selectedCount}</span>
            <span className="summary-label">questions selected</span>
          </div>
        </div>

        <div className="config-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleStart}>
            Start {getModeLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}
