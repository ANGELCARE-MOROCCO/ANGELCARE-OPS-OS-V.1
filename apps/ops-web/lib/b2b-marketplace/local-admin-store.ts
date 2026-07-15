import fs from 'fs'
import path from 'path'

export type LocalAdminRow = Record<string, any>

type LocalAdminStore = {
  version: number
  updatedAt: string
  tables: Record<string, LocalAdminRow[]>
}

const STORE_FILE = '.angelcare_b2b_marketplace_admin_store.json'

export function getLocalAdminStorePath() {
  return path.join(process.cwd(), STORE_FILE)
}

function ensureStore(): LocalAdminStore {
  const file = getLocalAdminStorePath()
  if (!fs.existsSync(file)) {
    return { version: 1, updatedAt: new Date().toISOString(), tables: {} }
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as LocalAdminStore
    return {
      version: Number(parsed.version || 1),
      updatedAt: String(parsed.updatedAt || new Date().toISOString()),
      tables: parsed.tables && typeof parsed.tables === 'object' ? parsed.tables : {},
    }
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), tables: {} }
  }
}

function writeStore(store: LocalAdminStore) {
  const file = getLocalAdminStorePath()
  const next = { ...store, version: 1, updatedAt: new Date().toISOString() }
  fs.writeFileSync(file, JSON.stringify(next, null, 2))
  return next
}

export function listLocalAdminRows(table: string): LocalAdminRow[] {
  const store = ensureStore()
  const rows = store.tables[table]
  return Array.isArray(rows) ? rows : []
}

export function getLocalAdminRow(table: string, field: string, value: string): LocalAdminRow | null {
  const rows = listLocalAdminRows(table)
  return rows.find((row) => String(row[field] ?? '') === value) || null
}

export function upsertLocalAdminRow(
  table: string,
  row: LocalAdminRow,
  options: { idField: string; keyField?: string; lookupField?: string; lookupValue?: string }
): LocalAdminRow {
  const store = ensureStore()
  const rows = Array.isArray(store.tables[table]) ? [...store.tables[table]] : []
  const keyField = options.keyField || options.idField
  const lookupField = options.lookupField || keyField
  const lookupValue = String(options.lookupValue || row[lookupField] || row[keyField] || row[options.idField] || '').trim()
  const generatedId = `${table}-${Date.now()}`
  const idValue = String(row[options.idField] || (lookupField === options.idField ? lookupValue : '') || generatedId)
  const keyValue = String(row[keyField] || (lookupField === keyField ? lookupValue : '') || idValue)

  const candidate = {
    ...row,
    [options.idField]: idValue,
    ...(keyField ? { [keyField]: keyValue } : {}),
    updated_at: new Date().toISOString(),
  }

  const index = rows.findIndex((existing) => {
    const sameId = String(existing[options.idField] ?? '') === idValue
    const sameKey = keyField ? String(existing[keyField] ?? '') === keyValue : false
    const sameLookup = lookupValue ? String(existing[lookupField] ?? '') === lookupValue : false
    return sameId || sameKey || sameLookup
  })

  if (index >= 0) rows[index] = { ...rows[index], ...candidate }
  else rows.push(candidate)

  store.tables[table] = rows
  writeStore(store)
  return index >= 0 ? rows[index] : candidate
}

export function deleteLocalAdminRow(table: string, field: string, value: string): boolean {
  const store = ensureStore()
  const rows = Array.isArray(store.tables[table]) ? store.tables[table] : []
  const before = rows.length
  store.tables[table] = rows.filter((row) => String(row[field] ?? '') !== value)
  writeStore(store)
  return store.tables[table].length !== before
}

export function getLocalAdminStoreSummary() {
  const store = ensureStore()
  return {
    path: getLocalAdminStorePath(),
    updatedAt: store.updatedAt,
    tables: Object.fromEntries(Object.entries(store.tables).map(([table, rows]) => [table, Array.isArray(rows) ? rows.length : 0])),
  }
}
