import assert from 'node:assert/strict'
import { executeB2BUltraCommand } from '../../lib/browser-extension/b2b-ultra/service'

const ACCOUNT_ID = '11111111-1111-4111-8111-111111111111'
const USER_ID = '22222222-2222-4222-8222-222222222222'
const DEVICE_ID = '33333333-3333-4333-8333-333333333333'
const CONTACT_ID = '44444444-4444-4444-8444-444444444444'

function like(value: unknown, pattern: string) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')
  return new RegExp(`^${escaped}$`, 'i').test(String(value ?? ''))
}

class Query implements PromiseLike<any> {
  private action: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select'
  private filters: Array<(row: any) => boolean> = []
  private limitCount: number | null = null
  private payload: any = null
  private ordering: Array<{ field: string; asc: boolean }> = []
  private returnMode: 'many' | 'single' | 'maybeSingle' = 'many'

  constructor(private db: FakeDb, private table: string) {}
  select(_fields = '*', _options?: any) { return this }
  insert(payload: any) { this.action = 'insert'; this.payload = payload; return this }
  upsert(payload: any, options?: any) { this.action = 'upsert'; this.payload = payload; (this as any).upsertOptions = options; return this }
  update(payload: any) { this.action = 'update'; this.payload = payload; return this }
  delete() { this.action = 'delete'; return this }
  eq(field: string, value: any) { this.filters.push((row) => String(row[field] ?? '') === String(value ?? '')); return this }
  is(field: string, value: any) { this.filters.push((row) => row[field] === value); return this }
  in(field: string, values: any[]) { const set = new Set(values.map(String)); this.filters.push((row) => set.has(String(row[field]))); return this }
  ilike(field: string, pattern: string) { this.filters.push((row) => like(row[field], pattern)); return this }
  lte(field: string, value: any) { this.filters.push((row) => String(row[field] ?? '') <= String(value ?? '')); return this }
  order(field: string, options?: { ascending?: boolean }) { this.ordering.push({ field, asc: options?.ascending !== false }); return this }
  limit(value: number) { this.limitCount = value; return this }
  single() { this.returnMode = 'single'; return this.execute() }
  maybeSingle() { this.returnMode = 'maybeSingle'; return this.execute() }
  then<TResult1 = any, TResult2 = never>(onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }

  private matched() {
    let rows = [...(this.db.tables[this.table] || [])].filter((row) => this.filters.every((filter) => filter(row)))
    for (const order of [...this.ordering].reverse()) rows.sort((a, b) => String(a[order.field] ?? '').localeCompare(String(b[order.field] ?? '')) * (order.asc ? 1 : -1))
    if (this.limitCount !== null) rows = rows.slice(0, this.limitCount)
    return rows
  }

  private async execute() {
    const table = this.db.tables[this.table] ||= []
    let rows: any[] = []
    if (this.action === 'select') rows = this.matched()
    if (this.action === 'insert') {
      const input = Array.isArray(this.payload) ? this.payload : [this.payload]
      rows = input.map((row, index) => ({ id: row.id || `${this.table}-${table.length + index + 1}`, ...row }))
      table.push(...rows)
    }
    if (this.action === 'upsert') {
      const input = Array.isArray(this.payload) ? this.payload : [this.payload]
      const conflict = String((this as any).upsertOptions?.onConflict || '').split(',').filter(Boolean)
      rows = input.map((row) => {
        const found = table.find((candidate) => conflict.length && conflict.every((field) => String(candidate[field]) === String(row[field])))
        if (found) { Object.assign(found, row); return found }
        const created = { id: row.id || `${this.table}-${table.length + 1}`, ...row }; table.push(created); return created
      })
    }
    if (this.action === 'update') {
      rows = this.matched(); for (const row of rows) Object.assign(row, this.payload)
    }
    if (this.action === 'delete') {
      rows = this.matched(); this.db.tables[this.table] = table.filter((row) => !rows.includes(row))
    }
    const data = this.returnMode === 'single' ? (rows[0] ?? null) : this.returnMode === 'maybeSingle' ? (rows[0] ?? null) : rows
    return { data, error: null }
  }
}

class FakeDb {
  tables: Record<string, any[]> = {
    b2b_prospects: [{ id: ACCOUNT_ID, name: 'Atlas Hospitality', website: 'https://atlas.example', city: 'Rabat', sector: 'hospitality', assigned_owner_id: USER_ID, status: 'active', archived_at: null, updated_at: '2026-07-21T00:00:00Z' }],
    b2b_contacts: [{ id: CONTACT_ID, prospect_id: ACCOUNT_ID, name: 'Nadia Buyer', role: 'Directrice achats', email: 'nadia@atlas.example', created_at: '2026-07-21T00:00:00Z' }],
    browser_extension_b2b_evidence: [{ id: 'evidence-1', prospect_id: ACCOUNT_ID, evidence_type: 'website', observed_value: 'Family resort in Rabat', source_url: 'https://atlas.example', confidence: 0.95, validation_status: 'verified', created_at: '2026-07-21T00:00:00Z' }],
    browser_extension_b2b_buying_committee: [],
    browser_extension_b2b_opportunities: [],
    browser_extension_ultra_commercial_id_map: [],
    browser_extension_ultra_contexts: [],
    browser_extension_ultra_ai_runs: [],
    browser_extension_ultra_scheduler_control: [{ singleton: true, paused: true, kill_switch: false, reason: 'regression fixture' }],
    browser_extension_ultra_schedules: [], browser_extension_ultra_jobs: [], browser_extension_ultra_job_runs: [],
  }
  from(table: string) { return new Query(this, table) }
  async rpc(name: string) {
    if (name === 'browser_extension_ultra_enqueue_due_schedules') return { data: 0, error: null }
    if (name === 'browser_extension_ultra_claim_jobs') return { data: [], error: null }
    return { data: null, error: { message: `Unknown RPC ${name}` } }
  }
}

async function main() {
  delete process.env.BROWSER_REVENUE_AI_ENABLED
  delete process.env.BROWSER_REVENUE_AI_ENDPOINT
  delete process.env.BROWSER_REVENUE_AI_API_KEY
  const db = new FakeDb()
  const base = { db, actor: { id: USER_ID }, device: { id: DEVICE_ID }, access: { scopes: [{ scope_type: 'all' }] }, payload: {} }

  const launch: any = await executeB2BUltraCommand({ ...base, commandKey: 'b2b.ultra.launchpad.read', payload: { query: 'Nadia Buyer' } })
  assert.equal(launch.accounts.length, 1, 'launchpad must search bridged contact context')
  assert.equal(launch.accounts[0].prospectId, ACCOUNT_ID)

  const set: any = await executeB2BUltraCommand({ ...base, commandKey: 'b2b.ultra.context.set', payload: { activeAccountId: ACCOUNT_ID, activeContactId: CONTACT_ID, sourceUrl: 'https://atlas.example', sourceAdapter: 'generic_web' } })
  assert.equal(set.context.active_account_id, ACCOUNT_ID)
  const read: any = await executeB2BUltraCommand({ ...base, commandKey: 'b2b.ultra.context.read', payload: {} })
  assert.equal(read.context.active_contact_id, CONTACT_ID, 'server context must survive a separate command')

  const ai: any = await executeB2BUltraCommand({ ...base, commandKey: 'b2b.ultra.ai.reason', payload: { prospectId: ACCOUNT_ID, objective: 'next action' } })
  assert.equal(ai.result.mode, 'rules_fallback')
  assert.equal(ai.result.used, false)
  assert.match(String(ai.result.warning), /unavailable|disabled/i)
  assert.equal(db.tables.browser_extension_ultra_ai_runs.length, 1, 'truthful AI fallback must still be persisted and audited by the Gateway')

  await assert.rejects(
    () => executeB2BUltraCommand({ ...base, commandKey: 'b2b.ultra.scheduler.enqueue', payload: { jobType: 'external_message', idempotencyKey: 'forbidden' } }),
    /UNSUPPORTED_OR_HIGH_RISK_JOB_TYPE/,
  )
  const scheduler: any = await executeB2BUltraCommand({ ...base, commandKey: 'b2b.ultra.scheduler.tick', payload: {} })
  assert.equal(scheduler.blocked, true, 'paused scheduler must not claim jobs')

  console.log(JSON.stringify({ ok: true, checks: ['launchpad-contact-search','server-context-persistence','truthful-ai-fallback','high-risk-automation-block','scheduler-pause-lock'] }, null, 2))
}

main().catch((error) => { console.error(error); process.exit(1) })
