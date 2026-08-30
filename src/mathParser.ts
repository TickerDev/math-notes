export type NotePart =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string; source: string }

const greek: Record<string, string> = {
  alpha: '\\alpha', beta: '\\beta', gamma: '\\gamma', delta: '\\delta',
  epsilon: '\\epsilon', zeta: '\\zeta', eta: '\\eta', theta: '\\theta',
  iota: '\\iota', kappa: '\\kappa', lambda: '\\lambda', mu: '\\mu',
  nu: '\\nu', xi: '\\xi', omicron: 'o', pi: '\\pi', rho: '\\rho',
  sigma: '\\sigma', tau: '\\tau', upsilon: '\\upsilon', phi: '\\phi',
  chi: '\\chi', psi: '\\psi', omega: '\\omega',
}

const namedFunctions: Record<string, string> = {
  sine: '\\sin', sin: '\\sin', cosine: '\\cos', cos: '\\cos',
  tangent: '\\tan', tan: '\\tan', secant: '\\sec', sec: '\\sec',
  cosecant: '\\csc', csc: '\\csc', cotangent: '\\cot', cot: '\\cot',
  arcsine: '\\arcsin', 'arc sine': '\\arcsin', 'inverse sine': '\\arcsin', 'sine inverse': '\\arcsin', 'sin inverse': '\\arcsin',
  arccosine: '\\arccos', 'arc cosine': '\\arccos', 'inverse cosine': '\\arccos', 'cosine inverse': '\\arccos', 'cos inverse': '\\arccos',
  arctangent: '\\arctan', 'arc tangent': '\\arctan', 'inverse tangent': '\\arctan', 'tangent inverse': '\\arctan', 'tan inverse': '\\arctan',
  logarithm: '\\log', log: '\\log', 'natural log': '\\ln', ln: '\\ln',
  exponential: '\\exp', exp: '\\exp',
}

const smallNumbers: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
}

const tens: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}

const greekNames = Object.keys(greek).join('|')
const numberWords = `${Object.keys(smallNumbers).join('|')}|${Object.keys(tens).join('|')}`
const spokenNumberPattern = `(?:${numberWords})(?:[- ](?:one|two|three|four|five|six|seven|eight|nine))?`
const scalarPattern = `(?:negative\\s+)?(?:infinity|\\d+(?:\\.\\d+)?|${spokenNumberPattern}|[a-z]|${greekNames})`
const namedFunctionNames = Object.keys(namedFunctions).sort((a, b) => b.length - a.length).join('|')
const namedFunctionNamePattern = `(?:${namedFunctionNames})`
const capitalFunctionPattern = `(?:(?:capital|calc for)\\s+[a-z])`
const functionPattern = `(?:(?:${capitalFunctionPattern}|[a-z])\\s+of\\s+(?:${scalarPattern})|${namedFunctionNamePattern}\\s+(?:of\\s+)?(?:${scalarPattern}))`
const baseAtomPattern = `(?:${functionPattern}|${scalarPattern})`
const exponentAtomPattern = `(?:${baseAtomPattern})(?:\\s+(?:squared|square|cubed))?`
const spokenExponentPattern = `(?:(?:negative|minus)\\s+)?${exponentAtomPattern}`
const poweredAtomPattern = `(?:${baseAtomPattern})(?:\\s+(?:squared|square|cubed|to the power of\\s+${scalarPattern}|to the\\s+${spokenExponentPattern}))?`
const fractionPattern = `(?:${poweredAtomPattern})\\s+over\\s+(?:${poweredAtomPattern})`
const rootPattern = `(?:square root|cube root)\\s+of\\s+(?:${poweredAtomPattern}|${fractionPattern})`
const absolutePattern = `absolute value of\\s+(?:${poweredAtomPattern}|${fractionPattern})`
const atomPattern = `(?:${rootPattern}|${absolutePattern}|${fractionPattern}|${poweredAtomPattern})`
const arithmeticPattern = `${atomPattern}(?:\\s+(?:plus or minus|plus|minus|times|multiplied by|divided by)\\s+${atomPattern})*`
const integralLabelPattern = `(?:the\\s+)?(?:minimum|maximum)\\s+value`
const relationPattern = 'is not equal to|does not equal|not equal to|is greater than or equal to|greater than or equal to|is less than or equal to|less than or equal to|is approximately equal to|approximately equals|is no greater than|no greater than|is no less than|no less than|is at least|at least|is at most|at most|can be found as|is given by|should be equal to|should equal|is equal to|equal to|evaluates to|results in|gives us|gives|equals|is greater than|greater than|is less than|less than'
const calculusRelationPattern = `(?:${relationPattern}|is)`
const expressionBoundaryPattern = `(?=[,.;]|\\s+(?:and|but|which|so|then|for)\\b|$)`

function spokenNumberValue(input: string): string | null {
  const normalized = input.toLowerCase().replace(/-/g, ' ').trim()
  let sign = 1
  let words = normalized.split(/\s+/)
  if (words[0] === 'negative') { sign = -1; words = words.slice(1) }
  if (words.length === 0 || !words.every((word) => word in smallNumbers || word in tens)) return null
  let total = 0
  for (const word of words) total += smallNumbers[word] ?? tens[word]
  return String(sign * total)
}

const value = (input: string) => {
  const cleaned = input.trim().toLowerCase()
  if (cleaned === 'infinity' || cleaned === 'positive infinity') return '\\infty'
  if (cleaned === 'negative infinity') return '-\\infty'
  const spoken = spokenNumberValue(cleaned)
  if (spoken !== null) return spoken
  return greek[cleaned] ?? cleaned.replace(/\s+/g, '\\,')
}

function atomValue(input: string): string {
  const atom = input.trim().toLowerCase().replace(/\s+/g, ' ')
  let match: RegExpMatchArray | null

  if ((match = atom.match(/^square root of (.+)$/))) return `\\sqrt{${expressionValue(match[1])}}`
  if ((match = atom.match(/^cube root of (.+)$/))) return `\\sqrt[3]{${expressionValue(match[1])}}`
  if ((match = atom.match(/^absolute value of (.+)$/))) return `\\left|${expressionValue(match[1])}\\right|`
  if ((match = atom.match(/^(.+?) to the power of (.+)$/))) return `${atomValue(match[1])}^{${atomValue(match[2])}}`
  if ((match = atom.match(/^(.+?) to the (?:(negative|minus)\s+)?(.+)$/))) {
    const exponent = atomValue(match[3])
    return `${atomValue(match[1])}^{${match[2] ? `-${exponent}` : exponent}}`
  }
  if ((match = atom.match(/^(.+?) (?:squared|square)$/))) return `${atomValue(match[1])}^{2}`
  if ((match = atom.match(/^(.+?) cubed$/))) return `${atomValue(match[1])}^{3}`
  if ((match = atom.match(/^(.+?) over (.+)$/))) return `\\frac{${atomValue(match[1])}}{${atomValue(match[2])}}`
  if ((match = atom.match(/^log(?:arithm)? base (.+?) of (.+)$/))) return `\\log_{${atomValue(match[1])}}\\left(${expressionValue(match[2])}\\right)`
  if ((match = atom.match(/^(.+?) subscript (.+)$/))) return `${atomValue(match[1])}_{${atomValue(match[2])}}`
  if ((match = atom.match(/^(.+?) factorial$/))) return `${atomValue(match[1])}!`
  if ((match = atom.match(/^(?:capital|calc for)\s+([a-z]) of (.+)$/))) {
    return `${match[1].toUpperCase()}\\left(${expressionValue(match[2])}\\right)`
  }
  if ((match = atom.match(new RegExp(`^(${namedFunctionNamePattern})(?: of)? (.+)$`)))) {
    return `${namedFunctions[match[1]]}\\left(${expressionValue(match[2])}\\right)`
  }
  if ((match = atom.match(/^([a-z]) of (.+)$/))) return `${match[1]}\\left(${expressionValue(match[2])}\\right)`
  if ((match = atom.match(/^negative (.+)$/))) return `-${atomValue(match[1])}`
  return value(atom)
}

const arithmeticOperators: Record<string, string> = {
  'plus or minus': '\\pm', plus: '+', minus: '-', times: '\\times',
  'multiplied by': '\\times', 'divided by': '\\div',
}

function expressionValue(input: string): string {
  const expression = input.trim().replace(/\s+/g, ' ')
  const differential = expression.match(/^(.+?)\s+d\s*([a-z])$/i)
  if (differential) return `${expressionValue(differential[1])}\\,d${value(differential[2])}`
  if (/^.+? to the (?:(?:negative|minus)\s+)?.+$/i.test(expression)) return atomValue(expression)
  const pieces = expression.split(/\s+(plus or minus|plus|minus|times|multiplied by|divided by)\s+/i)
  if (pieces.length === 1) return atomValue(expression)
  return pieces.map((piece, index) => index % 2 ? arithmeticOperators[piece.toLowerCase()] : atomValue(piece)).join(' ')
}

function integralExpressionValue(input: string): string {
  const expression = input.trim().toLowerCase().replace(/^the\s+/, '').replace(/\s+/g, ' ')
  if (/^(?:minimum|maximum) value$/.test(expression)) return `\\text{${expression}}`
  return expressionValue(input)
}

function derivativeExpressionValue(expression: string, variable: string, order = 1, partial = false): string {
  const simple = new RegExp(`^${scalarPattern}$`, 'i').test(expression.trim())
  const body = expressionValue(expression)
  const variableValue = value(variable)

  if (partial) {
    return simple
      ? `\\frac{\\partial ${body}}{\\partial ${variableValue}}`
      : `\\frac{\\partial}{\\partial ${variableValue}}\\left(${body}\\right)`
  }
  if (order === 2) {
    return simple
      ? `\\frac{d^2${body}}{d${variableValue}^2}`
      : `\\frac{d^2}{d${variableValue}^2}\\left(${body}\\right)`
  }
  return simple
    ? `\\frac{d${body}}{d${variableValue}}`
    : `\\frac{d}{d${variableValue}}\\left(${body}\\right)`
}

const relations: Record<string, string> = {
  is: '=', 'is equal to': '=', 'equal to': '=', equals: '=',
  'should be equal to': '=', 'should equal': '=', 'evaluates to': '=',
  'results in': '=', 'gives us': '=', gives: '=',
  'is not equal to': '\\neq', 'does not equal': '\\neq', 'not equal to': '\\neq',
  'is approximately equal to': '\\approx', 'approximately equals': '\\approx',
  'can be found as': '=', 'is given by': '=',
  'is greater than': '>', 'greater than': '>',
  'is less than': '<', 'less than': '<',
  'is greater than or equal to': '\\geq', 'greater than or equal to': '\\geq',
  'is less than or equal to': '\\leq', 'less than or equal to': '\\leq',
  'is no less than': '\\geq', 'no less than': '\\geq',
  'is at least': '\\geq', 'at least': '\\geq',
  'is no greater than': '\\leq', 'no greater than': '\\leq',
  'is at most': '\\leq', 'at most': '\\leq',
}

function protect(latex: string, tokens: { latex: string; source: string }[], source: string) {
  const id = tokens.push({ latex, source }) - 1
  return `⟦${id}⟧`
}

export function parseMathNotes(input: string): NotePart[] {
  const tokens: { latex: string; source: string }[] = []
  let text = input

  const rule = (pattern: RegExp, make: (...groups: string[]) => string) => {
    text = text.replace(pattern, (match, ...args: string[]) => protect(make(...args), tokens, match))
  }

  rule(new RegExp(`\\b(?:the )?integral from (${scalarPattern}) to (${scalarPattern}) of ([a-z0-9 +\\-*/^]+?)\\s+(?:is defined as|is defined to be|to be)\\s+minus\\s+(?:the )?integral from (${scalarPattern}) to (${scalarPattern}) of ([a-z0-9 +\\-*/^]+?)(?:\\s+if\\s+(${scalarPattern})\\s+(?:is\\s+)?greater than\\s+(${scalarPattern}))?(?=[,.;]|$)`, 'gi'),
    (lower, upper, leftExpression, reverseLower, reverseUpper, rightExpression, conditionLeft, conditionRight) => {
      const identity = `\\int_{${value(lower)}}^{${value(upper)}} ${expressionValue(leftExpression)} = -\\int_{${value(reverseLower)}}^{${value(reverseUpper)}} ${expressionValue(rightExpression)}`
      return conditionLeft && conditionRight
        ? `${identity} \\quad \\text{if } ${value(conditionLeft)} > ${value(conditionRight)}`
        : identity
    })
  // Transcripts move bounds around and often insert pauses or a bare “is”.
  // Keep each statement together rather than creating math islands in prose.
  rule(new RegExp(`\\b(?:the )?(?:definite )?integral of (${arithmeticPattern})(?:\\s+d\\s*([a-z]))?\\s*,?\\s*from (${scalarPattern}) (?:up\\s+)?to (${scalarPattern})(?:\\s*,?\\s*(${calculusRelationPattern})\\s+(${arithmeticPattern}))?${expressionBoundaryPattern}`, 'gi'),
    (expression, variable, lower, upper, relation, result) => {
      const integral = `\\int_{${value(lower)}}^{${value(upper)}} ${expressionValue(expression)}${variable ? `\\,d${value(variable)}` : ''}`
      return relation && result ? `${integral} ${relations[relation.toLowerCase()]} ${expressionValue(result)}` : integral
    })
  rule(new RegExp(`\\b(?:the )?(?:definite )?integral of (${arithmeticPattern})(?:\\s+d\\s*([a-z]))?\\s*,?\\s*between (${scalarPattern}) and (${scalarPattern})(?:\\s*,?\\s*(${calculusRelationPattern})\\s+(${arithmeticPattern}))?${expressionBoundaryPattern}`, 'gi'),
    (expression, variable, lower, upper, relation, result) => {
      const integral = `\\int_{${value(lower)}}^{${value(upper)}} ${expressionValue(expression)}${variable ? `\\,d${value(variable)}` : ''}`
      return relation && result ? `${integral} ${relations[relation.toLowerCase()]} ${expressionValue(result)}` : integral
    })
  rule(new RegExp(`\\b(?:the )?(?:definite )?integral from (${scalarPattern}) (?:up\\s+)?to (${scalarPattern}) of (${arithmeticPattern})(?:\\s+d\\s*([a-z]))?(?:\\s*,?\\s*(${calculusRelationPattern})\\s+(${arithmeticPattern}))?${expressionBoundaryPattern}`, 'gi'),
    (lower, upper, expression, variable, relation, result) => {
      const integral = `\\int_{${value(lower)}}^{${value(upper)}} ${expressionValue(expression)}${variable ? `\\,d${value(variable)}` : ''}`
      return relation && result ? `${integral} ${relations[relation.toLowerCase()]} ${expressionValue(result)}` : integral
    })
  rule(new RegExp(`\\bintegrate (${arithmeticPattern})(?:\\s+with respect to\\s+([a-z]))?\\s+from (${scalarPattern}) (?:up\\s+)?to (${scalarPattern})(?:\\s*,?\\s*(${calculusRelationPattern})\\s+(${arithmeticPattern}))?${expressionBoundaryPattern}`, 'gi'),
    (expression, variable, lower, upper, relation, result) => {
      const integral = `\\int_{${value(lower)}}^{${value(upper)}} ${expressionValue(expression)}${variable ? `\\,d${value(variable)}` : ''}`
      return relation && result ? `${integral} ${relations[relation.toLowerCase()]} ${expressionValue(result)}` : integral
    })
  // A spoken differential is a hard boundary. Without this rule, later prose
  // such as “can be found as” can be swallowed into f(x) before a connector.
  rule(new RegExp(`\\b(?:the )?(?:definite )?integral from (${scalarPattern}) to (${scalarPattern}) of (${arithmeticPattern})\\s+d\\s*([a-z])\\b`, 'gi'),
    (lower, upper, expression, variable) => `\\int_{${value(lower)}}^{${value(upper)}} ${expressionValue(expression)}\\,d${value(variable)}`)
  rule(new RegExp(`\\b(?:the )?integral from (${scalarPattern}) to (${scalarPattern})(?: of ([a-z0-9 +\\-*/^]+?))?(?=\\s+(?:should|is|equal|equals|to be|plus|minus|and|but|if|with respect)|[,.;]|\\s*$)`, 'gi'),
    (lower, upper, expression) => `\\int_{${value(lower)}}^{${value(upper)}}${expression ? ` ${expressionValue(expression)}` : ''}`)
  rule(new RegExp(`\\b(?:the )?(?:indefinite integral|integral) of (${arithmeticPattern}|${integralLabelPattern})(?=\\s+with respect to\\s+([a-z])|\\s+(?:${relationPattern})\\s+|[,.;]|\\s*$)`, 'gi'),
    (expression, variable) => `\\int ${integralExpressionValue(expression)}${variable ? `\\,d${value(variable)}` : ''}`)
  rule(new RegExp(`\\b(?:the )?(?:sum|summation) of (${arithmeticPattern}) from ([a-z]) (?:equals|equal to|is) (${scalarPattern}) to (${scalarPattern})`, 'gi'),
    (expression, index, lower, upper) => `\\sum_{${value(index)}=${value(lower)}}^{${value(upper)}} ${expressionValue(expression)}`)
  rule(new RegExp(`\\b(?:the )?(?:sum|summation) from ([a-z]) (?:equals|equal to|is) (${scalarPattern}) to (${scalarPattern})(?: of ([a-z0-9 +\\-*/^]+))?`, 'gi'),
    (index, lower, upper, expression) => `\\sum_{${value(index)}=${value(lower)}}^{${value(upper)}}${expression ? ` ${expressionValue(expression)}` : ''}`)
  rule(new RegExp(`\\b(?:the )?product of (${arithmeticPattern}) from ([a-z]) (?:equals|equal to|is) (${scalarPattern}) to (${scalarPattern})`, 'gi'),
    (expression, index, lower, upper) => `\\prod_{${value(index)}=${value(lower)}}^{${value(upper)}} ${expressionValue(expression)}`)
  rule(new RegExp(`\\b(?:the )?product from ([a-z]) (?:equals|equal to|is) (${scalarPattern}) to (${scalarPattern})(?: of ([a-z0-9 +\\-*/^]+))?`, 'gi'),
    (index, lower, upper, expression) => `\\prod_{${value(index)}=${value(lower)}}^{${value(upper)}}${expression ? ` ${expressionValue(expression)}` : ''}`)
  rule(new RegExp(`\\b(?:the )?limit of (${arithmeticPattern}) as ([a-z]) (?:approaches|goes to|tends to) (${scalarPattern})`, 'gi'),
    (expression, variable, destination) => `\\lim_{${value(variable)} \\to ${value(destination)}} ${expressionValue(expression)}`)
  rule(new RegExp(`\\b(?:the )?limit as ([a-z]) (?:approaches|goes to|tends to) (${scalarPattern})(?: of ([a-z0-9 +\\-*/^]+))?`, 'gi'),
    (variable, destination, expression) => `\\lim_{${value(variable)} \\to ${value(destination)}}${expression ? ` ${expressionValue(expression)}` : ''}`)
  rule(new RegExp(`\\b(?:the )?second derivative of (${arithmeticPattern}) with respect to ([a-z])\\b`, 'gi'),
    (expression, variable) => derivativeExpressionValue(expression, variable, 2))
  rule(new RegExp(`\\b(?:the )?(?:partial derivative|partial) of (${arithmeticPattern}) with respect to ([a-z])\\b`, 'gi'),
    (expression, variable) => derivativeExpressionValue(expression, variable, 1, true))
  rule(new RegExp(`\\b(?:the )?(?:first )?derivative of (${arithmeticPattern}) with respect to ([a-z])\\b`, 'gi'),
    (expression, variable) => derivativeExpressionValue(expression, variable))
  rule(new RegExp(`\\bdifferentiate (${arithmeticPattern}) with respect to ([a-z])\\b`, 'gi'),
    (expression, variable) => derivativeExpressionValue(expression, variable))

  // Parse complete arithmetic statements after calculus constructs have been
  // protected, so “sum from i equals…” is not mistaken for the equation i = 1.
  rule(new RegExp(`\\b(${arithmeticPattern})\\s+(${relationPattern})\\s+(${arithmeticPattern})\\b`, 'gi'),
    (left, relation, right) => `${expressionValue(left)} ${relations[relation.toLowerCase()]} ${expressionValue(right)}`)

  rule(new RegExp(`\\b(${rootPattern}|${absolutePattern}|${fractionPattern}|${functionPattern}|${poweredAtomPattern}\\s+factorial)\\b`, 'gi'),
    (expression) => expressionValue(expression))
  rule(new RegExp(`\\blog(?:arithm)? base (${scalarPattern}) of (${scalarPattern})\\b`, 'gi'),
    (base, argument) => `\\log_{${value(base)}}\\left(${value(argument)}\\right)`)
  rule(/\b([a-z0-9]+) subscript ([a-z0-9]+)\b/gi, (base, subscript) => `${value(base)}_{${value(subscript)}}`)
  rule(/\bvector ([a-z])\b/gi, (name) => `\\vec{${value(name)}}`)

  // A recognized construct can safely absorb a natural relation and a raw
  // right-hand expression. This makes adjacent math elastic without treating
  // every conversational “is” as an equals sign.
  text = text.replace(new RegExp(`(⟦\\d+⟧)(\\s+)(${calculusRelationPattern})(\\s+)(${arithmeticPattern})${expressionBoundaryPattern}`, 'gi'),
    (_match, left, before, relation, after, right) => `${left}${before}${protect(relations[relation.toLowerCase()], tokens, relation)}${after}${protect(expressionValue(right), tokens, right)}`)

  // Connect already-recognized expressions, but leave conversational words
  // such as “move that minus over” untouched.
  const connector = (phrase: RegExp, latex: string) => {
    text = text.replace(new RegExp(`(⟦\\d+⟧)(\\s+)(${phrase.source})(\\s+)(?=⟦\\d+⟧)`, 'gi'),
      (_match, left, before, source, after) => `${left}${before}${protect(latex, tokens, source)}${after}`)
  }
  connector(/is greater than or equal to|greater than or equal to/, '\\geq')
  connector(/is less than or equal to|less than or equal to/, '\\leq')
  connector(/is not equal to|does not equal|not equal to/, '\\neq')
  connector(/is approximately equal to|approximately equals/, '\\approx')
  connector(/can be found as|is given by/, '=')
  connector(/should be equal to|should equal|is equal to|equal to|evaluates to|results in|gives us|gives|equals/, '=')
  connector(/is no less than|no less than|is at least|at least/, '\\geq')
  connector(/is no greater than|no greater than|is at most|at most/, '\\leq')
  connector(/plus or minus/, '\\pm')
  connector(/multiplied by|times/, '\\times')
  connector(/divided by/, '\\div')
  connector(/plus/, '+')
  connector(/minus/, '-')
  connector(/is greater than|greater than/, '>')
  connector(/is less than|less than/, '<')

  text = text.replace(new RegExp(`\\b(${greekNames})\\b`, 'gi'),
    (name) => protect(greek[name.toLowerCase()], tokens, name))

  const parts: NotePart[] = []
  const marker = /⟦(\d+)⟧/g
  let cursor = 0
  for (const match of text.matchAll(marker)) {
    const index = match.index ?? 0
    if (index > cursor) parts.push({ type: 'text', value: text.slice(cursor, index) })
    const token = tokens[Number(match[1])]
    parts.push({ type: 'math', value: token.latex, source: token.source })
    cursor = index + match[0].length
  }
  if (cursor < text.length) parts.push({ type: 'text', value: text.slice(cursor) })
  return groupMathRuns(parts)
}

function groupMathRuns(parts: NotePart[]): NotePart[] {
  const grouped: NotePart[] = []
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index]
    if (part.type !== 'math') {
      grouped.push(part)
      continue
    }

    let latex = part.value
    let source = part.source
    while (
      index + 2 < parts.length
      && parts[index + 1].type === 'text'
      && /^\s+$/.test(parts[index + 1].value)
      && parts[index + 2].type === 'math'
    ) {
      const spacing = parts[index + 1].value
      const next = parts[index + 2]
      if (next.type !== 'math') break
      latex += ` ${next.value}`
      source += spacing + next.source
      index += 2
    }
    grouped.push({ type: 'math', value: latex, source })
  }
  return grouped
}

export function toMarkdown(parts: NotePart[]) {
  return parts.map((part) => part.type === 'math' ? `$${part.value}$` : part.value).join('')
}

export const examples = [
  {
    label: 'Integral identity',
    text: 'So we swap that and get the integral from a to c should be equal to the integral from a to b minus the integral from c to b, but then if we move that minus over, we have the integral from a to c plus the integral from c to b should be equal to the integral from a to b, which it is.',
  },
  {
    label: 'Limits & powers',
    text: 'The limit as x approaches infinity of one over x equals zero. Meanwhile, x squared plus y squared equals z squared.',
  },
  {
    label: 'Greek & calculus',
    text: 'The derivative of theta with respect to x equals alpha times x cubed plus beta, and the square root of gamma squared is gamma.',
  },
]
