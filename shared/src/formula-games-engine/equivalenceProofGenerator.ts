import { evaluateFormula } from './expressionEvaluator.js';
import type {
  EquivalenceProofStep,
  Formula,
  FormulaNode,
  VariableAssignment,
} from './types.js';

// ─── Exact structural serialisation ──────────────────────────────────────────
// Preserves operand order so that commutativity variants hash differently.
// This lets the BFS treat them as distinct states and emit explicit
// Commutativity steps.

function serialize(node: FormulaNode): string {
  switch (node.type) {
    case 'variable': return node.name;
    case 'not':      return `NOT(${serialize(node.operand)})`;
    case 'binary':   return `${node.operator}(${serialize(node.left)},${serialize(node.right)})`;
  }
}

// ─── Negation helper ─────────────────────────────────────────────────────────

/** negOf(NOT(A)) = A,  negOf(A) = NOT(A).  Cancels a leading NOT. */
function negOf(node: FormulaNode): FormulaNode {
  return node.type === 'not' ? node.operand : { type: 'not', operand: node };
}

// ─── Rewrite rules ────────────────────────────────────────────────────────────

type Rewrite = { newNode: FormulaNode; ruleName: string; on: FormulaNode };

/** Applies all Boolean-algebra rules directly at the root of `node`. */
function rulesAt(node: FormulaNode): Rewrite[] {
  const out: Rewrite[] = [];

  // Commutativity: A OP B → B OP A  (explicit step, all binary operators)
  if (node.type === 'binary') {
    out.push({
      newNode:  { ...node, left: node.right, right: node.left },
      ruleName: 'Commutativity',
      on:       node,
    });
  }

  // Double Negation elimination: NOT(NOT(x)) → x
  if (node.type === 'not' && node.operand.type === 'not') {
    out.push({
      newNode:  node.operand.operand,
      ruleName: 'Double Negation',
      on:       node,
    });
  }

  // De Morgan AND: NOT(x AND y) → NOT(x) OR NOT(y)
  if (
    node.type === 'not' &&
    node.operand.type === 'binary' &&
    node.operand.operator === 'AND'
  ) {
    out.push({
      newNode: {
        type:     'binary',
        operator: 'OR',
        left:     { type: 'not', operand: node.operand.left  },
        right:    { type: 'not', operand: node.operand.right },
      },
      ruleName: "De Morgan's",
      on:       node,
    });
  }

  // De Morgan OR: NOT(x OR y) → NOT(x) AND NOT(y)
  if (
    node.type === 'not' &&
    node.operand.type === 'binary' &&
    node.operand.operator === 'OR'
  ) {
    out.push({
      newNode: {
        type:     'binary',
        operator: 'AND',
        left:     { type: 'not', operand: node.operand.left  },
        right:    { type: 'not', operand: node.operand.right },
      },
      ruleName: "De Morgan's",
      on:       node,
    });
  }

  // General reverse De Morgan AND: A AND B → NOT( negOf(A) OR negOf(B) )
  if (node.type === 'binary' && node.operator === 'AND') {
    out.push({
      newNode: {
        type: 'not',
        operand: {
          type: 'binary', operator: 'OR',
          left:  negOf(node.left),
          right: negOf(node.right),
        },
      },
      ruleName: "De Morgan's",
      on:       node,
    });
  }

  // General reverse De Morgan OR: A OR B → NOT( negOf(A) AND negOf(B) )
  if (node.type === 'binary' && node.operator === 'OR') {
    out.push({
      newNode: {
        type: 'not',
        operand: {
          type: 'binary', operator: 'AND',
          left:  negOf(node.left),
          right: negOf(node.right),
        },
      },
      ruleName: "De Morgan's",
      on:       node,
    });
  }

  // XOR expansion: A XOR B → (A OR B) AND NOT(A AND B)
  if (node.type === 'binary' && node.operator === 'XOR') {
    out.push({
      newNode: {
        type: 'binary', operator: 'AND',
        left:  { type: 'binary', operator: 'OR',  left: node.left, right: node.right },
        right: { type: 'not', operand: { type: 'binary', operator: 'AND', left: node.left, right: node.right } },
      },
      ruleName: 'XOR expansion',
      on:       node,
    });
  }

  // XOR contraction: (A OR B) AND NOT(A AND B) → A XOR B
  if (
    node.type === 'binary' && node.operator === 'AND' &&
    node.left.type  === 'binary' && node.left.operator  === 'OR'  &&
    node.right.type === 'not'    &&
    node.right.operand.type === 'binary' && node.right.operand.operator === 'AND' &&
    serialize(node.left.left)  === serialize(node.right.operand.left) &&
    serialize(node.left.right) === serialize(node.right.operand.right)
  ) {
    out.push({
      newNode:  { type: 'binary', operator: 'XOR', left: node.left.left, right: node.left.right },
      ruleName: 'XOR expansion',
      on:       node,
    });
  }

  return out;
}

/**
 * Collects every single-step rewrite reachable by applying one rule at
 * any position in the tree (root or any subtree).
 */
function allRewrites(node: FormulaNode): Rewrite[] {
  const rewrites: Rewrite[] = rulesAt(node);

  if (node.type === 'not') {
    for (const { newNode: newOperand, ruleName, on } of allRewrites(node.operand)) {
      out.push({ newNode: { type: 'not', operand: newOperand }, ruleName, on });
    }
  } else if (node.type === 'binary') {
    for (const { newNode: newLeft, ruleName, on } of allRewrites(node.left)) {
      out.push({ newNode: { ...node, left: newLeft }, ruleName, on });
    }
    for (const { newNode: newRight, ruleName, on } of allRewrites(node.right)) {
      out.push({ newNode: { ...node, right: newRight }, ruleName, on });
    }
  }

  return out;
}

// ─── BFS proof search ─────────────────────────────────────────────────────────

const MAX_DEPTH  = 25;
const MAX_STATES = 20000;

function findProof(
  start: FormulaNode,
  goal:  FormulaNode,
): EquivalenceProofStep[] | null {
  const goalKey  = serialize(goal);
  const startKey = serialize(start);

  if (startKey === goalKey) {
    return [{ formula: start, ruleName: 'Given' }];
  }

  const visited = new Set<string>([startKey]);
  type State = { node: FormulaNode; path: EquivalenceProofStep[] };

  const queue: State[] = [{
    node: start,
    path: [{ formula: start, ruleName: 'Given' }],
  }];

  let explored = 0;

  while (queue.length > 0 && explored < MAX_STATES) {
    const { node, path } = queue.shift()!;
    explored++;

    for (const { newNode, ruleName, on } of allRewrites(node)) {
      const key = serialize(newNode);
      if (visited.has(key)) continue;
      visited.add(key);

      const newPath = [...path, { formula: newNode, ruleName, on }];

      if (key === goalKey) return newPath;

      if (newPath.length < MAX_DEPTH) {
        queue.push({ node: newNode, path: newPath });
      }
    }
  }

  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a proof chain transforming formulaA into formulaB using named
 * Boolean algebra rules (De Morgan's, Double Negation, Commutativity).
 *
 * Returns an ordered array of steps where each step carries the formula after
 * the named rule was applied.  The first step always has ruleName 'Given'.
 * Returns an empty array when no proof is found within the search budget.
 */
export function generateEquivalenceProof(
  formulaA: Formula,
  formulaB: Formula,
): EquivalenceProofStep[] {
  return findProof(formulaA.root, formulaB.root) ?? [];
}

/**
 * Finds a variable assignment that witnesses the non-equivalence of two
 * formulas (an assignment on which they differ), or null if they are equivalent.
 */
export function findCounterexample(
  formulaA: Formula,
  formulaB: Formula,
): VariableAssignment | null {
  const allVars = [...new Set([...formulaA.variables, ...formulaB.variables])].sort();
  const n = allVars.length;

  for (let mask = 0; mask < (1 << n); mask++) {
    const assignment: Record<string, boolean> = {};
    for (let i = 0; i < n; i++) {
      assignment[allVars[i]] = Boolean((mask >> i) & 1);
    }
    const a = evaluateFormula(formulaA.root, assignment);
    const b = evaluateFormula(formulaB.root, assignment);
    if (a !== b) return assignment;
  }

  return null;
}
