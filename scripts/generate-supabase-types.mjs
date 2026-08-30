import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const target = process.argv[2]

if (target !== '--linked' && target !== '--local') {
  console.error('Usage: node scripts/generate-supabase-types.mjs --linked|--local')
  process.exit(1)
}

const outputPath = resolve('src/lib/database.types.ts')
const temporaryPath = `${outputPath}.tmp`
const supabaseExecutable = process.platform === 'win32' ? 'supabase.cmd' : 'supabase'
const result = spawnSync(
  supabaseExecutable,
  ['gen', 'types', 'typescript', target, '--schema', 'public'],
  { encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] },
)

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

mkdirSync(dirname(outputPath), { recursive: true })

try {
  writeFileSync(temporaryPath, result.stdout)
  renameSync(temporaryPath, outputPath)
} finally {
  rmSync(temporaryPath, { force: true })
}

console.log(`Generated ${outputPath}`)
