import type { FormulaNode, BinaryOperator, Formula } from './types.js';

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type TokenType = 'VARIABLE' | 'KEYWORD' | 'LPAREN' | 'RPAREN' | 'EOF';

interface Token {
  readonly type:  TokenType;
  readonly value: string;
}

const KEYWORDS = new Set(['AND', 'OR', 'XOR', 'NOT', 'NAND', 'NOR', 'XNOR']);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    if (/\s/.test(input[i])) { 
      i++; continue; }

    if (input[i] === '(') { 
      tokens.push({ type: 'LPAREN',  value: '(' });
      i++; 
      continue; }

    if (input[i] === ')') { 
      tokens.push({ type: 'RPAREN',  value: ')' }); 
      i++; 
      continue; }

    if (/[a-zA-Z]/.test(input[i])) {
      let j = i;
      while (j < input.length && /[a-zA-Z0-9]/.test(input[j])) 
        j++;
      const raw = input.slice(i, j);
      const upper = raw.toUpperCase();
      if (KEYWORDS.has(upper)) {
        tokens.push({ type: 'KEYWORD',   value: upper });
      } else {
        tokens.push({ type: 'VARIABLE',  value: raw.toLowerCase() });
      }
      i = j;
      continue;
    }

    throw new Error(`Unexpected character '${input[i]}' at position ${i}`);
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// ---------------------------------------------------------------------------
// Recursive-descent parser
// ---------------------------------------------------------------------------
// Operator precedence (low → high):
//   OR / NOR   (1)  — NOR desugars to NOT(OR(...))
//   XOR / XNOR (2)  — XNOR desugars to NOT(XOR(...))
//   AND / NAND (3)  — NAND desugars to NOT(AND(...))
//   NOT        (4, prefix)
// ---------------------------------------------------------------------------

class Parser {
  private readonly tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token  { return this.tokens[this.pos]; }
  private consume(): Token { return this.tokens[this.pos++]; }

  private expect(type: TokenType): Token {
    const tok = this.consume();
    if (tok.type !== type) {
      throw new Error(`Expected ${type} but got '${tok.value}' (${tok.type})`);
    }
    return tok;
  }

  parse(): FormulaNode {
    const node = this.parseOrExpr();
    if (this.peek().type !== 'EOF') {
      throw new Error(`Unexpected token '${this.peek().value}' after expression`);
    }
    return node;
  }

  /** or_expr → xor_expr (('OR' | 'NOR') xor_expr)* */
  private parseOrExpr(): FormulaNode {
    let left = this.parseXorExpr();
    while (
      this.peek().type === 'KEYWORD' &&
      (this.peek().value === 'OR' || this.peek().value === 'NOR')
    ) {
      const isNor = this.consume().value === 'NOR';
      const right = this.parseXorExpr();
      const binary: FormulaNode = { type: 'binary', operator: 'OR', left, right };
      left = isNor ? { type: 'not', operand: binary } : binary;
    }
    return left;
  }

  /** xor_expr → and_expr (('XOR' | 'XNOR') and_expr)* */
  private parseXorExpr(): FormulaNode {
    let left = this.parseAndExpr();
    while (
      this.peek().type === 'KEYWORD' &&
      (this.peek().value === 'XOR' || this.peek().value === 'XNOR')
    ) {
      const isXnor = this.consume().value === 'XNOR';
      const right  = this.parseAndExpr();
      const binary: FormulaNode = { type: 'binary', operator: 'XOR', left, right };
      left = isXnor ? { type: 'not', operand: binary } : binary;
    }
    return left;
  }

  /** and_expr → not_expr (('AND' | 'NAND') not_expr)* */
  private parseAndExpr(): FormulaNode {
    let left = this.parseNotExpr();
    while (
      this.peek().type === 'KEYWORD' &&
      (this.peek().value === 'AND' || this.peek().value === 'NAND')
    ) {
      const isNand = this.consume().value === 'NAND';
      const right  = this.parseNotExpr();
      const binary: FormulaNode = { type: 'binary', operator: 'AND', left, right };
      left = isNand ? { type: 'not', operand: binary } : binary;
    }
    return left;
  }

  /** not_expr → 'NOT' not_expr | primary */
  private parseNotExpr(): FormulaNode {
    if (this.peek().type === 'KEYWORD' && this.peek().value === 'NOT') {
      this.consume();
      const operand = this.parseNotExpr();
      return { type: 'not', operand };
    }
    return this.parsePrimary();
  }

  /** primary → VARIABLE | '(' or_expr ')' */
  private parsePrimary(): FormulaNode {
    const tok = this.peek();

    if (tok.type === 'LPAREN') {
      this.consume();
      const node = this.parseOrExpr();
      this.expect('RPAREN');
      return node;
    }

    if (tok.type === 'VARIABLE') {
      this.consume();
      return { type: 'variable', name: tok.value };
    }

    if (tok.type === 'KEYWORD') {
      throw new Error(`Unexpected keyword '${tok.value}' in operand position`);
    }

    throw new Error(`Unexpected token '${tok.value}' (${tok.type})`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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

/**
 * Parses a textual Boolean formula into an expression tree.
 *
 * Syntax:
 *   Variables  — any identifier not matching a keyword (case-insensitive, stored lowercase)
 *   Unary      — NOT x
 *   Binary     — x AND y | x OR y | x XOR y
 *   Shorthand  — x NAND y | x NOR y | x XNOR y (desugared to NOT(AND/OR/XOR) in the tree)
 *   Grouping   — (x AND y)
 *   Precedence — NOT  >  AND/NAND  >  XOR/XNOR  >  OR/NOR
 */
export function parseFormula(input: string): Formula {
  if (!input.trim()) throw new Error('Formula string must not be empty');
  const tokens = tokenize(input);
  const root   = new Parser(tokens).parse();
  const varSet = new Set<string>();
  collectVariables(root, varSet);
  return { root, variables: [...varSet].sort() };
}

/**
 * Serializes a formula expression tree back to a canonical text string.
 * Adds parentheses only where required by precedence.
 */
export function serializeFormula(node: FormulaNode, parentPrec = 0): string {
  switch (node.type) {
    case 'variable': return node.name;
    case 'not':      return `NOT ${serializeFormula(node.operand, 4)}`;
    case 'binary': {
      const prec  = operatorPrecedence(node.operator);
      const inner =
        `${serializeFormula(node.left, prec)} ${node.operator} ${serializeFormula(node.right, prec + 1)}`;
      return prec < parentPrec ? `(${inner})` : inner;
    }
  }
}

function operatorPrecedence(op: BinaryOperator): number {
  switch (op) {
    case 'AND': return 3;
    case 'XOR': return 2;
    case 'OR':  return 1;
  }
}
