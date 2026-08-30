import katex from 'katex'
import type { NotePart } from '../mathParser'
import { splitSpeakerLabels } from '../transcriptFormatter'

export function MathPiece({ value }: { value: string }) {
  const html = katex.renderToString(value, { throwOnError: false })
  return <span className="math-piece" dangerouslySetInnerHTML={{ __html: html }} />
}

export function TextPiece({ value }: { value: string }) {
  return splitSpeakerLabels(value).map((part, index) => part.type === 'speaker'
    ? <span className="speaker-label" key={index}>{part.value}</span>
    : <span key={index}>{part.value}</span>)
}

export function DocumentContent({ parts, limit }: { parts: NotePart[]; limit?: number }) {
  const visibleParts = limit === undefined ? parts : parts.slice(0, limit)
  return visibleParts.map((part, index) => part.type === 'math'
    ? <MathPiece key={index} value={part.value} />
    : <TextPiece key={index} value={part.value} />)
}
