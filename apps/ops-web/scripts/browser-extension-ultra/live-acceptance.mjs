import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const required = ['ULTRA_LIVE_BASE_URL','ULTRA_LIVE_ACCESS_TOKEN','ULTRA_LIVE_DEVICE_ID','ULTRA_LIVE_TARGET_URL','ULTRA_LIVE_SCENARIO_PATH','ULTRA_LIVE_SUPABASE_URL','ULTRA_LIVE_SUPABASE_SERVICE_KEY']
const missing = required.filter((key) => !process.env[key])
const evidencePath = path.resolve(process.env.ULTRA_LIVE_EVIDENCE_PATH || 'browser-extension-ultra-live-evidence.json')
const write = (payload) => { fs.mkdirSync(path.dirname(evidencePath), { recursive: true }); fs.writeFileSync(evidencePath, JSON.stringify(payload, null, 2) + '\n'); console.log(JSON.stringify(payload, null, 2)) }
if (missing.length) {
  write({ status: 'NOT_RUN', reason: 'LIVE_ENVIRONMENT_NOT_CONFIGURED', missing, truthBoundary: 'No deployed browser/API/database acceptance was executed.' })
  process.exit(3)
}

const baseUrl = String(process.env.ULTRA_LIVE_BASE_URL).replace(/\/$/, '')
const extensionPath = path.resolve(process.env.ULTRA_LIVE_EXTENSION_PATH || '../revenue-browser-extension/dist')
const scenario = JSON.parse(fs.readFileSync(path.resolve(process.env.ULTRA_LIVE_SCENARIO_PATH), 'utf8'))
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'angelcare-ultra-live-'))
const evidence = { status: 'RUNNING', startedAt: new Date().toISOString(), baseUrl, targetUrl: process.env.ULTRA_LIVE_TARGET_URL, extensionPath, steps: [], database: {}, truthBoundary: 'Production-ready may be claimed only if every mandatory step and revocation denial passes.' }
const vars = { env: process.env }

function get(object, dotted) { return dotted.split('.').reduce((value, key) => value?.[key], object) }
function interpolate(value) {
  if (Array.isArray(value)) return value.map(interpolate)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, interpolate(item)]))
  if (typeof value !== 'string') return value
  const exact = value.match(/^\$\{([^}]+)\}$/)
  if (exact) return get(vars, exact[1])
  return value.replace(/\$\{([^}]+)\}/g, (_match, key) => String(get(vars, key) ?? ''))
}
function capture(result, captureMap = {}) { for (const [key, pointer] of Object.entries(captureMap)) vars[key] = get(result, pointer) }

let browser
try {
  if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) throw new Error(`EXTENSION_DIST_NOT_FOUND:${extensionPath}`)
  browser = await chromium.launchPersistentContext(profile, {
    headless: String(process.env.ULTRA_LIVE_HEADLESS || 'false') === 'true',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  })
  const worker = browser.serviceWorkers()[0] || await browser.waitForEvent('serviceworker', { timeout: 30000 })
  const extensionId = new URL(worker.url()).host
  evidence.extensionId = extensionId
  evidence.extensionVersion = await worker.evaluate(() => chrome.runtime.getManifest().version)
  if (evidence.extensionVersion !== '0.9.0') throw new Error(`WRONG_EXTENSION_VERSION:${evidence.extensionVersion}`)
  await worker.evaluate(async (session) => {
    await chrome.storage.local.set({ 'angelcare.extension.session': session })
  }, {
    apiBase: baseUrl,
    accessToken: process.env.ULTRA_LIVE_ACCESS_TOKEN,
    refreshToken: process.env.ULTRA_LIVE_REFRESH_TOKEN || 'live-acceptance-no-refresh',
    deviceId: process.env.ULTRA_LIVE_DEVICE_ID,
    expiresAt: process.env.ULTRA_LIVE_ACCESS_EXPIRES_AT || new Date(Date.now() + 3600000).toISOString(),
  })

  const target = await browser.newPage()
  await target.goto(process.env.ULTRA_LIVE_TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  const extensionPage = await browser.newPage()
  await extensionPage.goto(`chrome-extension://${extensionId}/sidepanel.html`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await extensionPage.waitForTimeout(1000)
  const extraction = await extensionPage.evaluate(async (targetUrl) => {
    const tabs = await chrome.tabs.query({})
    const tab = tabs.find((row) => row.url === targetUrl || row.url?.startsWith(targetUrl))
    if (!tab?.id) return { ok: false, error: 'TARGET_TAB_NOT_FOUND' }
    await chrome.tabs.update(tab.id, { active: true })
    return chrome.runtime.sendMessage({ type: 'CAPTURE_ACTIVE_CONTEXT' })
  }, process.env.ULTRA_LIVE_TARGET_URL)
  evidence.steps.push({ id: 'browser-context-extraction', ok: Boolean(extraction?.ok), result: extraction })
  if (!extraction?.ok) throw new Error(extraction?.error || 'BROWSER_CONTEXT_EXTRACTION_FAILED')
  vars.context = extraction.context

  const scan = await extensionPage.evaluate(async (context) => chrome.runtime.sendMessage({ type: 'SCANNER_QUICK_SCAN', context }), extraction.context)
  evidence.steps.push({ id: 'scanner-quick', ok: Boolean(scan?.ok), result: scan })
  if (!scan?.ok) throw new Error(scan?.error || 'SCANNER_QUICK_FAILED')
  vars.scan = scan.data
  capture(scan.data, scenario.scanCapture || {})

  const idempotencyKeys = []
  for (const raw of scenario.commands || []) {
    if (raw.enabled === false) continue
    const step = interpolate(raw)
    const idempotencyKey = step.idempotencyKey || `ultra-live:${scenario.fixtureKey || 'fixture'}:${step.id}:${Date.now()}`
    idempotencyKeys.push(idempotencyKey)
    const response = await extensionPage.evaluate(async (input) => chrome.runtime.sendMessage({ type: 'EXECUTE_B2B_COMMAND', input }), {
      commandKey: step.commandKey,
      idempotencyKey,
      sourceAdapter: step.sourceAdapter ?? extraction.context.adapterId,
      sourceOrigin: step.sourceOrigin ?? extraction.context.origin,
      targetType: step.targetType || null,
      targetId: step.targetId || null,
      payload: step.payload || {},
    })
    const record = { id: step.id, commandKey: step.commandKey, idempotencyKey, ok: Boolean(response?.ok), response }
    evidence.steps.push(record)
    if (!response?.ok && step.optional !== true) throw new Error(`${step.id}:${response?.error || 'COMMAND_FAILED'}`)
    vars[step.id] = response?.data?.result ?? response?.data ?? response
    capture(response?.data?.result ?? response?.data ?? response, step.capture || {})
  }

  const supabase = createClient(process.env.ULTRA_LIVE_SUPABASE_URL, process.env.ULTRA_LIVE_SUPABASE_SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: commands, error: commandError } = await supabase.from('browser_extension_command_requests').select('id,idempotency_key,command_key,execution_status,user_id,device_id,executed_at').in('idempotency_key', idempotencyKeys)
  if (commandError) throw new Error(`DATABASE_COMMAND_VERIFICATION_FAILED:${commandError.message}`)
  const { data: audits, error: auditError } = await supabase.from('browser_extension_audit_logs').select('id,command_key,event_type,result,actor_user_id,device_id,created_at').in('command_key', (scenario.commands || []).filter((row) => row.enabled !== false).map((row) => row.commandKey)).order('created_at', { ascending: false }).limit(1000)
  if (auditError) throw new Error(`DATABASE_AUDIT_VERIFICATION_FAILED:${auditError.message}`)
  evidence.database = { commandRequests: commands, audits, commandCountExpected: idempotencyKeys.length, commandCountFound: commands?.length || 0 }
  if ((commands?.length || 0) !== idempotencyKeys.length) throw new Error('DATABASE_COMMAND_PERSISTENCE_INCOMPLETE')
  for (const check of scenario.databaseChecks || []) {
    const query = supabase.from(check.table).select(check.select || '*').match(interpolate(check.match || {})).limit(check.limit || 20)
    const { data, error } = await query
    evidence.database[check.id] = { table: check.table, data, error: error?.message || null }
    if (error || (!check.allowEmpty && !(data || []).length)) throw new Error(`DATABASE_CHECK_FAILED:${check.id}:${error?.message || 'EMPTY'}`)
  }

  if (scenario.revocation?.enabled) {
    const revoke = interpolate(scenario.revocation)
    const response = await fetch(revoke.url, { method: revoke.method || 'POST', headers: revoke.headers || {}, body: revoke.body ? JSON.stringify(revoke.body) : undefined })
    const body = await response.json().catch(() => ({}))
    evidence.steps.push({ id: 'device-revocation', ok: response.ok, status: response.status, body })
    if (!response.ok) throw new Error(`DEVICE_REVOCATION_FAILED:${response.status}`)
    const denied = await extensionPage.evaluate(async () => chrome.runtime.sendMessage({ type: 'EXECUTE_B2B_COMMAND', input: { commandKey: 'b2b.ultra.launchpad.read', idempotencyKey: `post-revoke:${crypto.randomUUID()}`, payload: {} } }))
    evidence.steps.push({ id: 'post-revocation-command-denial', ok: !denied?.ok, response: denied })
    if (denied?.ok) throw new Error('REVOKED_DEVICE_COMMAND_WAS_NOT_DENIED')
  } else {
    evidence.steps.push({ id: 'device-revocation', ok: false, status: 'NOT_RUN', reason: 'Scenario did not provide an authenticated revocation action.' })
  }

  evidence.status = evidence.steps.every((step) => step.ok) ? 'PASSED' : 'PARTIAL'
  evidence.completedAt = new Date().toISOString()
  write(evidence)
  process.exit(evidence.status === 'PASSED' ? 0 : 2)
} catch (error) {
  evidence.status = 'FAILED'
  evidence.error = error instanceof Error ? error.message : String(error)
  evidence.completedAt = new Date().toISOString()
  write(evidence)
  process.exitCode = 1
} finally {
  await browser?.close().catch(() => undefined)
  fs.rmSync(profile, { recursive: true, force: true })
}
