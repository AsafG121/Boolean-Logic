import React, { useState, useRef, useEffect } from 'react';
import type { FormulaNotation } from './types.js';
import './NotationSelector.css';

const LABELS: Record<FormulaNotation, string> = {
  mathematical: 'Mathematical',
  text:         'Text',
  c:            'C Language',
};

const OPTIONS: FormulaNotation[] = ['mathematical', 'text', 'c'];

interface NotationSelectorProps {
  notation: FormulaNotation;
  onChange: (newNotation: FormulaNotation) => void;
}

export function NotationSelector({ notation, onChange }: NotationSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  return (
    <div
      className={`notation-selector-container${open ? ' notation-selector-container--open' : ''}`}
      ref={containerRef}
    >
      <button
        className="notation-selector-button"
        onClick={() => setOpen(previousOpen => !previousOpen)}
        type="button"
      >
        Logic Gates Notation
        <span className="notation-selector-chevron">▼</span>
      </button>

      <div className="notation-selector-panel">
        {OPTIONS.map(option => (
          <div
            key={option}
            className="notation-selector-option"
            onClick={() => { onChange(option); setOpen(false); }}
          >
            <span>{LABELS[option]}</span>
            <span className="notation-selector-check">{notation === option ? '✓' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
