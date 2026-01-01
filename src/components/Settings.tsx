import React, { useState, useEffect } from 'react';

interface Props {
  onBack: () => void;
}

interface StudySettings {
  defaultQuestionsPerSession: number;
  rememberLastRange: boolean;
  autoAdvanceOnCorrect: boolean;
  showConfigBeforeStudy: boolean;
}

const SETTINGS_KEY = 'study_settings';

const DEFAULT_SETTINGS: StudySettings = {
  defaultQuestionsPerSession: 20,
  rememberLastRange: true,
  autoAdvanceOnCorrect: true,
  showConfigBeforeStudy: true,
};

export default function Settings({ onBack }: Props) {
  const [settings, setSettings] = useState<StudySettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        // Use defaults
      }
    }
  }, []);

  const handleChange = <K extends keyof StudySettings>(key: K, value: StudySettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearAllProgress = () => {
    if (window.confirm('Are you sure you want to clear all saved progress? This cannot be undone.')) {
      // Clear all learn and quiz progress
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('learn_progress_') || key.startsWith('quiz_progress_') || key.startsWith('last_range_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      alert('All progress cleared!');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="btn-back" onClick={onBack}>
          Back
        </button>
        <h1>Settings</h1>
        {saved && <span className="saved-indicator">Saved!</span>}
      </div>

      <div className="settings-content">
        <section className="settings-section">
          <h2>Study Preferences</h2>

          <div className="setting-item">
            <div className="setting-info">
              <label>Default questions per session</label>
              <p className="setting-description">
                How many questions to study by default when starting a session
              </p>
            </div>
            <div className="setting-control">
              <select
                value={settings.defaultQuestionsPerSession}
                onChange={(e) => handleChange('defaultQuestionsPerSession', parseInt(e.target.value))}
              >
                <option value={10}>10 questions</option>
                <option value={20}>20 questions</option>
                <option value={25}>25 questions</option>
                <option value={50}>50 questions</option>
                <option value={100}>100 questions</option>
                <option value={999}>All questions</option>
              </select>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Show study config before starting</label>
              <p className="setting-description">
                Choose question range before each study session
              </p>
            </div>
            <div className="setting-control">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.showConfigBeforeStudy}
                  onChange={(e) => handleChange('showConfigBeforeStudy', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Remember last question range</label>
              <p className="setting-description">
                Start from where you left off in each set
              </p>
            </div>
            <div className="setting-control">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.rememberLastRange}
                  onChange={(e) => handleChange('rememberLastRange', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Auto-advance on correct answer</label>
              <p className="setting-description">
                In Learn mode, automatically go to next question when correct
              </p>
            </div>
            <div className="setting-control">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={settings.autoAdvanceOnCorrect}
                  onChange={(e) => handleChange('autoAdvanceOnCorrect', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2>Data</h2>

          <div className="setting-item">
            <div className="setting-info">
              <label>Clear all progress</label>
              <p className="setting-description">
                Remove all saved Learn and Quiz progress
              </p>
            </div>
            <div className="setting-control">
              <button className="btn-danger" onClick={clearAllProgress}>
                Clear Progress
              </button>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <label>Reset settings</label>
              <p className="setting-description">
                Restore all settings to defaults
              </p>
            </div>
            <div className="setting-control">
              <button className="btn-secondary" onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
