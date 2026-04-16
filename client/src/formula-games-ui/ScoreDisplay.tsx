import React from 'react';
import './ScoreDisplay.css';

type ScoreDisplayProps =
  | { mode: 'solo';   score: number }
  | { mode: 'online'; score: number; opponentScore: number;
      playerName: string; opponentName: string };

export function ScoreDisplay(props: ScoreDisplayProps) {
  if (props.mode === 'solo') {
    return (
      <div className="score-solo">
        <span className="score-label">Score</span>
        <span className="score-value">{props.score}</span>
      </div>
    );
  }

  return (
    <div className="score-online">
      <div className="score-player">
        <span className="score-name">{props.playerName}</span>
        <span className="score-value you">{props.score}</span>
      </div>
      <span className="score-vs">vs</span>
      <div className="score-player">
        <span className="score-name">{props.opponentName}</span>
        <span className="score-value opponent">{props.opponentScore}</span>
      </div>
    </div>
  );
}
