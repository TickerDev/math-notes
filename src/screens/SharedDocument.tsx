import { useEffect, useMemo, useState } from 'react'
import { FileText, Link2, LoaderCircle } from 'lucide-react'
import { Brand } from '../components/Brand'
import { DocumentContent } from '../components/DocumentContent'
import { formatDate } from '../lib/format'
import { createSharedDocumentClient } from '../lib/supabase'
import { parseMathNotes } from '../mathParser'
import type { SharedDocumentRow } from '../types'

export function SharedDocument({ token }: { token: string }) {
  const [sharedDocument, setSharedDocument] = useState<SharedDocumentRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadSharedDocument() {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
        setUnavailable(true)
        setLoading(false)
        return
      }
      const client = createSharedDocumentClient(token)
      const { data, error } = await client.from('documents').select('title, content, updated_at').limit(1).maybeSingle()
      if (cancelled) return
      setSharedDocument(data)
      setUnavailable(Boolean(error) || !data)
      setLoading(false)
    }

    void loadSharedDocument()
    return () => { cancelled = true }
  }, [token])

  const parts = useMemo(() => parseMathNotes(sharedDocument?.content ?? ''), [sharedDocument?.content])

  return (
    <main className="shared-shell">
      <header className="shared-header"><Brand /><span><Link2 size={14} /> Read-only shared note</span><a href="/">Make your own</a></header>
      {loading ? (
        <section className="shared-status" aria-live="polite"><LoaderCircle className="spin" /><p>Opening the shared note…</p></section>
      ) : unavailable || !sharedDocument ? (
        <section className="shared-status shared-unavailable">
          <FileText size={34} strokeWidth={1.3} />
          <h1>This shared note is unavailable</h1>
          <p>The owner may have stopped sharing it, or the link may be incomplete.</p>
          <a href="/">Go to Mathnotes</a>
        </section>
      ) : (
        <section className="shared-document-wrap">
          <div className="shared-title">
            <div><span>Shared document</span><h1>{sharedDocument.title}</h1></div>
            <p>Last edited {formatDate(sharedDocument.updated_at)}</p>
          </div>
          <article className="writing-page shared-writing-page" aria-label={sharedDocument.title}>
            <div className="shared-document-content"><DocumentContent parts={parts} /></div>
            <footer className="page-footer">
              <span>{sharedDocument.content.trim() ? sharedDocument.content.trim().split(/\s+/).length : 0} words</span>
              <span>Read only</span>
            </footer>
          </article>
        </section>
      )}
    </main>
  )
}
