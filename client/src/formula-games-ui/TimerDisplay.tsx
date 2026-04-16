import React from 'react';
import './TimerDisplay.css';

interface TimerDisplayProps {
  secondsLeft: number;
}

export function TimerDisplay({ secondsLeft }: TimerDisplayProps) {
  return (
    <span className="timer-label">{secondsLeft}s</span>
  );
}
