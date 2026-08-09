#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const appRoot = path.resolve(process.argv[2] || process.cwd())
function loadEnv(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    process.env[match[1]] = value.replace(/\\n/g, '\n')
  }
}
for (const name of ['.env.local', '.env.production.local', '.env.production', '.env']) loadEnv(path.join(appRoot, name))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('FAIL — Supabase URL and SUPABASE_SERVICE_ROLE_KEY are required.')
  process.exit(2)
}
let module
try {
  const local = path.join(appRoot, 'node_modules', '@supabase', 'supabase-js', 'dist', 'main', 'index.js')
  module = fs.existsSync(local) ? await import(pathToFileURL(local)) : await import('@supabase/supabase-js')
} catch (error) {
  console.error('FAIL — @supabase/supabase-js is unavailable. Install app dependencies first.')
  console.error(error?.message || error)
  process.exit(2)
}
const db = module.createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const required = [
  'market_content_dossiers',
  'market_content_missions',
  'market_content_mission_tasks',
  'market_content_evidence',
  'market_content_templates',
  'market_content_notes',
  'market_content_compatibility_links',
]
let checks = 0
for (const table of required) {
  const result = await db.from(table).select('*', { count: 'exact', head: true })
  if (result.error) {
    console.error(`FAIL — ${table}: ${result.error.message}`)
    process.exit(1)
  }
  checks += 1
  console.log(`PASS — ${table} available · ${result.count ?? 0} row(s).`)
}
const links = await db.from('market_content_compatibility_links').select('legacy_system,legacy_entity,canonical_entity').limit(5)
if (links.error) throw links.error
checks += 1
console.log(`PASS — compatibility lineage ledger readable · ${links.data?.length || 0} sampled link(s).`)
console.log(`PASS — ${checks} canonical Content Command database availability checks passed.`)
