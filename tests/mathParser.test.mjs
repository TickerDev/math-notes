import assert from 'node:assert/strict'
import test from 'node:test'
import { parseMathNotes } from '../src/mathParser.ts'

const math = (input) => parseMathNotes(input)
  .filter((part) => part.type === 'math')
  .map((part) => part.value)

test('parses function equations as a complete expression', () => {
  assert.deepEqual(math('f of x is equal to 3'), ['f\\left(x\\right) = 3'])
  assert.deepEqual(math('f of x equal to 3'), ['f\\left(x\\right) = 3'])
})

test('parses compound arithmetic and relations', () => {
  assert.deepEqual(math('x squared plus y squared equals z squared'), ['x^{2} + y^{2} = z^{2}'])
  assert.deepEqual(math('one over x is less than or equal to alpha'), ['\\frac{1}{x} \\leq \\alpha'])
  assert.deepEqual(math('sine of theta equals zero'), ['\\sin\\left(\\theta\\right) = 0'])
  assert.deepEqual(math('sine theta equals zero'), ['\\sin\\left(\\theta\\right) = 0'])
  assert.deepEqual(math('tangent inverse of x'), ['\\arctan\\left(x\\right)'])
  assert.deepEqual(math('tangent inverse x'), ['\\arctan\\left(x\\right)'])
  assert.deepEqual(math('inverse cosine of x'), ['\\arccos\\left(x\\right)'])
  assert.deepEqual(math('e to the minus t squared equals y'), ['e^{-t^{2}} = y'])
})

test('parses roots, logarithms, subscripts, and vectors', () => {
  assert.deepEqual(math('square root of x squared'), ['\\sqrt{x^{2}}'])
  assert.deepEqual(math('log base two of x'), ['\\log_{2}\\left(x\\right)'])
  assert.deepEqual(math('x subscript one'), ['x_{1}'])
  assert.deepEqual(math('vector v'), ['\\vec{v}'])
})

test('parses calculus with spoken bounds and expressions', () => {
  assert.deepEqual(math('integral from zero to two of f of x dx'), ['\\int_{0}^{2} f\\left(x\\right)\\,dx'])
  assert.deepEqual(math('the integral of f of x from 3 to 6 is seven'), ['\\int_{3}^{6} f\\left(x\\right) = 7'])
  assert.deepEqual(math('the integral of x squared dx from zero to two equals eight'), ['\\int_{0}^{2} x^{2}\\,dx = 8'])
  assert.deepEqual(math('integral from a to b of x squared dx, then continue'), ['\\int_{a}^{b} x^{2}\\,dx'])
  assert.deepEqual(math('integral from a to b of x square dx, then continue'), ['\\int_{a}^{b} x^{2}\\,dx'])
  assert.deepEqual(math('integral from zero to one of tangent inverse of x dx'), ['\\int_{0}^{1} \\arctan\\left(x\\right)\\,dx'])
  assert.deepEqual(math('integral from zero to pi of sine x dx'), ['\\int_{0}^{\\pi} \\sin\\left(x\\right)\\,dx'])
  assert.deepEqual(math('integral from zero to x of e to the minus t squared dt'), ['\\int_{0}^{x} e^{-t^{2}}\\,dt'])
  assert.deepEqual(math('the limit as x approaches infinity of one over x'), ['\\lim_{x \\to \\infty} \\frac{1}{x}'])
  assert.deepEqual(math('the sum from i equals one to ten of i squared'), ['\\sum_{i=1}^{10} i^{2}'])
  assert.deepEqual(math('the product from k equals one to five of k'), ['\\prod_{k=1}^{5} k'])
})

test('accepts elastic calculus word order and transcription pauses', () => {
  assert.deepEqual(math('the integral of f of x, from three to six, is seven'), ['\\int_{3}^{6} f\\left(x\\right) = 7'])
  assert.deepEqual(math('the integral of f of x between three and six equals seven'), ['\\int_{3}^{6} f\\left(x\\right) = 7'])
  assert.deepEqual(math('the integral from three up to six of f of x is seven'), ['\\int_{3}^{6} f\\left(x\\right) = 7'])
  assert.deepEqual(math('integrate x squared from zero to two'), ['\\int_{0}^{2} x^{2}'])
  assert.deepEqual(math('the limit of sine x over x as x approaches zero equals one'), ['\\lim_{x \\to 0} \\frac{\\sin\\left(x\\right)}{x} = 1'])
  assert.deepEqual(math('the sum of i squared from i equals one to ten'), ['\\sum_{i=1}^{10} i^{2}'])
  assert.deepEqual(math('the product of k from k equals one to five'), ['\\prod_{k=1}^{5} k'])
})

test('joins adjacent math through natural relation phrases', () => {
  assert.deepEqual(math('the derivative of x squared with respect to x equals two times x'), ['\\frac{d}{dx}\\left(x^{2}\\right) = 2 \\times x'])
  assert.deepEqual(math('sine x plus cosine x results in one'), ['\\sin\\left(x\\right) + \\cos\\left(x\\right) = 1'])
  assert.deepEqual(math('x is at most five'), ['x \\leq 5'])
  assert.deepEqual(math('x is no less than negative two'), ['x \\geq -2'])
})

test('parses ordinary and partial derivatives', () => {
  assert.deepEqual(math('the derivative of y with respect to x'), ['\\frac{dy}{dx}'])
  assert.deepEqual(math('the second derivative of y with respect to x'), ['\\frac{d^2y}{dx^2}'])
  assert.deepEqual(math('the partial derivative of f with respect to x'), ['\\frac{\\partial f}{\\partial x}'])
})

test('does not turn conversational operators into standalone symbols', () => {
  assert.deepEqual(math('move that minus over'), [])
  assert.deepEqual(math('draw a square around the answer'), [])
  assert.deepEqual(math('x is a positive function'), [])
  assert.deepEqual(math('the result is at least five minutes long'), [])
  const identity = parseMathNotes('the integral from a to b minus the integral from c to b, then move that minus over')
  assert.equal(identity.filter((part) => part.type === 'math').length, 1)
  assert.equal(identity.some((part) => part.type === 'math' && part.value === '\\int_{a}^{b} - \\int_{c}^{b}'), true)
  assert.equal(identity.some((part) => part.type === 'text' && part.value.includes('move that minus over')), true)
})

test('groups a complete identity into one semantic expression', () => {
  const result = parseMathNotes('the integral from a to c plus the integral from c to b should be equal to the integral from a to b')
  assert.deepEqual(result, [{
    type: 'math',
    value: '\\int_{a}^{c} + \\int_{c}^{b} = \\int_{a}^{b}',
    source: 'the integral from a to c plus the integral from c to b should be equal to the integral from a to b',
  }])
})

test('parses a reversed-bound integral definition with its condition', () => {
  const input = 'we are going to define the integral from A to B of F of X dx to be minus the integral from B to A of F of X dx if A is greater than B'
  assert.deepEqual(parseMathNotes(input), [
    { type: 'text', value: 'we are going to define ' },
    {
      type: 'math',
      value: '\\int_{a}^{b} f\\left(x\\right)\\,dx = -\\int_{b}^{a} f\\left(x\\right)\\,dx \\quad \\text{if } a > b',
      source: 'the integral from A to B of F of X dx to be minus the integral from B to A of F of X dx if A is greater than B',
    },
  ])
})

test('stops a definite integral at its differential before lecture prose', () => {
  const input = 'And next, if we have any anti-delimiting calc for G of F, then the definite integral from A to B of F of X dx can be found as calc for G of B minus calc for G of A for A and B in the interval.'
  const result = parseMathNotes(input)

  assert.equal(result.some((part) => part.type === 'math' && part.value.includes('dx can be found')), false)
  assert.equal(result.some((part) => part.type === 'math' && part.value === 'G\\left(f\\right)'), true)
  assert.equal(result.some((part) => part.type === 'math' && part.value === '\\int_{a}^{b} f\\left(x\\right)\\,dx = G\\left(b\\right) - G\\left(a\\right)'), true)
  assert.equal(result.some((part) => part.type === 'text' && part.value.includes('for A and B in the interval')), true)
})

test('stops an indefinite integral before an inequality in lecture prose', () => {
  const input = 'But the thing is that F of X is greater than or equal to the minimum value and less than or equal to the maximum value. So by rule 2 from the first slide, the integral of the minimum value is less than or equal to the integral of F, which is less than or equal to the integral of the maximum value.'
  const result = parseMathNotes(input)

  assert.equal(result.some((part) => part.type === 'math' && part.value.includes('equal^{integral')), false)
  assert.equal(result.some((part) => part.type === 'math' && part.value === '\\int \\text{minimum value} \\leq \\int f'), true)
  assert.equal(result.some((part) => part.type === 'math' && part.value === '\\int \\text{maximum value}'), true)
})
