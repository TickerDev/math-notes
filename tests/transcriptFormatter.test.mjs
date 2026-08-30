import assert from 'node:assert/strict'
import test from 'node:test'
import { beautifyTranscript, splitSpeakerLabels } from '../src/transcriptFormatter.ts'

test('removes redundant labels when the same speaker continues', () => {
  const input = "Arne Ledet: It's the limit of one thing, and the limit of another thing, and another thing—\n\nArne Ledet:  I mean, the limits must similarly lie above each other in the same way."
  assert.equal(beautifyTranscript(input), "Arne Ledet: It's the limit of one thing, and the limit of another thing, and another thing— I mean, the limits must similarly lie above each other in the same way.")
})

test('repairs blank holes left by a previously removed repeated label', () => {
  const input = "Arne Ledet: It's the limit of one thing—\n\n\nI mean, the limits must similarly lie above each other."
  assert.equal(
    beautifyTranscript(input),
    "Arne Ledet: It's the limit of one thing— I mean, the limits must similarly lie above each other.",
  )
})

test('finds a speaker label even when transcription spacing is missing', () => {
  assert.equal(
    beautifyTranscript('The formatting is a little offArne Ledet:  Start here.'),
    'The formatting is a little off\n\nArne Ledet: Start here.',
  )
})

test('supports multiple speakers and leaves non-name headings alone', () => {
  const input = 'Definition of Limit: Keep this heading. Arne Ledet: First. Jane Smith: Second.'
  assert.equal(
    beautifyTranscript(input),
    'Definition of Limit: Keep this heading.\n\nArne Ledet: First.\n\nJane Smith: Second.',
  )
})

test('keeps a speaker label when the conversation returns to them', () => {
  const input = 'Arne Ledet: First. Arne Ledet: Still first. Jane Smith: Second. Arne Ledet: Back again.'
  assert.equal(
    beautifyTranscript(input),
    'Arne Ledet: First. Still first.\n\nJane Smith: Second.\n\nArne Ledet: Back again.',
  )
})

test('beautifying an already formatted transcript is idempotent', () => {
  const formatted = 'Arne Ledet: First paragraph.\n\nJane Smith: Second paragraph.'
  assert.equal(beautifyTranscript(formatted), formatted)
})

test('splits speaker labels for visual treatment', () => {
  assert.deepEqual(splitSpeakerLabels('Arne Ledet: Begin.'), [
    { type: 'speaker', value: 'Arne Ledet:' },
    { type: 'text', value: ' Begin.' },
  ])
})
