export type TranscriptPart =
  | { type: 'text'; value: string }
  | { type: 'speaker'; value: string }

// Two to four capitalized words followed by a colon is specific enough to
// recognize transcript speaker labels without treating headings such as
// “Definition of Limit:” as people.
const speakerLabelPattern = /([\p{Lu}][\p{L}\p{M}'’-]*(?:[ \t]+[\p{Lu}][\p{L}\p{M}'’-]*){1,3})[ \t]*:/gu

export function splitSpeakerLabels(input: string): TranscriptPart[] {
  const parts: TranscriptPart[] = []
  let cursor = 0

  for (const match of input.matchAll(speakerLabelPattern)) {
    const index = match.index ?? 0
    if (index > cursor) parts.push({ type: 'text', value: input.slice(cursor, index) })
    parts.push({ type: 'speaker', value: match[0] })
    cursor = index + match[0].length
  }

  if (cursor < input.length) parts.push({ type: 'text', value: input.slice(cursor) })
  return parts.length ? parts : [{ type: 'text', value: input }]
}

export function beautifyTranscript(input: string): string {
  const normalized = input.replace(/\r\n?/g, '\n')
  const matches = Array.from(normalized.matchAll(speakerLabelPattern))
  let formatted = ''
  let activeSpeaker = ''

  matches.forEach((match, index) => {
    const nextMatch = matches[index + 1]
    const speaker = match[1].replace(/[ \t]+/g, ' ')
    const speakerKey = speaker.toLocaleLowerCase()
    const bodyStart = (match.index ?? 0) + match[0].length
    const bodyEnd = nextMatch?.index ?? normalized.length
    const body = normalized.slice(bodyStart, bodyEnd).replace(/\s+/g, ' ').trim()

    if (index === 0) {
      const prefix = normalized.slice(0, match.index ?? 0).replace(/[ \t]+$/, '')
      if (prefix.trim()) formatted += `${prefix.replace(/\n*$/, '')}\n\n`
    }

    if (speakerKey !== activeSpeaker) {
      if (formatted.trim() && !formatted.endsWith('\n\n')) {
        formatted = `${formatted.replace(/\n*$/, '')}\n\n`
      }
      formatted += `${speaker}:`
      activeSpeaker = speakerKey
    } else {
      formatted = formatted.replace(/\s+$/, '')
    }

    if (body) formatted += ` ${body}`
  })

  if (matches.length === 0) {
    formatted = normalized
  }
  return formatted
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/[ \t]+([,.;!?])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
