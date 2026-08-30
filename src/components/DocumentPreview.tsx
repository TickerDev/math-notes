import { parseMathNotes } from '../mathParser'
import type { DocumentRow } from '../types'
import { DocumentContent } from './DocumentContent'

export function DocumentPreview({ document }: { document: DocumentRow }) {
  const parts = parseMathNotes(document.content || 'Your math notes will appear here.')

  return (
    <div className="document-paper">
      <span className="paper-rule" />
      <p><DocumentContent parts={parts} limit={10} /></p>
    </div>
  )
}
