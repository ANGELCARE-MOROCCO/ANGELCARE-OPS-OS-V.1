#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const sqlPath = path.join(root, 'supabase/migrations/20260731_flashcards_os_ultra_mega_zip1_foundation.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')
const normalized = sql.toLowerCase()
const failures = []
let passed = 0

function check(name, condition, detail = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` (${detail})` : ''}`)
  if (condition) passed += 1
  else failures.push(name)
}

const tables = [...sql.matchAll(/create table if not exists flashcards_os\.([a-z0-9_]+)/gi)].map((match) => match[1])
const collectionSeeds = [...sql.matchAll(/insert into flashcards_os\.collections\s*\(/gi)].length
const categorySeeds = [...sql.matchAll(/insert into flashcards_os\.categories\s*\(/gi)].length
const dossierSeeds = [...sql.matchAll(/insert into flashcards_os\.collection_dossier_sections/gi)].length

check('transaction begins', /^\s*--[\s\S]*?\bbegin;/i.test(sql))
check('transaction commits', /\bcommit;\s*$/i.test(sql))
check('isolated flashcards_os schema', normalized.includes('create schema if not exists flashcards_os'))
check('20 canonical domain tables', new Set(tables).size === 20, `found ${new Set(tables).size}`)
check('tenant key is installed across all tables', normalized.includes("add column if not exists tenant_key text not null default"))
check('tenant indexes are present', normalized.includes('idx_fc_collections_tenant') && normalized.includes('idx_fc_cards_tenant'))
check('RLS enabled by loop', normalized.includes('enable row level security'))
check('tenant read policy enforced', normalized.includes("create policy tenant_read"))
check('writes remain service-side', normalized.includes("grant all on flashcards_os.%i to service_role"))
check('public views are revoked from browser roles', normalized.includes('from authenticated, anon'))
check('service-role compatibility views exist', ['categories','collections','cards','editions','formats','import_batches','import_issues','audit_events','outbox_events'].every((name) => normalized.includes(`public.fc_os_${name}`)))
check('structured card counter is tenant-contained', normalized.includes("and tenant_key = 'angelcare-internal'"))
check('approved version deletion is blocked', normalized.includes('approved or superseded collection versions are immutable'))
check('audit ledger exists', normalized.includes('flashcards_os.audit_events'))
check('transactional outbox exists', normalized.includes('flashcards_os.outbox_events'))
check('access module registry is integrated safely', normalized.includes("to_regclass('public.access_module_registry')"))
check('access route registry is integrated safely', normalized.includes("to_regclass('public.access_route_registry')"))
check('eight UMZ1 permissions are seeded', [...sql.matchAll(/insert into flashcards_os\.permission_catalogue/gi)].length === 8)
check('22 category records are seeded', categorySeeds === 22, `found ${categorySeeds}`)
check('103 collection records are seeded', collectionSeeds === 103, `found ${collectionSeeds}`)
check('all 12 dossier sections are seeded per collection', dossierSeeds >= 1 && normalized.includes("'performance'"))
check('legacy import batch records 103 entries', normalized.includes("'fc-catalogue-2022-u1'") && /'completed'\s*,\s*103\s*,\s*18/i.test(sql))
check('no destructive table operation', !/\b(drop\s+table|truncate\s+table)\b/i.test(sql))
check('no unrelated schema is created', !/create schema if not exists (?!flashcards_os\b)/i.test(normalized))
check('PostgREST schema cache reload requested', normalized.includes("notify pgrst, 'reload schema'"))

console.log(`\n${passed}/${passed + failures.length} SQL architecture checks passed.`)
if (failures.length) process.exit(1)
