import React from 'react';
import type { VariableAssignment } from '@boolean-logic/shared';
import './VariableAssignmentDisplay.css';

interface VariableAssignmentDisplayProps {
  assignment: VariableAssignment;
}

export function VariableAssignmentDisplay({ assignment }: VariableAssignmentDisplayProps) {
  const entries = Object.entries(assignment).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="variable-assignment-display">
      {entries.map(([variable, value]) => (
        <span key={variable} className="assignment-entry">
          <span className="assignment-variable">{variable}</span>
          <span className="assignment-equals">=</span>
          <span className={`assignment-value ${value ? 'value-true' : 'value-false'}`}>
            {value ? '1' : '0'}
          </span>
        </span>
      ))}
    </div>
  );
}
