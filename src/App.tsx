import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { LoaderCircle } from 'lucide-react'
import { Brand } from './components/Brand'
import { supabase } from './lib/supabase'
import { AuthScreen } from './screens/AuthScreen'
import { Editor } from './screens/Editor'
import { Library } from './screens/Library'
import { SharedDocument } from './screens/SharedDocument'
import type { DocumentRow, DocumentUpdates } from './types'

function AuthenticatedApp() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState('')
  const [activeDocument, setActiveDocument] = useState<DocumentRow | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
      if (!session) {
        setDocuments([])
        setActiveDocument(null)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function loadDocuments() {
      await Promise.resolve()
      if (cancelled) return
      setDocumentsLoading(true)
      setDocumentsError('')
      const { data, error } = await supabase.from('documents').select('*').order('updated_at', { ascending: false })
      if (cancelled) return
      setDocuments(data ?? [])
      setDocumentsError(error?.message ?? '')
      setDocumentsLoading(false)
    }

    void loadDocuments()
    return () => { cancelled = true }
  }, [user])

  async function createDocument() {
    if (!user) return
    const { data, error } = await supabase.from('documents').insert({ user_id: user.id, title: 'Untitled document', content: '' }).select().single()
    if (error) {
      setDocumentsError(error.message)
      return
    }
    setDocuments((current) => [data, ...current])
    setActiveDocument(data)
  }

  async function deleteDocument(id: number) {
    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) {
      setDocumentsError(error.message)
      return
    }
    setDocuments((current) => current.filter((document) => document.id !== id))
  }

  function updateActiveDocument(updates: DocumentUpdates) {
    if (!activeDocument) return
    const updated = { ...activeDocument, ...updates, updated_at: new Date().toISOString() }
    setActiveDocument(updated)
    setDocuments((current) => current
      .map((document) => document.id === updated.id ? updated : document)
      .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)))
  }

  if (authLoading) {
    return <main className="boot-screen"><Brand /><LoaderCircle className="spin" /><span>Opening Mathnotes…</span></main>
  }
  if (!user) return <AuthScreen />
  if (activeDocument) {
    return (
      <Editor
        document={activeDocument}
        user={user}
        onBack={() => setActiveDocument(null)}
        onChange={updateActiveDocument}
        onSignOut={() => supabase.auth.signOut()}
      />
    )
  }
  return (
    <Library
      user={user}
      documents={documents}
      loading={documentsLoading}
      error={documentsError}
      onCreate={createDocument}
      onOpen={setActiveDocument}
      onDelete={deleteDocument}
      onSignOut={() => supabase.auth.signOut()}
    />
  )
}

export default function App() {
  const shareToken = new URLSearchParams(window.location.search).get('share')
  return shareToken ? <SharedDocument token={shareToken} /> : <AuthenticatedApp />
}
