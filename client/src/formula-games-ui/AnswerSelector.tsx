import React, { useState, useEffect } from 'react';
import './AnswerSelector.css';

interface AnswerSelectorProps {
  value:    boolean | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function AnswerSelector({ value, onChange, disabled = false }: AnswerSelectorProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  function handleSelect(selectedValue: boolean) {
    onChange(selectedValue);
    setOpen(false);
  }

  return (
    <span className="answer-selector-wrapper">
      <button
        className={`answer-selector-cell${value !== null ? ' has-value' : ''}`}
        onClick={() => setOpen(previousOpen => !previousOpen)}
        disabled={disabled}
        aria-label="Select answer bit"
      >
        {value === null ? '?' : value ? '1' : '0'}
      </button>
      {open && (
        <div className="answer-selector-popup">
          <button className="answer-bit-btn ans-bit-one"  onClick={() => handleSelect(true)}>1</button>
          <button className="answer-bit-btn ans-bit-zero" onClick={() => handleSelect(false)}>0</button>
        </div>
      )}
    </span>
  );
}
