/**
 * All supported logic gate types.
 * NOT is unary (1 input). All others are binary (2 inputs).
 */
export type GateType = 'AND' | 'OR' | 'XOR' | 'NOT' | 'NAND' | 'NOR' | 'XNOR';

/**
 * Evaluates a logic gate given its type and binary inputs.
 * Throws if the number of inputs does not match the gate's arity.
 */
export function evaluateGate(gate: GateType, inputs: boolean[]): boolean {
  if (gate === 'NOT') {
    if (inputs.length !== 1) {
      throw new Error(`NOT gate requires exactly 1 input, got ${inputs.length}`);
    }
    return !inputs[0];
  }

  if (inputs.length !== 2) {
    throw new Error(`${gate} gate requires exactly 2 inputs, got ${inputs.length}`);
  }

  const [a, b] = inputs;

  switch (gate) {
    case 'AND':  return a && b;
    case 'OR':   return a || b;
    case 'XOR':  return a !== b;
    case 'NAND': return !(a && b);
    case 'NOR':  return !(a || b);
    case 'XNOR': return a === b;
  }
}
