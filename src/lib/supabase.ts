import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Supabase environment variables are missing.')
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey)

export function createSharedDocumentClient(token: string) {
  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    global: { headers: { 'x-share-token': token } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
