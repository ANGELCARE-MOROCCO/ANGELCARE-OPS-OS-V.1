import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { executeB2BIntelligenceCommand } from '../b2b-intelligence/service'
import { filterByOwnership } from '../b2b-intelligence/scope'
import type { BrowserBusinessContext } from '../b2b-intelligence/types'
import { parseBusinessHtml, cleanText } from './html'
import { runConfiguredScannerAI } from './ai'
import type { ScannerContact, ScannerFact, ScannerMode, ScannerOpportunityHypothesis, ScannerPageExtraction, ScannerQuality, ScannerResult, ScannerSignal, ScannerSourcePage } from './types'

function now() { return new Date().toISOString() }
function scannerError(message: string, status = 400, details?: Record<string, unknown>) { return Object.assign(new Error(message), { status, details }) }
function dbError(prefix: string, error: any): never { console.error(prefix, error); throw scannerError(prefix, 500) }
function scopeRecord(access: any) { return Object.fromEntries((access?.scopes || []).map((row: any) => [row.scope_key, row.scope_value])) as Record<string, unknown> }
function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))) }
function unique<T>(values: T[], key: (value: T) => string) { return [...new Map(values.map((value) => [key(value), value])).values()] }

function privateIp(address: string) {
  if (address === '::1' || address === '0:0:0:0:0:0:0:1') return true
  if (/^(?:10|127)\./.test(address) || /^169\.254\./.test(address) || /^192\.168\./.test(address)) return true
  const match = address.match(/^172\.(\d+)\./)
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true
  if (/^(?:fc|fd|fe8|fe9|fea|feb)/i.test(address.replace(/:/g, ''))) return true
  return false
}

async function assertSafePublicUrl(url: URL, expectedOrigin?: string) {
  if (!['http:', 'https:'].includes(url.protocol)) throw scannerError('SCANNER_UNSUPPORTED_PROTOCOL')
  if (expectedOrigin && url.origin !== expectedOrigin) throw scannerError('SCANNER_CROSS_ORIGIN_BLOCKED')
  const hostname = url.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) throw scannerError('SCANNER_PRIVATE_HOST_BLOCKED')
  if (isIP(hostname) && privateIp(hostname)) throw scannerError('SCANNER_PRIVATE_IP_BLOCKED')
  const addresses = await lookup(hostname, { all: true, verbatim: true }).catch(() => [])
  if (!addresses.length) throw scannerError('SCANNER_DNS_RESOLUTION_FAILED')
  if (addresses.some((row) => privateIp(row.address))) throw scannerError('SCANNER_PRIVATE_IP_BLOCKED')
}

function robotsDisallowed(robots: string, path: string) {
  let applies = false
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim()
    if (!line) continue
    const [name, ...rest] = line.split(':')
    const value = rest.join(':').trim()
    if (name.toLowerCase() === 'user-agent') applies = value === '*'
    if (applies && name.toLowerCase() === 'disallow' && value && path.startsWith(value)) return true
  }
  return false
}

async function fetchText(url: URL, expectedOrigin: string, robots: string | null) {
  await assertSafePublicUrl(url, expectedOrigin)
  if (robots && robotsDisallowed(robots, url.pathname)) throw scannerError('SCANNER_ROBOTS_DISALLOWED', 403)
  let current = url
  for (let redirect = 0; redirect < 4; redirect += 1) {
    const response = await fetch(current, {
      headers: { 'user-agent': 'ANGELCARE-Revenue-Intelligence-Scanner/0.7.1 (+authorized commercial research)' },
      redirect: 'manual',
      signal: AbortSignal.timeout(8_000),
    })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location) throw scannerError('SCANNER_REDIRECT_WITHOUT_LOCATION')
      const next = new URL(location, current)
      await assertSafePublicUrl(next, expectedOrigin)
      current = next
      continue
    }
    const contentType = response.headers.get('content-type') || ''
    if (!response.ok) throw scannerError(`SCANNER_HTTP_${response.status}`, response.status)
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) throw scannerError('SCANNER_NON_HTML_SOURCE')
    const announced = Number(response.headers.get('content-length') || 0)
    if (announced > 2_000_000) throw scannerError('SCANNER_PAGE_TOO_LARGE')
    const html = (await response.text()).slice(0, 1_500_000)
    return { html, status: response.status, contentType, finalUrl: current.toString() }
  }
  throw scannerError('SCANNER_TOO_MANY_REDIRECTS')
}

async function loadRobots(origin: string) {
  try {
    const url = new URL('/robots.txt', origin)
    await assertSafePublicUrl(url, origin)
    const response = await fetch(url, { headers: { 'user-agent': 'ANGELCARE-Revenue-Intelligence-Scanner/0.7.1' }, signal: AbortSignal.timeout(4_000) })
    if (!response.ok) return null
    return (await response.text()).slice(0, 200_000)
  } catch { return null }
}

function researchTargetUrl(context: BrowserBusinessContext) {
  const website = String(context.organization?.website || '').trim()
  if (website) {
    try {
      const target = new URL(website.startsWith('http') ? website : `https://${website}`)
      if (['http:', 'https:'].includes(target.protocol)) return target
    } catch {}
  }
  return new URL(context.url)
}

function candidateUrls(context: BrowserBusinessContext, mode: ScannerMode, active = researchTargetUrl(context)) {
  const candidates: Array<{ url: string; score: number; category: string }> = [{ url: active.toString(), score: 120, category: context.adapterId === 'generic_web' ? 'active' : 'organization_website' }]
  const links = Array.isArray((context.metadata as any)?.internalLinks) ? (context.metadata as any).internalLinks : []
  for (const item of links) {
    const raw = typeof item === 'string' ? item : item?.url
    if (!raw) continue
    try {
      const url = new URL(raw, active)
      if (url.origin !== active.origin) continue
      candidates.push({ url: url.toString(), score: Number(item?.score || 20), category: String(item?.category || 'discovered') })
    } catch {}
  }
  const defaults = [
    ['/about', 70, 'about'], ['/a-propos', 70, 'about'], ['/services', 88, 'services'], ['/solutions', 85, 'services'],
    ['/contact', 95, 'contact'], ['/team', 100, 'leadership'], ['/leadership', 100, 'leadership'], ['/management', 96, 'leadership'],
    ['/locations', 92, 'locations'], ['/nos-sites', 92, 'locations'], ['/branches', 92, 'locations'], ['/partners', 86, 'partnerships'],
    ['/partenaires', 86, 'partnerships'], ['/news', 76, 'news'], ['/actualites', 76, 'news'], ['/careers', 68, 'careers'], ['/recrutement', 68, 'careers'],
  ] as Array<[string, number, string]>
  for (const [path, score, category] of defaults) candidates.push({ url: new URL(path, active.origin).toString(), score, category })
  const max = mode === 'quick' ? 1 : mode === 'strategic' ? 12 : 8
  return [...new Map(candidates.sort((a, b) => b.score - a.score).map((item) => [item.url.replace(/\/$/, ''), item])).values()].slice(0, max)
}

function contextFacts(context: BrowserBusinessContext): ScannerFact[] {
  const org = context.organization || {}
  const rows: Array<[string, unknown, number]> = [
    ['organization.name', org.name, 0.82], ['organization.legalName', org.legalName, 0.82], ['organization.domain', org.domain, 0.94],
    ['organization.sector', org.sector || org.category, 0.68], ['organization.city', org.city, 0.76], ['organization.address', org.address, 0.78],
    ['organization.phone', org.phone, 0.86], ['organization.email', org.email, 0.86], ['organization.website', org.website || context.url, 0.94],
    ['organization.description', org.description, 0.64],
  ]
  const explicit = (context.evidence || []).map((row: any) => ({
    fieldKey: String(row.fieldKey || 'browser.observation'), value: String(row.value || ''), normalizedValue: String(row.value || ''),
    sourceUrl: String(row.sourceUrl || context.url), sourceTitle: context.title || null, evidenceExcerpt: String(row.value || '').slice(0, 350),
    extractionMethod: String(row.type || 'browser_adapter'), confidence: Number(row.confidence ?? 0.65), validationState: 'detected' as const, metadata: row.metadata || {},
  })).filter((row) => row.value)
  return [...explicit, ...rows.filter(([, value]) => value).map(([fieldKey, value, confidence]) => ({
    fieldKey, value: String(value), normalizedValue: String(value), sourceUrl: context.url, sourceTitle: context.title || null,
    evidenceExcerpt: String(value).slice(0, 350), extractionMethod: 'live_browser_context', confidence, validationState: 'detected' as const,
  }))]
}

function mergeExtractions(context: BrowserBusinessContext, extractions: ScannerPageExtraction[]) {
  const facts = unique([...contextFacts(context), ...extractions.flatMap((row) => row.facts)], (row) => `${row.fieldKey}|${row.value.toLowerCase()}|${row.sourceUrl}`)
  const contacts = unique([...(context.contacts || []).map((row: any) => ({ ...row, sourceUrl: context.url, confidence: Number(row.confidence || 0.7) } as ScannerContact)), ...extractions.flatMap((row) => row.contacts)], (row) => `${row.email || ''}|${row.name || ''}|${row.role || ''}`.toLowerCase())
  const signals = unique(extractions.flatMap((row) => row.signals), (row) => `${row.signalKey}|${row.sourceUrl}`)
  const services = [...new Set(extractions.flatMap((row) => row.services))]
  const branches = unique(extractions.flatMap((row) => row.branches), (row) => `${row.city || ''}|${row.address || ''}|${row.sourceUrl}`.toLowerCase())
  const highest = (fieldKey: string) => facts.filter((row) => row.fieldKey === fieldKey).sort((a, b) => b.confidence - a.confidence)[0]?.value || null
  const activeOrg = context.organization || {}
  const merged: BrowserBusinessContext = {
    ...context,
    pageType: 'organization_research_bundle',
    organization: {
      ...activeOrg,
      name: highest('organization.name') || activeOrg.name,
      legalName: highest('organization.legalName') || activeOrg.legalName,
      domain: highest('organization.domain') || activeOrg.domain,
      sector: highest('organization.sector') || activeOrg.sector,
      city: highest('organization.city') || activeOrg.city,
      address: highest('organization.address') || activeOrg.address,
      phone: highest('organization.phone') || activeOrg.phone,
      email: highest('organization.email') || activeOrg.email,
      website: highest('organization.website') || activeOrg.website || context.url,
      description: highest('organization.description') || activeOrg.description,
      socialLinks: [...new Set(extractions.flatMap((row) => (row.organization.socialLinks as string[] || [])))],
      signals: signals.map((row) => row.label),
    },
    contacts,
    evidence: facts.map((row) => ({ type: row.extractionMethod, fieldKey: row.fieldKey, value: row.value, confidence: row.confidence, sourceUrl: row.sourceUrl, metadata: { validationState: row.validationState, evidenceExcerpt: row.evidenceExcerpt, ...row.metadata } })),
    metadata: {
      ...(context.metadata || {}),
      scanVersion: 'scanner-intelligence-2.0',
      scannedPages: extractions.map((row) => row.page),
      services,
      branches,
      signals,
    },
  }
  return { context: merged, facts, contacts, signals, services, branches }
}

function deterministicHypotheses(vertical: any, signals: ScannerSignal[]): ScannerOpportunityHypothesis[] {
  const evidence = signals.slice(0, 8).map((signal) => `${signal.label}: ${signal.evidence.slice(0, 180)}`)
  const programs = Array.isArray(vertical?.recommendedPrograms) && vertical.recommendedPrograms.length ? vertical.recommendedPrograms : ['ANGELCARE strategic pilot']
  const models: Record<string, string> = {
    hospitality: 'Pilot fixe + retainer mensuel + usage par enfant/session',
    schools: 'Abonnement annuel ou package volume multi-programmes',
    corporate: 'Retainer entreprise + activation par site et par usage',
    clinics: 'Accord de référencement + programmes familles et formation',
    events: 'Forfait événement + volume + options staff et matériel',
  }
  return programs.slice(0, 5).map((program: string, index: number) => ({
    programKey: program.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 100) || `program_${index + 1}`,
    title: program,
    rationale: `${vertical?.commercialAngle || 'Opportunity aligned with the detected organization and ANGELCARE service portfolio.'}${signals.length ? ` ${signals.slice(0, 3).map((signal) => signal.commercialInterpretation).join(' ')}` : ''}`,
    evidence,
    potentialModel: models[vertical?.key] || 'Pilot contrôlé puis contrat récurrent selon volume et sites',
    confidence: Math.min(0.9, Number(vertical?.confidence || 0.5) + Math.min(0.25, signals.length * 0.04)),
    missingInformation: Array.isArray(vertical?.missingInformation) ? vertical.missingInformation.slice(0, 8) : [],
    estimatedAnnualValueMin: Number(vertical?.estimatedAnnualValue?.min || 0),
    estimatedAnnualValueMax: Number(vertical?.estimatedAnnualValue?.max || 0),
  }))
}

function calculateQuality(input: { facts: ScannerFact[]; contacts: ScannerContact[]; branches: any[]; pages: ScannerSourcePage[]; vertical: any; hypotheses: ScannerOpportunityHypothesis[]; matches: any[] }): ScannerQuality {
  const fieldKeys = new Set(input.facts.map((row) => row.fieldKey))
  const identityFields = ['organization.name','organization.domain','organization.website','organization.city','organization.address','organization.phone','organization.email']
  const identity = identityFields.filter((key) => fieldKeys.has(key)).length / identityFields.length
  const sourceDiversity = new Set(input.facts.map((row) => { try { return new URL(row.sourceUrl).pathname || '/' } catch { return row.sourceUrl || 'unknown' } })).size
  const evidenceAverage = input.facts.length ? input.facts.reduce((sum, row) => sum + row.confidence, 0) / input.facts.length : 0
  const duplicateRisk = Number(input.matches?.[0]?.confidence || 0)
  const contactCoverage = Math.min(1, input.contacts.length / 5)
  const branchConfidence = input.branches.length ? Math.min(1, 0.45 + input.branches.length * 0.1) : 0.2
  const opportunity = input.hypotheses.length ? input.hypotheses.reduce((sum, row) => sum + row.confidence, 0) / input.hypotheses.length : 0
  const completeness = identity * 0.3 + evidenceAverage * 0.2 + Math.min(1, input.facts.length / 30) * 0.15 + contactCoverage * 0.15 + Math.min(1, sourceDiversity / 5) * 0.1 + opportunity * 0.1
  return {
    identityConfidence: clamp(identity * 100), evidenceCompleteness: clamp(Math.min(1, input.facts.length / 35) * 100),
    contactCoverage: clamp(contactCoverage * 100), branchConfidence: clamp(branchConfidence * 100), verticalConfidence: clamp(Number(input.vertical?.confidence || 0) * 100),
    opportunityConfidence: clamp(opportunity * 100), freshness: 100, sourceDiversity: clamp(Math.min(1, sourceDiversity / 6) * 100),
    duplicateRisk: clamp(duplicateRisk * 100), overallResearchCompleteness: clamp(completeness * 100),
  }
}

function recommendedActions(input: { matches: any[]; contacts: ScannerContact[]; hypotheses: ScannerOpportunityHypothesis[]; quality: ScannerQuality }) {
  const top = input.matches?.[0]
  const actions: Array<{ key: string; label: string; reason: string; priority: 'critical' | 'high' | 'medium' | 'low' }> = []
  if (top?.confidence >= 0.82) actions.push({ key: 'open_existing', label: 'Ouvrir le compte ANGELCARE existant', reason: `Correspondance ${Math.round(top.confidence * 100)}%: ${top.reasons?.join(' · ') || 'signaux d’identité concordants'}`, priority: 'critical' })
  else if (top?.confidence >= 0.55) actions.push({ key: 'review_duplicate', label: 'Examiner le doublon potentiel', reason: `Correspondance probable ${Math.round(top.confidence * 100)}%; aucune création silencieuse autorisée.`, priority: 'critical' })
  else actions.push({ key: 'create_prospect', label: 'Créer le prospect avec les preuves', reason: 'Aucun compte existant à haute confiance n’a été trouvé.', priority: 'high' })
  if (input.quality.evidenceCompleteness < 65) actions.push({ key: 'deep_scan', label: 'Compléter la recherche organisation', reason: 'La couverture de preuves reste insuffisante.', priority: 'high' })
  if (!input.contacts.length) actions.push({ key: 'research_decision_makers', label: 'Créer les missions décideurs', reason: 'Aucun contact public vérifiable n’a été identifié.', priority: 'high' })
  if (input.hypotheses.length) actions.push({ key: 'create_opportunity', label: 'Transformer l’hypothèse prioritaire en opportunité', reason: input.hypotheses[0].title, priority: 'medium' })
  actions.push({ key: 'account_plan', label: 'Générer le plan de pénétration', reason: 'Structurer parties prenantes, preuves manquantes, entrée commerciale et jalons.', priority: 'medium' })
  return actions
}

async function insertRows(db: any, table: string, rows: any[]) {
  if (!rows.length) return []
  const { data, error } = await db.from(table).insert(rows).select('*')
  if (error) dbError(`SCANNER_${table.toUpperCase()}_INSERT_FAILED`, error)
  return data || []
}

async function createSession(db: any, actor: any, device: any, mode: ScannerMode, context: BrowserBusinessContext) {
  const { data, error } = await db.from('browser_extension_scan_sessions').insert({
    user_id: actor.id, device_id: device.id, mode, status: 'prepared', adapter_key: context.adapterId,
    source_url: context.url, source_origin: context.origin || new URL(context.url).origin, page_type: context.pageType,
    requested_sources: mode === 'quick' ? ['active_page'] : ['active_page','same_domain_public_pages'],
    progress: { stage: 'prepared', completed: 0, total: mode === 'quick' ? 1 : mode === 'strategic' ? 12 : 8 },
    input_context: context, scanner_version: 'scanner-intelligence-2.0',
  }).select('*').single()
  if (error) dbError('SCANNER_SESSION_CREATE_FAILED', error)
  return data
}

async function updateSession(db: any, id: string, patch: Record<string, unknown>) {
  const { data, error } = await db.from('browser_extension_scan_sessions').update({ ...patch, updated_at: now() }).eq('id', id).select('*').single()
  if (error) dbError('SCANNER_SESSION_UPDATE_FAILED', error)
  return data
}

async function persistScannerResult(db: any, actor: any, session: any, input: { pages: ScannerSourcePage[]; facts: ScannerFact[]; contacts: ScannerContact[]; signals: ScannerSignal[]; hypotheses: ScannerOpportunityHypothesis[]; quality: ScannerQuality; diagnostics: any[]; contextId?: string | null }) {
  await insertRows(db, 'browser_extension_scan_pages', input.pages.map((page, index) => ({ scan_session_id: session.id, page_order: index + 1, source_url: page.url, page_title: page.title, page_type: page.pageType, fetch_status: page.status, http_status: page.httpStatus || null, content_type: page.contentType || null, text_length: page.textLength || 0, error_code: page.errorCode || null, metadata: page.metadata || {} })))
  await insertRows(db, 'browser_extension_scan_facts', input.facts.map((fact) => ({ scan_session_id: session.id, context_id: input.contextId || null, field_key: fact.fieldKey, observed_value: fact.value, normalized_value: fact.normalizedValue || fact.value, source_url: fact.sourceUrl, source_title: fact.sourceTitle || null, evidence_excerpt: fact.evidenceExcerpt || null, extraction_method: fact.extractionMethod, confidence: fact.confidence, validation_state: fact.validationState, metadata: fact.metadata || {} })))
  await insertRows(db, 'browser_extension_scan_contacts', input.contacts.map((contact) => ({ scan_session_id: session.id, name: contact.name, role: contact.role, department: contact.department, email: contact.email, phone: contact.phone, source_url: contact.sourceUrl, confidence: contact.confidence, buying_role_hypothesis: contact.buyingRoleHypothesis || null, metadata: contact.metadata || {} })))
  await insertRows(db, 'browser_extension_scan_signals', input.signals.map((signal) => ({ scan_session_id: session.id, signal_type: signal.signalType, signal_key: signal.signalKey, label: signal.label, evidence_excerpt: signal.evidence, source_url: signal.sourceUrl, confidence: signal.confidence, commercial_interpretation: signal.commercialInterpretation, metadata: signal.metadata || {} })))
  await insertRows(db, 'browser_extension_scan_opportunity_hypotheses', input.hypotheses.map((row) => ({ scan_session_id: session.id, program_key: row.programKey, title: row.title, rationale: row.rationale, evidence_references: row.evidence, potential_model: row.potentialModel, confidence: row.confidence, missing_information: row.missingInformation, estimated_annual_value_min: row.estimatedAnnualValueMin, estimated_annual_value_max: row.estimatedAnnualValueMax, status: 'proposed' })))
  await insertRows(db, 'browser_extension_scan_errors', input.diagnostics.map((row) => ({ scan_session_id: session.id, error_code: row.code, message: row.message, source_url: row.sourceUrl || null, recoverable: true, metadata: {} })))
  await db.from('browser_extension_scan_sessions').update({ quality: input.quality, completed_by: actor.id, completed_at: now() }).eq('id', session.id)
}

export async function runQuickScanner(input: { db: any; actor: any; device: any; access: any; context: BrowserBusinessContext }): Promise<ScannerResult> {
  const session = await createSession(input.db, input.actor, input.device, 'quick', input.context)
  await updateSession(input.db, session.id, { status: 'collecting', progress: { stage: 'collecting_active_context', completed: 0, total: 1 } })
  try {
    const resolution: any = await executeB2BIntelligenceCommand({ db: input.db, actor: input.actor, device: input.device, access: input.access, commandKey: 'b2b.context.resolve', payload: { context: input.context } })
    const merged = mergeExtractions(input.context, [])
    const hypotheses = deterministicHypotheses(resolution.vertical, merged.signals)
    const pages: ScannerSourcePage[] = [{ url: input.context.url, title: input.context.title || null, pageType: input.context.pageType, status: 'fetched', textLength: Number((input.context.metadata as any)?.textLength || 0), metadata: { source: 'live_browser_adapter' } }]
    const quality = calculateQuality({ facts: merged.facts, contacts: merged.contacts, branches: merged.branches, pages, vertical: resolution.vertical, hypotheses, matches: resolution.matches || [] })
    const actions = recommendedActions({ matches: resolution.matches || [], contacts: merged.contacts, hypotheses, quality })
    const finalSession = await updateSession(input.db, session.id, { status: 'review_required', context_id: resolution.context?.id || null, resolved_prospect_id: resolution.context?.resolved_prospect_id || null, progress: { stage: 'review_required', completed: 1, total: 1 }, output_summary: { quality, matchCount: resolution.matches?.length || 0, factCount: merged.facts.length, contactCount: merged.contacts.length, signalCount: merged.signals.length } })
    await persistScannerResult(input.db, input.actor, finalSession, { pages, facts: merged.facts, contacts: merged.contacts, signals: merged.signals, hypotheses, quality, diagnostics: [], contextId: resolution.context?.id || null })
    return { session: finalSession, mode: 'quick', status: 'review_required', context: merged.context, pages, facts: merged.facts, contacts: merged.contacts, signals: merged.signals, services: merged.services, branches: merged.branches, matches: resolution.matches || [], vertical: resolution.vertical, score: resolution.score, opportunityHypotheses: hypotheses, missingInformation: resolution.vertical?.missingInformation || [], quality, recommendedActions: actions, ai: { configured: false, used: false, provider: null, model: null, warning: 'QUICK_SCAN_USES_DETERMINISTIC_INTELLIGENCE' }, diagnostics: [] }
  } catch (error: any) {
    await updateSession(input.db, session.id, { status: 'failed', error_code: String(error?.message || 'SCANNER_QUICK_FAILED'), progress: { stage: 'failed', completed: 0, total: 1 } })
    throw error
  }
}

export async function runDeepScanner(input: { db: any; actor: any; device: any; access: any; context: BrowserBusinessContext; mode?: ScannerMode }): Promise<ScannerResult> {
  const mode: ScannerMode = input.mode === 'strategic' ? 'strategic' : 'deep'
  const session = await createSession(input.db, input.actor, input.device, mode, input.context)
  const diagnostics: Array<{ code: string; message: string; sourceUrl?: string | null }> = []
  const pages: ScannerSourcePage[] = []
  const extractions: ScannerPageExtraction[] = []
  try {
    const activeUrl = researchTargetUrl(input.context)
    await assertSafePublicUrl(activeUrl)
    const robots = await loadRobots(activeUrl.origin)
    const candidates = candidateUrls(input.context, mode, activeUrl)
    await updateSession(input.db, session.id, { status: 'researching', progress: { stage: 'discovering_relevant_pages', completed: 0, total: candidates.length }, discovered_urls: candidates })
    const concurrency = mode === 'strategic' ? 3 : 2
    let completed = 0
    for (let offset = 0; offset < candidates.length; offset += concurrency) {
      const batch = candidates.slice(offset, offset + concurrency)
      await updateSession(input.db, session.id, { progress: { stage: 'researching_organization', completed, total: candidates.length, currentUrls: batch.map((row) => row.url) } })
      const batchResults = await Promise.all(batch.map(async (candidate) => {
        try {
          const fetched = await fetchText(new URL(candidate.url), activeUrl.origin, robots)
          const parsed = parseBusinessHtml({ html: fetched.html, url: fetched.finalUrl, status: fetched.status, contentType: fetched.contentType })
          parsed.page.metadata = { ...(parsed.page.metadata || {}), discoveryCategory: candidate.category, discoveryScore: candidate.score }
          return { parsed, candidate, error: null as any }
        } catch (error: any) {
          return { parsed: null, candidate, error }
        }
      }))
      for (const result of batchResults) {
        if (result.parsed) { extractions.push(result.parsed); pages.push(result.parsed.page) }
        else {
          const code = String(result.error?.message || 'SCANNER_PAGE_FAILED')
          pages.push({ url: result.candidate.url, title: null, pageType: result.candidate.category, status: code === 'SCANNER_ROBOTS_DISALLOWED' ? 'skipped' : 'failed', errorCode: code, metadata: { discoveryScore: result.candidate.score } })
          diagnostics.push({ code, message: code === 'SCANNER_HTTP_404' ? 'Page candidate non disponible.' : 'Source non exploitable pendant ce scan contrôlé.', sourceUrl: result.candidate.url })
        }
      }
      completed += batch.length
      await updateSession(input.db, session.id, { progress: { stage: 'researching_organization', completed, total: candidates.length } })
      if (completed < candidates.length) await new Promise((resolve) => setTimeout(resolve, 180))
    }
    const merged = mergeExtractions(input.context, extractions)
    await updateSession(input.db, session.id, { status: 'resolving', progress: { stage: 'resolving_identity_and_duplicates', completed: candidates.length, total: candidates.length } })
    const resolution: any = await executeB2BIntelligenceCommand({ db: input.db, actor: input.actor, device: input.device, access: input.access, commandKey: 'b2b.context.resolve', payload: { context: merged.context } })
    let hypotheses = deterministicHypotheses(resolution.vertical, merged.signals)
    const ai = await runConfiguredScannerAI({ organization: merged.context.organization || {}, facts: merged.facts, signals: merged.signals, services: merged.services, vertical: resolution.vertical })
    if (ai.used && ai.opportunityHypotheses?.length) hypotheses = unique([...ai.opportunityHypotheses, ...hypotheses], (row) => row.programKey).slice(0, 8)
    const missingInformation = [...new Set([...(resolution.vertical?.missingInformation || []), ...(ai.missingInformation || []), ...(merged.contacts.length ? [] : ['Decision-maker contacts not yet verified']), ...(merged.facts.some((row) => row.fieldKey === 'organization.phone' || row.fieldKey === 'organization.email') ? [] : ['Public contact channel'])])]
    const quality = calculateQuality({ facts: merged.facts, contacts: merged.contacts, branches: merged.branches, pages, vertical: resolution.vertical, hypotheses, matches: resolution.matches || [] })
    const actions = recommendedActions({ matches: resolution.matches || [], contacts: merged.contacts, hypotheses, quality })
    const status = diagnostics.length && !extractions.length ? 'failed' : diagnostics.length ? 'partial' : 'review_required'
    const finalSession = await updateSession(input.db, session.id, { status, context_id: resolution.context?.id || null, resolved_prospect_id: resolution.context?.resolved_prospect_id || null, progress: { stage: status === 'partial' ? 'partial_review_required' : 'review_required', completed: candidates.length, total: candidates.length }, output_summary: { quality, matchCount: resolution.matches?.length || 0, pageCount: pages.filter((row) => row.status === 'fetched').length, factCount: merged.facts.length, contactCount: merged.contacts.length, signalCount: merged.signals.length, hypothesisCount: hypotheses.length, aiUsed: ai.used } })
    await persistScannerResult(input.db, input.actor, finalSession, { pages, facts: merged.facts, contacts: merged.contacts, signals: merged.signals, hypotheses, quality, diagnostics, contextId: resolution.context?.id || null })
    return { session: finalSession, mode, status: status as any, context: merged.context, pages, facts: merged.facts, contacts: merged.contacts, signals: merged.signals, services: merged.services, branches: merged.branches, matches: resolution.matches || [], vertical: resolution.vertical, score: resolution.score, opportunityHypotheses: hypotheses, missingInformation, quality, recommendedActions: actions, ai, diagnostics }
  } catch (error: any) {
    await updateSession(input.db, session.id, { status: 'failed', error_code: String(error?.message || 'SCANNER_DEEP_FAILED'), progress: { stage: 'failed', completed: pages.length, total: candidateUrls(input.context, mode, researchTargetUrl(input.context)).length } })
    throw error
  }
}

export async function readScannerSession(input: { db: any; actor: any; sessionId: string }) {
  const { data: session, error } = await input.db.from('browser_extension_scan_sessions').select('*').eq('id', input.sessionId).eq('user_id', input.actor.id).maybeSingle()
  if (error) dbError('SCANNER_SESSION_READ_FAILED', error)
  if (!session) throw scannerError('SCANNER_SESSION_NOT_FOUND', 404)
  const [pages, facts, contacts, signals, hypotheses, errors] = await Promise.all([
    input.db.from('browser_extension_scan_pages').select('*').eq('scan_session_id', session.id).order('page_order'),
    input.db.from('browser_extension_scan_facts').select('*').eq('scan_session_id', session.id).order('confidence', { ascending: false }),
    input.db.from('browser_extension_scan_contacts').select('*').eq('scan_session_id', session.id).order('confidence', { ascending: false }),
    input.db.from('browser_extension_scan_signals').select('*').eq('scan_session_id', session.id).order('confidence', { ascending: false }),
    input.db.from('browser_extension_scan_opportunity_hypotheses').select('*').eq('scan_session_id', session.id).order('confidence', { ascending: false }),
    input.db.from('browser_extension_scan_errors').select('*').eq('scan_session_id', session.id),
  ])
  return { session, pages: pages.data || [], facts: facts.data || [], contacts: contacts.data || [], signals: signals.data || [], opportunityHypotheses: hypotheses.data || [], errors: errors.data || [] }
}

export async function searchScannerAccounts(input: { db: any; actor: any; access: any; query?: string; city?: string; sector?: string; status?: string; limit?: number }) {
  const { data, error } = await input.db.from('b2b_prospects').select('*').is('archived_at', null).order('updated_at', { ascending: false }).limit(1500)
  if (error) dbError('SCANNER_ACCOUNT_SEARCH_FAILED', error)
  const scoped = filterByOwnership(data || [], input.actor.id, scopeRecord(input.access))
  const query = cleanText(input.query || '', 160).toLowerCase()
  const city = cleanText(input.city || '', 100).toLowerCase()
  const sector = cleanText(input.sector || '', 100).toLowerCase()
  const status = cleanText(input.status || '', 100).toLowerCase()
  const scoreRow = (row: any) => {
    if (!query) return 1
    const fields = [row.name, row.website, row.phone, row.email, row.city, row.address, row.sector].map((value) => String(value || '').toLowerCase())
    if (fields[0] === query || fields[1] === query) return 100
    if (fields.some((value) => value.startsWith(query))) return 70
    if (fields.some((value) => value.includes(query))) return 45
    return 0
  }
  const results = scoped
    .filter((row: any) => (!city || String(row.city || '').toLowerCase().includes(city)) && (!sector || String(row.sector || '').toLowerCase().includes(sector)) && (!status || String(row.status || '').toLowerCase() === status))
    .map((row: any) => ({ ...row, searchScore: scoreRow(row) }))
    .filter((row: any) => row.searchScore > 0)
    .sort((a: any, b: any) => b.searchScore - a.searchScore || new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
    .slice(0, Math.min(100, Math.max(1, Number(input.limit || 25))))
  const { data: recentContexts } = await input.db.from('browser_extension_b2b_contexts').select('resolved_prospect_id,source_url,adapter_key,updated_at').eq('user_id', input.actor.id).not('resolved_prospect_id', 'is', null).order('updated_at', { ascending: false }).limit(40)
  const recentMap = new Map<string, { updated_at?: string | null; source_url?: string | null; adapter_key?: string | null }>((recentContexts || []).map((row: any) => [String(row.resolved_prospect_id), row]))
  return {
    totalAuthorized: scoped.length,
    results: results.map((row: any) => ({ ...row, recentContext: recentMap.get(String(row.id)) || null })),
    recent: scoped.filter((row: any) => recentMap.has(String(row.id))).sort((a: any, b: any) => new Date(recentMap.get(String(b.id))?.updated_at || 0).getTime() - new Date(recentMap.get(String(a.id))?.updated_at || 0).getTime()).slice(0, 12),
  }
}

export async function recordScannerDecision(input: { db: any; actor: any; sessionId: string; decisionType: string; targetType?: string | null; targetId?: string | null; payload?: Record<string, unknown> }) {
  const { data: session } = await input.db.from('browser_extension_scan_sessions').select('id,user_id').eq('id', input.sessionId).eq('user_id', input.actor.id).maybeSingle()
  if (!session) throw scannerError('SCANNER_SESSION_NOT_FOUND', 404)
  const { data, error } = await input.db.from('browser_extension_scan_user_decisions').insert({ scan_session_id: input.sessionId, user_id: input.actor.id, decision_type: input.decisionType, target_type: input.targetType || null, target_id: input.targetId || null, decision_payload: input.payload || {} }).select('*').single()
  if (error) dbError('SCANNER_DECISION_RECORD_FAILED', error)
  return data
}
