import type {
  FormulaNode,
  Formula,
  VariableAssignment,
  BinaryOperator,
  Difficulty,
  EvaluationRound,
  EquivalenceRound,
} from './types.js';
import { evaluateFormula, checkEquivalence } from './expressionEvaluator.js';

// ---------------------------------------------------------------------------
// Difficulty configuration
// ---------------------------------------------------------------------------

interface DifficultyConfig {
  readonly vars:     string[];
  readonly maxDepth: number;
  readonly ops:      BinaryOperator[];
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy:   { vars: ['x', 'y'],             maxDepth: 2, ops: ['AND', 'OR'] },
  medium: { vars: ['x', 'y', 'z'],        maxDepth: 3, ops: ['AND', 'OR', 'XOR'] },
  hard:   { vars: ['x', 'y', 'z', 'w'],   maxDepth: 4, ops: ['AND', 'OR', 'XOR'] },
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function collectVariables(node: FormulaNode, out: Set<string>): void {
  switch (node.type) {
    case 'variable':
      out.add(node.name);
      break;
    case 'not':
      collectVariables(node.operand, out);
      break;
    case 'binary':
      collectVariables(node.left, out);
      collectVariables(node.right, out);
      break;
  }
}

function makeFormula(root: FormulaNode): Formula {
  const varSet = new Set<string>();
  collectVariables(root, varSet);
  return { root, variables: [...varSet].sort() };
}

/**
 * Recursively generates a random formula node.
 * At depth 0 the root is always a binary operator (non-trivial formula).
 * At depth > 0 there is a chance to produce a leaf (variable).
 */
function generateNode(
  vars: string[],
  ops: BinaryOperator[],
  depth: number,
  maxDepth: number,
): FormulaNode {
  // Force leaf at max depth, or randomly at deeper levels
  if (depth >= maxDepth || (depth > 0 && Math.random() < 0.35)) {
    const varNode: FormulaNode = { type: 'variable', name: randomElement(vars) };
    // Randomly negate leaves ~30 % of the time
    return Math.random() < 0.3
      ? { type: 'not', operand: varNode }
      : varNode;
  }

  // Occasional NOT wrapper at non-root levels
  if (depth > 0 && Math.random() < 0.15) {
    return { type: 'not', operand: generateNode(vars, ops, depth + 1, maxDepth) };
  }

  // Binary operator
  return {
    type:     'binary',
    operator: randomElement(ops),
    left:     generateNode(vars, ops, depth + 1, maxDepth),
    right:    generateNode(vars, ops, depth + 1, maxDepth),
  };
}

function generateRandomFormula(difficulty: Difficulty): Formula {
  const { vars, ops, maxDepth } = DIFFICULTY_CONFIG[difficulty];
  return makeFormula(generateNode(vars, ops, 0, maxDepth));
}

function generateRandomAssignment(variables: readonly string[]): VariableAssignment {
  const assignment: Record<string, boolean> = {};
  for (const v of variables) assignment[v] = Math.random() < 0.5;
  return assignment;
}

// ---------------------------------------------------------------------------
// Equivalent-formula transformations
// ---------------------------------------------------------------------------

/**
 * Applies De Morgan's law (forward) at the root of a NOT node:
 *   NOT(A AND B) → NOT(A) OR  NOT(B)
 *   NOT(A OR  B) → NOT(A) AND NOT(B)
 * Returns the original node unchanged if the law does not apply.
 */
function applyDeMorganForward(node: FormulaNode): FormulaNode {
  if (node.type === 'not' && node.operand.type === 'binary') {
    const inner = node.operand;
    if (inner.operator === 'AND') {
      return {
        type: 'binary', operator: 'OR',
        left:  { type: 'not', operand: inner.left  },
        right: { type: 'not', operand: inner.right },
      };
    }
    if (inner.operator === 'OR') {
      return {
        type: 'binary', operator: 'AND',
        left:  { type: 'not', operand: inner.left  },
        right: { type: 'not', operand: inner.right },
      };
    }
  }
  return node;
}

/**
 * Returns the logical negation of `node`, cancelling a leading NOT when one
 * is already present:  negOf(NOT(A)) = A,  negOf(A) = NOT(A).
 * Used when building reverse-De-Morgan results to avoid double negations.
 */
function negOf(node: FormulaNode): FormulaNode {
  return node.type === 'not' ? node.operand : { type: 'not', operand: node };
}

/**
 * Recursively applies equivalence-preserving transformations bottom-up.
 * Which transformations are available depends on the difficulty level:
 *
 *  easy   – forward De Morgan (always) + general reverse De Morgan (~40 %)
 *  medium – same as easy, plus commutativity (~60 %)
 *  hard   – same as medium, plus XOR expansion (~50 % on XOR nodes)
 */
function applyTransformationsRecursively(
  node:       FormulaNode,
  difficulty: Difficulty,
): FormulaNode {
  switch (node.type) {
    case 'variable':
      return node;

    case 'not': {
      const operand     = applyTransformationsRecursively(node.operand, difficulty);
      const notNode: FormulaNode = { type: 'not', operand };
      const expanded    = applyDeMorganForward(notNode);
      return expanded !== notNode ? expanded : notNode;
    }

    case 'binary': {
      const left  = applyTransformationsRecursively(node.left,  difficulty);
      const right = applyTransformationsRecursively(node.right, difficulty);
      const { operator } = node;

      // Hard only: XOR expansion  A XOR B → (A OR B) AND NOT(A AND B)
      if (difficulty === 'hard' && operator === 'XOR' && Math.random() < 0.5) {
        return {
          type: 'binary', operator: 'AND',
          left:  { type: 'binary', operator: 'OR',  left, right },
          right: { type: 'not', operand: { type: 'binary', operator: 'AND', left, right } },
        };
      }

      // All levels: general reverse De Morgan for AND / OR (~40 % chance)
      //   A AND B → NOT( negOf(A) OR  negOf(B) )
      //   A OR  B → NOT( negOf(A) AND negOf(B) )
      if ((operator === 'AND' || operator === 'OR') && Math.random() < 0.4) {
        return {
          type: 'not',
          operand: {
            type:     'binary',
            operator: operator === 'AND' ? 'OR' : 'AND',
            left:     negOf(left),
            right:    negOf(right),
          },
        };
      }

      // Medium / hard only: commutativity (~60 % chance)
      if (difficulty !== 'easy' && Math.random() < 0.6) {
        return { ...node, left: right, right: left };
      }

      return { ...node, left, right };
    }
  }
}

/**
 * Creates a syntactically different but logically equivalent formula by
 * applying difficulty-appropriate equivalence transformations throughout
 * the entire tree.
 */
function makeEquivalentVariant(formula: Formula, difficulty: Difficulty): Formula {
  return makeFormula(applyTransformationsRecursively(formula.root, difficulty));
}

// ---------------------------------------------------------------------------
// Public generators
// ---------------------------------------------------------------------------

/**
 * Generates a single round for the Formula Evaluation game.
 * The `correctAnswer` field is pre-computed from the formula and assignment.
 */
export function generateEvaluationRound(difficulty: Difficulty): EvaluationRound {
  const formula       = generateRandomFormula(difficulty);
  const assignment    = generateRandomAssignment(formula.variables);
  const correctAnswer = evaluateFormula(formula.root, assignment);
  return { formula, assignment, correctAnswer };
}

/**
 * Generates a single round for the Formula Equivalence game.
 *
 * @param difficulty      Controls formula complexity.
 * @param targetEquivalent Whether the generated pair should be logically equivalent.
 */
export function generateEquivalenceRound(
  difficulty: Difficulty, targetEquivalent: boolean): EquivalenceRound {
  const formulaA = generateRandomFormula(difficulty);

  if (targetEquivalent) {
    const formulaB = makeEquivalentVariant(formulaA, difficulty);
    return { formulaA, formulaB, areEquivalent: true };
  }

  // Generate formulaB until it is provably NOT equivalent to formulaA
  for (let attempt = 0; attempt < 50; attempt++) {
    const formulaB = generateRandomFormula(difficulty);
    if (!checkEquivalence(formulaA, formulaB)) {
      return { formulaA, formulaB, areEquivalent: false };
    }
  }

  // Reliable fallback: negate the whole formula — NOT(A) is never equivalent to A
  // unless A is a tautology/contradiction, which is uncommon in random formulas.
  // We verify just in case.
  const negatedRoot: FormulaNode = { type: 'not', operand: formulaA.root };
  const formulaB  = makeFormula(negatedRoot);
  const areEquivalent  = checkEquivalence(formulaA, formulaB);
  return { formulaA, formulaB, areEquivalent };
}
