import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { FilePlus2, FileText, Grid2X2, List, LoaderCircle, Plus, Search, Trash2 } from 'lucide-react'
import { AccountMenu } from '../components/AccountMenu'
import { Brand } from '../components/Brand'
import { DocumentPreview } from '../components/DocumentPreview'
import { formatDate } from '../lib/format'
import type { DocumentRow } from '../types'

type LibraryProps = {
  user: User
  documents: DocumentRow[]
  loading: boolean
  error: string
  onCreate: () => void
  onOpen: (document: DocumentRow) => void
  onDelete: (id: number) => void
  onSignOut: () => void
}

export function Library({ user, documents, loading, error, onCreate, onOpen, onDelete, onSignOut }: LibraryProps) {
  const [search, setSearch] = useState('')
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const filtered = documents.filter((document) => `${document.title} ${document.content}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <main className="library-shell">
      <header className="app-header">
        <Brand />
        <div className="library-search">
          <Search size={17} />
          <label className="sr-only" htmlFor="search-documents">Search documents</label>
          <input id="search-documents" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your documents" />
        </div>
        <AccountMenu user={user} onSignOut={onSignOut} />
      </header>
      <section className="library-intro">
        <div><h1>Your mathematical work</h1><p>Every proof, lecture, and half-finished idea—kept in one place.</p></div>
        <button className="primary-button" onClick={onCreate}><Plus size={18} /> New document</button>
      </section>
      <section className="new-document-strip">
        <button className="new-document-sheet" onClick={onCreate}>
          <FilePlus2 size={35} strokeWidth={1.25} />
          <span>Start a blank document</span>
          <small>Natural English → typeset math</small>
        </button>
        <div className="new-document-note"><span className="proof-mark">N</span><p>A clean page, ready for the next line of reasoning.</p></div>
      </section>
      <section className="documents-section">
        <div className="documents-toolbar">
          <div><h2>Recent documents</h2><span>{documents.length} {documents.length === 1 ? 'document' : 'documents'}</span></div>
          <div className="layout-toggle" aria-label="Document layout">
            <button className={layout === 'grid' ? 'active' : ''} onClick={() => setLayout('grid')} aria-label="Grid view"><Grid2X2 size={16} /></button>
            <button className={layout === 'list' ? 'active' : ''} onClick={() => setLayout('list')} aria-label="List view"><List size={17} /></button>
          </div>
        </div>
        {error && <div className="library-error" role="alert">{error} Refresh the page to try again.</div>}
        {loading ? (
          <div className="library-loading"><LoaderCircle className="spin" /><span>Gathering your documents…</span></div>
        ) : filtered.length === 0 ? (
          <div className="library-empty">
            <FileText size={34} strokeWidth={1.3} />
            <h3>{search ? 'No document matches that search' : 'Your first page is waiting'}</h3>
            <p>{search ? 'Try a different title or phrase.' : 'Create a document and start writing math the way you say it.'}</p>
            {!search && <button className="text-button" onClick={onCreate}>Create your first document →</button>}
          </div>
        ) : (
          <div className={`document-collection ${layout}`}>
            {filtered.map((document) => (
              <article className="document-item" key={document.id}>
                <button className="document-open" onClick={() => onOpen(document)} aria-label={`Open ${document.title}`}>
                  <DocumentPreview document={document} />
                  <span className="document-details"><strong>{document.title}</strong><small>Edited {formatDate(document.updated_at)}</small></span>
                </button>
                <div className="document-more">
                  {deleteId === document.id ? (
                    <div className="delete-confirm">
                      <span>Delete?</span>
                      <button onClick={() => { onDelete(document.id); setDeleteId(null) }}>Yes</button>
                      <button onClick={() => setDeleteId(null)}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteId(document.id)} aria-label={`Delete ${document.title}`} title="Delete document"><Trash2 size={15} /></button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
