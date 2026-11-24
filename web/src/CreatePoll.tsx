import { useState } from 'react';

interface Props {
  onCreate: (question: string, category: string, options: string[]) => Promise<boolean>;
  onClose: () => void;
}

const CATEGORIES = ['Tech', 'Work', 'Fun', 'General'];

export function CreatePoll({ onCreate, onClose }: Props) {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('General');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const setOption = (i: number, value: string) => {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  };

  const submit = async () => {
    const clean = options.map((o) => o.trim()).filter(Boolean);
    if (question.trim().length < 3) {
      setError('Give the question at least 3 characters.');
      return;
    }
    if (clean.length < 2) {
      setError('A poll needs at least 2 options.');
      return;
    }
    setBusy(true);
    const ok = await onCreate(question.trim(), category, clean);
    setBusy(false);
    if (ok) onClose();
    else setError('Could not save the poll. Try again.');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New poll</h2>
        <input
          className="text-input"
          placeholder="Ask something..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <div className="category-row">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`chip-select ${category === c ? 'chip-active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        {options.map((opt, i) => (
          <div className="option-row" key={i}>
            <input
              className="text-input"
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
            />
            {options.length > 2 && (
              <button
                className="icon-btn"
                aria-label={`Remove option ${i + 1}`}
                onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <button className="ghost-btn" onClick={() => setOptions((prev) => [...prev, ''])}>
            + Add option
          </button>
        )}
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button className="ghost-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" disabled={busy} onClick={submit}>
            {busy ? 'Creating...' : 'Create poll'}
          </button>
        </div>
      </div>
    </div>
  );
}
