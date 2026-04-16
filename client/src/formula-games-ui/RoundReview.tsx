import React, { useState } from 'react';
import type { EvaluationRound, EquivalenceRound } from '@boolean-logic/shared';
import { FormulaDisplay }              from './FormulaDisplay.js';
import { VariableAssignmentDisplay }   from './VariableAssignmentDisplay.js';
import { DraftPane }                   from './DraftPane.js';
import { NotationSelector }            from './NotationSelector.js';
import { NotationLegend }              from './NotationLegend.js';
import { EvaluationSolutionDisplay }   from './EvaluationSolutionDisplay.js';
import { EquivalenceProofDisplay }     from './EquivalenceProofDisplay.js';
import type { RoundRecord, FormulaNotation } from './types.js';
import './RoundReview.css';

interface RoundReviewProps {
  record:      RoundRecord;
  roundNumber: number;
  onBack:      () => void;
}

export function RoundReview({ record, roundNumber, onBack }: RoundReviewProps) {
  const [notation,      setNotation]      = useState<FormulaNotation>('mathematical');
  const [showSolution,  setShowSolution]  = useState(false);

  const isEvaluation = record.gameType === 'evaluation';

  return (
    <div className="round-review-container">

      {/* Notation controls */}
      <div className="round-review-notation-bar">
        <NotationSelector notation={notation} onChange={setNotation} />
        <NotationLegend />
      </div>

      {/* Header */}
      <div className="round-review-header">
        <button className="round-review-back-button" onClick={onBack}>
          ← Back to Summary
        </button>
        <span className="round-review-title">
          Round {roundNumber} — Practice
        </span>
        <span className={`round-review-badge ${record.correct ? 'badge-correct' : 'badge-wrong'}`}>
          {record.correct ? `✓ +${record.points} pts` : '✗ Incorrect'}
        </span>
      </div>

      {/* Formula area (same layout as gameplay, no answer filled in) */}
      <div className="round-review-formula-area">
        {isEvaluation ? (
          <>
            <div className="round-review-evaluation-row">
              <FormulaDisplay
                node={(record.round as EvaluationRound).formula.root}
                notation={notation}
              />
              <span className="round-review-equals-sign">=</span>
              <span className="round-review-blank">?</span>
            </div>
            <VariableAssignmentDisplay
              assignment={(record.round as EvaluationRound).assignment}
            />
          </>
        ) : (
          <>
            <FormulaDisplay
              node={(record.round as EquivalenceRound).formulaA.root}
              label="A"
              notation={notation}
            />
            <FormulaDisplay
              node={(record.round as EquivalenceRound).formulaB.root}
              label="B"
              notation={notation}
            />
          </>
        )}
      </div>

      {/* Draft board (empty — same as start of a real round) */}
      <DraftPane />

      {/* Show Solution toggle */}
      <div className="round-review-solution-area">
        <button
          className={`round-review-solution-button ${showSolution ? 'active' : ''}`}
          onClick={() => setShowSolution(previousValue => !previousValue)}
        >
          {showSolution ? 'Hide Solution' : 'Show Solution'}
        </button>

        {showSolution && isEvaluation && (
          <EvaluationSolutionDisplay
            round={record.round as EvaluationRound}
            notation={notation}
          />
        )}
        {showSolution && !isEvaluation && (
          <EquivalenceProofDisplay
            round={record.round as EquivalenceRound}
            notation={notation}
          />
        )}
      </div>

    </div>
  );
}
