import React from 'react';
import './EquivalenceAnswerButtons.css';

interface EquivalenceAnswerButtonsProps {
  onAnswer:  (answer: boolean) => void;
  disabled?: boolean;
}

export function EquivalenceAnswerButtons({ onAnswer, disabled = false }: EquivalenceAnswerButtonsProps) {
  return (
    <div className="equivalence-answer-buttons">
      <button
        className="equivalence-btn equivalence-equal"
        onClick={() => onAnswer(true)}
        disabled={disabled}
      >
        Equal
      </button>
      <button
        className="equivalence-btn equivalence-not-equal"
        onClick={() => onAnswer(false)}
        disabled={disabled}
      >
        Not Equal
      </button>
    </div>
  );
}
