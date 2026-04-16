import React from 'react';
import type { RoundResultInfo } from './types.js';
import './RoundResult.css';

interface RoundResultProps {
  result: RoundResultInfo;
}

export function RoundResult({ result }: RoundResultProps) {
  return (
    <div className={`round-result ${result.correct ? 'correct' : 'incorrect'}`}>
      <span className="result-icon">{result.correct ? '✓' : '✗'}</span>
      <span className="result-text">{result.correct ? 'Correct!' : 'Wrong!'}</span>
      {result.points > 0 && (
        <span className="result-points">+{result.points}</span>
      )}
    </div>
  );
}
