export type DocumentRow = {
  id: number
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  share_token: string | null
  shared_at: string | null
}

export type DocumentUpdates = Partial<Pick<DocumentRow, 'title' | 'content' | 'share_token' | 'shared_at'>>
export type SharedDocumentRow = Pick<DocumentRow, 'title' | 'content' | 'updated_at'>
export type SaveState = 'saved' | 'saving' | 'error'
