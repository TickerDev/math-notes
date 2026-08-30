import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'

async function migrationSource() {
  const directory = new URL('../supabase/migrations/', import.meta.url)
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort()
  return (await Promise.all(files.map((file) => readFile(new URL(file, directory), 'utf8')))).join('\n')
}

test('documents remain protected by owner-scoped row level security', async () => {
  const sql = await migrationSource()

  assert.match(sql, /alter table public\.documents enable row level security/i)
  assert.match(sql, /for insert\s+to authenticated\s+with check \(\(select auth\.uid\(\)\) = user_id\)/i)
  assert.match(sql, /for update\s+to authenticated\s+using \(\(select auth\.uid\(\)\) = user_id\)\s+with check \(\(select auth\.uid\(\)\) = user_id\)/i)
  assert.match(sql, /for delete\s+to authenticated\s+using \(\(select auth\.uid\(\)\) = user_id\)/i)
  assert.doesNotMatch(sql, /for (?:select|insert|update|delete|all)[\s\S]{0,100}using\s*\(\s*true\s*\)/i)
})

test('anonymous document access is read-only and column-limited', async () => {
  const sql = await migrationSource()

  assert.match(sql, /revoke all on table public\.documents from anon/i)
  assert.match(sql, /grant select \(title, content, updated_at\) on table public\.documents to anon/i)
  assert.doesNotMatch(sql, /grant\s+(?:insert|update|delete|all)[^;]*\bto anon\b/i)
})

test('browser environment variables cannot request a Supabase secret role', async () => {
  const source = await readFile(new URL('../src/lib/supabase.ts', import.meta.url), 'utf8')
  const example = await readFile(new URL('../.env.example', import.meta.url), 'utf8')

  assert.doesNotMatch(`${source}\n${example}`, /service[_-]?role|secret[_-]?key/i)
  assert.match(example, /^VITE_SUPABASE_PUBLISHABLE_KEY=/m)
})
