import { useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { ArrowLeft, Check, Clipboard, Download, Eraser, Link2, LoaderCircle, Share2, Sparkles, Unlink, X } from 'lucide-react'
import { AccountMenu } from '../components/AccountMenu'
import { Brand } from '../components/Brand'
import { LiveMathDocument } from '../components/LiveMathDocument'
import { slugify } from '../lib/format'
import { supabase } from '../lib/supabase'
import { examples, parseMathNotes, toMarkdown } from '../mathParser'
import { beautifyTranscript } from '../transcriptFormatter'
import type { DocumentRow, DocumentUpdates, SaveState } from '../types'

type EditorProps = {
  document: DocumentRow
  user: User
  onBack: () => void
  onChange: (updates: DocumentUpdates) => void
  onSignOut: () => void
}

export function Editor({ document, user, onBack, onChange, onSignOut }: EditorProps) {
  const [title, setTitle] = useState(document.title)
  const [content, setContent] = useState(document.content)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [shareOpen, setShareOpen] = useState(false)
  const [shareState, setShareState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle')
  const saveTimer = useRef<number | undefined>(undefined)
  const copyTimer = useRef<number | undefined>(undefined)
  const onChangeRef = useRef(onChange)
  const parts = useMemo(() => parseMathNotes(content), [content])
  const markdown = useMemo(() => toMarkdown(parts), [parts])
  const expressionCount = parts.filter((part) => part.type === 'math').length
  const shareLink = document.share_token ? `${window.location.origin}/?share=${document.share_token}` : ''

  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => {
    window.clearTimeout(saveTimer.current)
    if (title === document.title && content === document.content) return
    saveTimer.current = window.setTimeout(async () => {
      const cleanTitle = title.trim() || 'Untitled document'
      const { error } = await supabase.from('documents').update({ title: cleanTitle, content, updated_at: new Date().toISOString() }).eq('id', document.id)
      if (error) setSaveState('error')
      else {
        setSaveState('saved')
        onChangeRef.current({ title: cleanTitle, content })
      }
    }, 700)
    return () => window.clearTimeout(saveTimer.current)
  }, [title, content, document.id, document.title, document.content])

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopyState('copied')
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopyState('idle'), 1600)
    } catch {
      setCopyState('error')
    }
  }

  function beautify() {
    const formatted = beautifyTranscript(content)
    if (formatted === content) return
    setContent(formatted)
    setSaveState('saving')
  }

  function download() {
    const blob = new Blob([`# ${title.trim() || 'Untitled document'}\n\n${markdown}\n`], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `${slugify(title || 'math-notes')}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function startSharing() {
    setShareState('loading')
    window.clearTimeout(saveTimer.current)
    const shareToken = crypto.randomUUID()
    const sharedAt = new Date().toISOString()
    const cleanTitle = title.trim() || 'Untitled document'
    const { error } = await supabase.from('documents').update({ title: cleanTitle, content, share_token: shareToken, shared_at: sharedAt, updated_at: sharedAt }).eq('id', document.id)
    if (error) {
      setShareState('error')
      return
    }
    setSaveState('saved')
    setShareState('idle')
    onChangeRef.current({ title: cleanTitle, content, share_token: shareToken, shared_at: sharedAt })
  }

  async function stopSharing() {
    setShareState('loading')
    const { error } = await supabase.from('documents').update({ share_token: null, shared_at: null }).eq('id', document.id)
    if (error) {
      setShareState('error')
      return
    }
    setShareState('idle')
    onChangeRef.current({ share_token: null, shared_at: null })
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareLink)
      setShareState('copied')
      window.setTimeout(() => setShareState('idle'), 1600)
    } catch {
      setShareState('error')
    }
  }

  async function backToDocuments() {
    window.clearTimeout(saveTimer.current)
    if (title === document.title && content === document.content) {
      onBack()
      return
    }
    setSaveState('saving')
    const cleanTitle = title.trim() || 'Untitled document'
    const { error } = await supabase.from('documents').update({ title: cleanTitle, content, updated_at: new Date().toISOString() }).eq('id', document.id)
    if (error) {
      setSaveState('error')
      return
    }
    setSaveState('saved')
    onChangeRef.current({ title: cleanTitle, content })
    onBack()
  }

  return (
    <main className="editor-shell">
      <header className="editor-header">
        <button className="icon-button back-button" onClick={backToDocuments} aria-label="Back to documents"><ArrowLeft size={19} /></button>
        <Brand />
        <div className="document-title-wrap"><label className="sr-only" htmlFor="document-title">Document title</label><input id="document-title" value={title} maxLength={200} onChange={(event) => { setTitle(event.target.value); setSaveState('saving') }} /></div>
        <div className={`save-state ${saveState}`} role="status">
          {saveState === 'saving' ? <LoaderCircle className="spin" size={14} /> : saveState === 'saved' ? <Check size={14} /> : null}
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Could not save'}
        </div>
        <AccountMenu user={user} onSignOut={onSignOut} />
      </header>
      <div className="editor-toolbar">
        <span>Mathnotes editor</span>
        <div>
          {copyState === 'error' && <span className="clipboard-error" role="alert">Clipboard blocked. Export instead.</span>}
          <button className="beautify-button" onClick={beautify} disabled={!content.trim()} title="Format speaker turns and transcript spacing"><Sparkles size={15} /><span>Beautify</span></button>
          <div className="share-control">
            <button onClick={() => { setShareOpen(!shareOpen); setShareState('idle') }} aria-expanded={shareOpen}><Share2 size={15} /> Share</button>
            {shareOpen && (
              <section className="share-popover" aria-label="Share document">
                <div className="share-heading">
                  <div><Link2 size={17} /><span><strong>Read-only link</strong><small>Anyone with the link can view this note.</small></span></div>
                  <button className="share-close" onClick={() => setShareOpen(false)} aria-label="Close sharing"><X size={15} /></button>
                </div>
                {document.share_token ? (
                  <>
                    <label>Shareable link<input value={shareLink} readOnly onFocus={(event) => event.currentTarget.select()} /></label>
                    <div className="share-actions">
                      <button className="share-copy" onClick={copyShareLink} disabled={shareState === 'loading'}>{shareState === 'copied' ? <Check size={15} /> : <Clipboard size={15} />}{shareState === 'copied' ? 'Copied' : 'Copy link'}</button>
                      <button className="share-stop" onClick={stopSharing} disabled={shareState === 'loading'}><Unlink size={15} /> Stop sharing</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="share-explanation">Create a private, unguessable link. Visitors won’t need an account and cannot edit.</p>
                    <button className="share-create" onClick={startSharing} disabled={shareState === 'loading'}>{shareState === 'loading' ? <LoaderCircle className="spin" size={15} /> : <Link2 size={15} />} Create read-only link</button>
                  </>
                )}
                {shareState === 'error' && <p className="share-error" role="alert">Sharing could not be updated. Try again.</p>}
              </section>
            )}
          </div>
          <button onClick={copy} disabled={!content}>{copyState === 'copied' ? <Check size={15} /> : <Clipboard size={15} />} {copyState === 'copied' ? 'Copied' : 'Copy Markdown'}</button>
          <button onClick={download} disabled={!content}><Download size={15} /> Export</button>
        </div>
      </div>
      <section className="document-canvas" aria-label="Live math document">
        <div className="page-toolbar">
          <span><Sparkles size={14} /> {expressionCount} {expressionCount === 1 ? 'expression' : 'expressions'} interpreted</span>
          <button className="icon-button" onClick={() => { setContent(''); setSaveState('saving') }} disabled={!content} aria-label="Clear document"><Eraser size={16} /></button>
        </div>
        <article className="writing-page">
          <LiveMathDocument value={content} onChange={(next) => { setContent(next); setSaveState('saving') }} />
          <footer className="page-footer"><span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span><span>English becomes notation as you type</span></footer>
        </article>
      </section>
      <section className="editor-examples">
        <span>Need a starting point?</span>
        {examples.map((example) => <button key={example.label} onClick={() => { setContent(example.text); setSaveState('saving') }}>{example.label}</button>)}
      </section>
    </main>
  )
}
