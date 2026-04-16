import { evaluateGate } from '../logic-gate-handler/gateEvaluator.js';
import type { EvaluationRound, EvaluationStep, FormulaNode, VariableAssignment } from './types.js';

/**
 * Generates a step-by-step evaluation solution for an EvaluationRound.
 *
 * Traverses the expression tree in post-order (leaves first, root last) so
 * that every step's value is fully determined by the steps before it.
 * Each step records the subexpression node and its computed boolean value.
 */
export function generateEvaluationSolution(round: EvaluationRound): EvaluationStep[] {
  const steps: EvaluationStep[] = [];
  traverse(round.formula.root, round.assignment, steps);
  return steps;
}

function traverse(
  node:       FormulaNode,
  assignment: VariableAssignment,
  steps:      EvaluationStep[],
): boolean {
  switch (node.type) {
    case 'variable': {
      const value = assignment[node.name] as boolean;
      steps.push({ node, value });
      return value;
    }
    case 'not': {
      const operandVal = traverse(node.operand, assignment, steps);
      const value = !operandVal;
      steps.push({ node, value });
      return value;
    }
    case 'binary': {
      const leftVal  = traverse(node.left,  assignment, steps);
      const rightVal = traverse(node.right, assignment, steps);
      const value    = evaluateGate(node.operator, [leftVal, rightVal]);
      steps.push({ node, value });
      return value;
    }
  }
}
