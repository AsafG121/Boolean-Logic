import React from 'react';
import './SubmitButton.css';

interface SubmitButtonProps {
  onSubmit:  () => void;
  disabled?: boolean;
}

export function SubmitButton({ onSubmit, disabled = false }: SubmitButtonProps) {
  return (
    <button
      className="submit-btn"
      onClick={onSubmit}
      disabled={disabled}
    >
      Submit
    </button>
  );
}
