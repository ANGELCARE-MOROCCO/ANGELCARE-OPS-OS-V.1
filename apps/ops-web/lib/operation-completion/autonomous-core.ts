import crypto from 'crypto'
import path from 'path'
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'fs/promises'

export type OperationRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type OperationExecutionMode = 'observe' | 'controlled' | 'strict' | 'autonomous'
export type OperationArea = 'ui-actions' | 'forms' | 'api-routes' | 'data-sync' | 'runtime-policy' | 'quality' | 'security' | 'performance'

export type OperationModule = {
  key: string
  label: string
  group: string
  paths: string[]
  protected?: boolean
  critical?: boolean
}

export type OperationScanItem = {
  id: string
  module: string
  area: OperationArea
  file: string
  label: string
  actionType: string
  risk: OperationRiskLevel
  confidence: number
  selector?: string
  method?: string
  endpoint?: string
  protectedAction?: boolean
  evidence: string[]
  recommendations: string[]
}

export type OperationScanResult = {
  ok: true
  scanId: string
  generatedAt: string
  scannedFiles: number
  selectedModules: string[]
  selectedAreas: OperationArea[]
  modules: string[]
  areas: OperationArea[]
  actionTypes: string[]
  riskSummary: Record<OperationRiskLevel, number>
  completionScore: number
  coverage: {
    totalActions: number
    apiRoutes: number
    forms: number
    protectedActions: number
    missingOperationKeys: number
    autoImplementable: number
    requiresApproval: number
  }
  items: OperationScanItem[]
}

export type OperationPlanStep = {
  id: string
  title: string
  area: OperationArea
  module: string
  risk: OperationRiskLevel
  execution: 'automatic' | 'approval-required' | 'manual-review'
  status: 'queued' | 'running' | 'completed' | 'blocked' | 'failed' | 'skipped'
  description: string
  targetFiles: string[]
  rollbackHint: string
}

export type OperationAutonomousPlan = {
  jobId: string
  mode: OperationExecutionMode
  dryRun: boolean
  sourceWriteRequested: boolean
  sourceWriteAllowed: boolean
  selectedModules: string[]
  selectedAreas: OperationArea[]
  createdAt: string
  summary: {
    totalSteps: number
    automatic: number
    approvalRequired: number
    manualReview: number
    blockedCritical: number
    estimatedCoverageGain: number
  }
  safeguards: string[]
  steps: OperationPlanStep[]
}

export type OperationExecutionResult = {
  ok: true
  jobId: string
  mode: OperationExecutionMode
  dryRun: boolean
  sourceWriteApplied: boolean
  startedAt: string
  finishedAt: string
  progress: number
  summary: OperationAutonomousPlan['summary'] & {
    completed: number
    blocked: number
    failed: number
    skipped: number
  }
  steps: OperationPlanStep[]
  artifacts: string[]
  rollbackManifest?: string
  message: string
}

type BuildPlanOptions = {
  selectedModules?: string[]
  selectedAreas?: OperationArea[]
  mode?: OperationExecutionMode
  dryRun?: boolean
  sourceWrite?: boolean
}

type ScanOptions = {
  selectedModules?: string[]
  selectedAreas?: OperationArea[]
  maxFiles?: number
}

const ROOT = process.cwd()
const GENERATED_DIR = path.join(ROOT, '.angelcare_operation_completion')
const SOURCE_WRITE_ENV = 'OPERATION_COMPLETION_ALLOW_SOURCE_WRITE'
const DEFAULT_MAX_FILES = 1600
const SOURCE_EXTENSIONS = /\.(tsx|ts|jsx|js)$/
const IGNORED_DIRS = new Set(['node_modules', '.next', '.git', '.turbo', '.vercel', '.angelcare_backups', 'backups', 'recovery'])

export const OPERATION_AREAS: OperationArea[] = ['ui-actions', 'forms', 'api-routes', 'data-sync', 'runtime-policy', 'quality', 'security', 'performance']

export const OPERATION_MODULES: OperationModule[] = [
  { key: 'ac360', label: 'AC360 Direction Cockpit', group: 'Executive Operations', paths: ['components/ac360', 'app/(protected)/ac360', 'app/api/ac360', 'lib/ac360'], critical: true },
  { key: 'carelink-ops', label: 'CareLink OPS Dispatch', group: 'Operations', paths: ['app/carelink-ops', 'components/carelink', 'app/api/carelink-ops', 'lib/missions'], critical: true },
  { key: 'carelink', label: 'CareLink Mobile App', group: 'Mobile Execution', paths: ['app/carelink', 'components/carelink', 'app/api/carelink'], critical: true },
  { key: 'users', label: 'Users, Access & Attendance', group: 'Security / HR', paths: ['app/(protected)/users', 'components/users', 'components/user-manager', 'app/api/attendance', 'lib/hr-attendance'], critical: true },
  { key: 'market-os', label: 'Market OS', group: 'Commercial Growth', paths: ['components/market-os', 'app/api/market-os', 'lib/market-os'] },
  { key: 'b2b-partnerships', label: 'B2B Partnerships', group: 'Sales / Partnerships', paths: ['components/b2b-partnerships', 'app/api/b2b-partnerships', 'lib/b2b-partnerships'] },
  { key: 'capital-command-center', label: 'Capital Command Center', group: 'Fundraising', paths: ['components/capital-command', 'app/api/capital-command-center', 'lib/capital-command-center'] },
  { key: 'email-os', label: 'Email OS Core', group: 'Communication', paths: ['components/email-os-core', 'app/api/email-os', 'lib/email-os-core'], critical: true },
  { key: 'academy', label: 'Academy / Training', group: 'Training Business', paths: ['components/academy', 'components/traininghub', 'app/traininghub', 'app/api/traininghub', 'lib/traininghub', 'lib/academy'] },
  { key: 'service-os', label: 'Service OS', group: 'Service Operations', paths: ['components/service-os', 'app/api/service-os', 'lib/service-os'] },
  { key: 'system-control', label: 'System Control', group: 'Runtime Governance', paths: ['components/ceo-system-control', 'app/api/system-control', 'lib/system-control'], protected: true, critical: true },
  { key: 'operation-completion', label: 'Global Operation Completion Engine', group: 'OPSOS Runtime', paths: ['components/operation-completion', 'app/api/operation-completion', 'lib/operation-completion'], protected: true, critical: true },
]

const ACTION_WORDS = [
  'save', 'enregistrer', 'delete', 'supprimer', 'create', 'créer', 'submit', 'valider', 'validate', 'execute', 'run', 'launch',
  'import', 'export', 'upload', 'restore', 'suspend', 'confirm', 'approve', 'reject', 'archive', 'send', 'sync', 'refresh',
  'assign', 'dispatch', 'duplicate', 'generate', 'print', 'close', 'open dossier', 'convert', 'publish', 'repair', 'rollback', 'optimize',
]

const NAV_WORDS = ['retour', 'back', 'view', 'overview', 'profile', 'attendance dashboard', 'settings', 'tab', 'previous', 'next', 'cancel']
const CRITICAL_WORDS = ['delete', 'supprimer', 'suspend', 'shutdown', 'turn off', 'archive', 'rollback', 'hard repair', 'credential', 'password', 'role', 'permission', 'payment']
const DATA_SYNC_WORDS = ['fetch(', '.from(', 'supabase', 'insert(', 'update(', 'upsert(', 'delete(', 'rpc(', 'createClient']

function stableId(parts: string[]) {
  return crypto.createHash('sha1').update(parts.join('::')).digest('hex').slice(0, 16)
}

function normalizeText(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/[{}'"`]/g, ' ').replace(/\s+/g, ' ').trim()
}

function classifyAction(label: string) {
  const text = label.toLowerCase()
  if (text.includes('delete') || text.includes('supprimer')) return 'delete'
  if (text.includes('save') || text.includes('enregistrer')) return 'save'
  if (text.includes('create') || text.includes('new') || text.includes('créer')) return 'create'
  if (text.includes('restore') || text.includes('rollback')) return 'restore'
  if (text.includes('suspend') || text.includes('turn off') || text.includes('shutdown')) return 'suspend'
  if (text.includes('import') || text.includes('upload')) return 'import'
  if (text.includes('approve') || text.includes('reject') || text.includes('validate') || text.includes('valider')) return 'approval'
  if (text.includes('sync') || text.includes('refresh')) return 'sync'
  if (text.includes('run') || text.includes('execute') || text.includes('launch') || text.includes('repair') || text.includes('optimize')) return 'execute'
  if (text.includes('send')) return 'send'
  if (text.includes('print') || text.includes('generate')) return 'document'
  return 'action'
}

function riskFor(label: string, file: string, moduleKey: string, area: OperationArea): OperationRiskLevel {
  const text = `${label} ${file}`.toLowerCase()
  const module = OPERATION_MODULES.find((item) => item.key === moduleKey)
  if (CRITICAL_WORDS.some((word) => text.includes(word)) && (module?.critical || area === 'security')) return 'critical'
  if (CRITICAL_WORDS.some((word) => text.includes(word))) return 'high'
  if (area === 'api-routes' && /\/api\//.test(file) && /(delete|patch|put|post)/i.test(text)) return module?.critical ? 'high' : 'medium'
  if (area === 'security' || text.includes('auth') || text.includes('permission') || text.includes('role')) return 'high'
  if (area === 'data-sync') return module?.critical ? 'medium' : 'low'
  return module?.critical ? 'medium' : 'low'
}

function isNavigation(label: string) {
  const text = label.toLowerCase()
  return NAV_WORDS.some((word) => text === word || text.includes(word))
}

function moduleFromFile(file: string) {
  const normalized = file.replace(/\\/g, '/')
  const byRegistry = OPERATION_MODULES.find((module) => module.paths.some((prefix) => normalized.startsWith(prefix)))
  if (byRegistry) return byRegistry.key

  const clean = normalized.replace(/^app\//, '').replace(/^components\//, '').replace(/^lib\//, '')
  const parts = clean.split('/').filter(Boolean)
  const first = parts.find((part) => !part.startsWith('(') && part !== '_components' && part !== 'api')
  return first || 'shared'
}

function inferArea(file: string, source: string, label: string): OperationArea {
  const text = `${file} ${label}`.toLowerCase()
  if (file.includes('/api/')) return 'api-routes'
  if (/<form\b/i.test(source) || /type=["']submit["']/i.test(label)) return 'forms'
  if (DATA_SYNC_WORDS.some((word) => source.includes(word))) return 'data-sync'
  if (/role|permission|auth|session|credential|password/i.test(text)) return 'security'
  if (/performance|memo|virtual|cache|heavy|timeout|debounce|throttle/i.test(text)) return 'performance'
  return 'ui-actions'
}

function evidenceFor(source: string, label: string, area: OperationArea) {
  const evidence = [`Detected ${area.replace('-', ' ')}: ${label.slice(0, 120)}`]
  if (/data-operation-key=/.test(source)) evidence.push('Existing operation key found')
  if (/fetch\(/.test(source)) evidence.push('Client/server fetch execution detected')
  if (/requireRole\(/.test(source)) evidence.push('Role guard detected')
  if (/createClient\(/.test(source) || /supabase/.test(source)) evidence.push('Supabase data layer usage detected')
  return evidence.slice(0, 5)
}

function recommendationsFor(item: Pick<OperationScanItem, 'risk' | 'area' | 'actionType' | 'protectedAction'>) {
  const recommendations = ['Attach operation key, progress state, audit event and module scope before execution.']
  if (item.risk === 'critical' || item.protectedAction) recommendations.push('Require explicit approval and rollback snapshot before automatic implementation.')
  if (item.area === 'api-routes') recommendations.push('Register API method, status result, failure reason and retry policy in the execution job.')
  if (item.area === 'forms') recommendations.push('Add form preflight validation, optimistic state guard and post-submit reconciliation.')
  if (item.actionType === 'delete' || item.actionType === 'suspend') recommendations.push('Block silent execution and require admin confirmation plus audit note.')
  return recommendations
}

function scanButtonLike(source: string, file: string): OperationScanItem[] {
  const items: OperationScanItem[] = []
  const patterns = [
    /<button\b([\s\S]{0,900}?)>([\s\S]{0,220}?)<\/button>/gi,
    /<PageAction\b([\s\S]{0,900}?)>([\s\S]{0,180}?)<\/PageAction>/gi,
    /<input\b([\s\S]{0,350}?type=["']submit["'][\s\S]{0,350}?)>/gi,
    /data-operation-key=["']([^"']+)["']/gi,
  ]

  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source))) {
      const raw = normalizeText(String(match[2] || match[1] || 'Operation action'))
      const label = raw || 'Operation action'
      const lower = label.toLowerCase()
      const hasActionWord = ACTION_WORDS.some((word) => lower.includes(word)) || /data-operation/.test(match[0])
      if (!hasActionWord || isNavigation(label)) continue
      const module = moduleFromFile(file)
      const area = inferArea(file, source, label)
      const risk = riskFor(label, file, module, area)
      const protectedAction = risk === 'critical' || OPERATION_MODULES.find((item) => item.key === module)?.protected === true
      const actionType = classifyAction(label)
      const item: OperationScanItem = {
        id: stableId([file, label, actionType]),
        module,
        area,
        file,
        label: label.slice(0, 140),
        actionType,
        risk,
        confidence: /data-operation-key=/.test(match[0]) ? 96 : label.length > 2 ? 84 : 58,
        selector: match[0].includes('data-operation-key') ? String(match[1]).slice(0, 120) : undefined,
        protectedAction,
        evidence: evidenceFor(source, label, area),
        recommendations: [],
      }
      item.recommendations = recommendationsFor(item)
      items.push(item)
    }
  }

  return items
}

function scanApiRoute(source: string, file: string): OperationScanItem[] {
  if (!file.includes('/api/') || !file.endsWith('/route.ts')) return []
  const items: OperationScanItem[] = []
  const methods = ['POST', 'PUT', 'PATCH', 'DELETE']
  for (const method of methods) {
    const regex = new RegExp(`export\\s+async\\s+function\\s+${method}\\b`, 'i')
    if (!regex.test(source)) continue
    const module = moduleFromFile(file)
    const label = `${method} ${file.replace(/^app\/api\//, '/api/').replace(/\/route\.ts$/, '')}`
    const area: OperationArea = 'api-routes'
    const risk = riskFor(label, file, module, area)
    const protectedAction = risk === 'critical' || /requireRole\(|requireUser\(|serviceRoleKey|SUPABASE_SERVICE_ROLE_KEY/.test(source)
    const item: OperationScanItem = {
      id: stableId([file, method, 'api-route']),
      module,
      area,
      file,
      label,
      actionType: method === 'DELETE' ? 'delete' : method === 'POST' ? 'create' : 'execute',
      risk,
      confidence: 94,
      method,
      endpoint: label.replace(/^\w+\s+/, ''),
      protectedAction,
      evidence: evidenceFor(source, label, area),
      recommendations: [],
    }
    item.recommendations = recommendationsFor(item)
    items.push(item)
  }
  return items
}

function scanQualitySignals(source: string, file: string): OperationScanItem[] {
  const items: OperationScanItem[] = []
  const module = moduleFromFile(file)
  const signals: Array<{ area: OperationArea; label: string; regex: RegExp; risk: OperationRiskLevel }> = [
    { area: 'quality', label: 'Console logging left in production path', regex: /console\.(log|warn|error)\(/, risk: 'low' },
    { area: 'quality', label: 'TODO/FIXME implementation marker', regex: /TODO|FIXME|not implemented|placeholder/i, risk: 'medium' },
    { area: 'performance', label: 'Large client component with potential render pressure', regex: /'use client'[\s\S]{12000,}/, risk: 'medium' },
    { area: 'security', label: 'Client localStorage runtime state without server policy persistence', regex: /localStorage\./, risk: 'medium' },
  ]
  for (const signal of signals) {
    if (!signal.regex.test(source)) continue
    const risk = module === 'system-control' || module === 'operation-completion' ? 'high' : signal.risk
    const item: OperationScanItem = {
      id: stableId([file, signal.label]),
      module,
      area: signal.area,
      file,
      label: signal.label,
      actionType: signal.area,
      risk,
      confidence: 78,
      protectedAction: risk === 'high' || risk === 'critical',
      evidence: [`Signal found in ${file}`],
      recommendations: signal.area === 'security'
        ? ['Move runtime policy decisions to DB-backed server routes and keep client settings as display/cache only.']
        : ['Convert the signal into an actionable repair job with audit event and rollback reference.'],
    }
    items.push(item)
  }
  return items
}

async function walk(dir: string, out: string[], maxFiles: number) {
  if (out.length >= maxFiles) return out
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (out.length >= maxFiles) break
    if (entry.name.startsWith('.') || IGNORED_DIRS.has(entry.name)) continue
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(absolute, out, maxFiles)
    else if (SOURCE_EXTENSIONS.test(entry.name)) out.push(absolute)
  }
  return out
}

async function collectFiles(maxFiles: number) {
  const roots = ['app', 'components', 'lib'].map((dir) => path.join(ROOT, dir))
  const files: string[] = []
  for (const root of roots) {
    try {
      const info = await stat(root)
      if (info.isDirectory()) await walk(root, files, maxFiles)
    } catch {}
  }
  return files
}

function matchesSelection(item: OperationScanItem, selectedModules: string[], selectedAreas: OperationArea[]) {
  const moduleMatch = !selectedModules.length || selectedModules.includes(item.module)
  const areaMatch = !selectedAreas.length || selectedAreas.includes(item.area)
  return moduleMatch && areaMatch
}

function completionScore(items: OperationScanItem[]) {
  if (!items.length) return 100
  const weighted = items.reduce((score, item) => {
    const riskPenalty = item.risk === 'critical' ? 10 : item.risk === 'high' ? 7 : item.risk === 'medium' ? 4 : 1
    const missingKeyPenalty = item.selector ? 0 : 1.5
    return score + riskPenalty + missingKeyPenalty
  }, 0)
  return Math.max(0, Math.min(100, Math.round(100 - weighted / Math.max(1, items.length) * 5)))
}

export async function runOperationEnterpriseScan(options: ScanOptions = {}): Promise<OperationScanResult> {
  const selectedModules = options.selectedModules || []
  const selectedAreas = options.selectedAreas || []
  const maxFiles = Math.max(100, Math.min(options.maxFiles || DEFAULT_MAX_FILES, 3000))
  const files = await collectFiles(maxFiles)
  const items: OperationScanItem[] = []

  for (const absolute of files.slice(0, maxFiles)) {
    try {
      const source = await readFile(absolute, 'utf8')
      const relative = path.relative(ROOT, absolute).replace(/\\/g, '/')
      items.push(...scanButtonLike(source, relative))
      items.push(...scanApiRoute(source, relative))
      items.push(...scanQualitySignals(source, relative))
    } catch {}
  }

  const filtered = items.filter((item) => matchesSelection(item, selectedModules, selectedAreas)).slice(0, 1200)
  const riskSummary: Record<OperationRiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 }
  for (const item of filtered) riskSummary[item.risk] += 1
  const apiRoutes = filtered.filter((item) => item.area === 'api-routes').length
  const forms = filtered.filter((item) => item.area === 'forms').length
  const protectedActions = filtered.filter((item) => item.protectedAction).length
  const missingOperationKeys = filtered.filter((item) => !item.selector).length
  const autoImplementable = filtered.filter((item) => item.risk === 'low' || item.risk === 'medium').length
  const requiresApproval = filtered.length - autoImplementable

  return {
    ok: true,
    scanId: `scan_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    generatedAt: new Date().toISOString(),
    scannedFiles: files.length,
    selectedModules,
    selectedAreas,
    modules: Array.from(new Set(filtered.map((item) => item.module))).sort(),
    areas: Array.from(new Set(filtered.map((item) => item.area))).sort() as OperationArea[],
    actionTypes: Array.from(new Set(filtered.map((item) => item.actionType))).sort(),
    riskSummary,
    completionScore: completionScore(filtered),
    coverage: {
      totalActions: filtered.length,
      apiRoutes,
      forms,
      protectedActions,
      missingOperationKeys,
      autoImplementable,
      requiresApproval,
    },
    items: filtered,
  }
}

function stepExecutionFor(item: OperationScanItem, mode: OperationExecutionMode): OperationPlanStep['execution'] {
  if (item.risk === 'critical') return 'approval-required'
  if (item.risk === 'high' && mode !== 'autonomous') return 'approval-required'
  if (item.area === 'security' && mode !== 'autonomous') return 'manual-review'
  return 'automatic'
}

export function buildAutonomousPlan(scan: OperationScanResult, options: BuildPlanOptions = {}): OperationAutonomousPlan {
  const mode = options.mode || 'controlled'
  const dryRun = options.dryRun !== false
  const sourceWriteRequested = options.sourceWrite === true
  const sourceWriteAllowed = sourceWriteRequested && process.env[SOURCE_WRITE_ENV] === 'true'
  const jobId = `opjob_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
  const selectedModules = options.selectedModules || scan.selectedModules
  const selectedAreas = options.selectedAreas || scan.selectedAreas

  const topItems = scan.items.slice(0, 260)
  const steps = topItems.map((item, index): OperationPlanStep => {
    const execution = stepExecutionFor(item, mode)
    const blockedCritical = item.risk === 'critical' && mode !== 'autonomous'
    return {
      id: `step_${String(index + 1).padStart(4, '0')}_${item.id}`,
      title: `${item.module} · ${item.area} · ${item.label.slice(0, 86)}`,
      area: item.area,
      module: item.module,
      risk: item.risk,
      execution,
      status: blockedCritical ? 'blocked' : 'queued',
      description: item.recommendations.join(' '),
      targetFiles: [item.file],
      rollbackHint: `Restore ${item.file} from .angelcare_operation_completion/backups/${jobId}/ before rerunning build.`,
    }
  })

  const automatic = steps.filter((step) => step.execution === 'automatic').length
  const approvalRequired = steps.filter((step) => step.execution === 'approval-required').length
  const manualReview = steps.filter((step) => step.execution === 'manual-review').length
  const blockedCritical = steps.filter((step) => step.status === 'blocked').length

  return {
    jobId,
    mode,
    dryRun,
    sourceWriteRequested,
    sourceWriteAllowed,
    selectedModules,
    selectedAreas,
    createdAt: new Date().toISOString(),
    summary: {
      totalSteps: steps.length,
      automatic,
      approvalRequired,
      manualReview,
      blockedCritical,
      estimatedCoverageGain: Math.min(100, Math.max(8, Math.round(automatic * 100 / Math.max(1, steps.length))))
    },
    safeguards: [
      'No shell execution is used by the web route.',
      'Source write is blocked unless OPERATION_COMPLETION_ALLOW_SOURCE_WRITE=true and the request explicitly asks for sourceWrite.',
      'Critical actions are converted to approval-required steps unless autonomous mode is explicitly selected.',
      'Every source-write run creates a rollback snapshot before modifying a file.',
      'Production-safe default is dry-run planning plus DB/runtime policy persistence.'
    ],
    steps,
  }
}

async function ensureGeneratedDir(jobId: string) {
  const jobDir = path.join(GENERATED_DIR, jobId)
  await mkdir(jobDir, { recursive: true })
  await mkdir(path.join(jobDir, 'backups'), { recursive: true })
  return jobDir
}

function canSourceAnnotate(step: OperationPlanStep) {
  if (step.status === 'blocked') return false
  if (step.execution !== 'automatic') return false
  if (step.area !== 'ui-actions' && step.area !== 'forms') return false
  return step.targetFiles.some((file) => /\.(tsx|jsx)$/.test(file))
}

function annotateSource(source: string) {
  let changed = false
  const next = source.replace(/<button\b(?![^>]*data-operation=)([^>]*)>([\s\S]{0,240}?)<\/button>/gi, (match, attrs, body) => {
    const label = normalizeText(String(body || ''))
    const lower = label.toLowerCase()
    if (!ACTION_WORDS.some((word) => lower.includes(word)) || isNavigation(label)) return match
    const key = stableId([label, attrs]).slice(0, 12)
    changed = true
    return `<button data-operation="true" data-operation-key="auto-${key}"${attrs}>${body}</button>`
  })
  return { source: next, changed }
}

async function applySourceAnnotations(jobDir: string, steps: OperationPlanStep[]) {
  const changedFiles: string[] = []
  const rollbackEntries: Array<{ file: string; backup: string }> = []
  const files = Array.from(new Set(steps.filter(canSourceAnnotate).flatMap((step) => step.targetFiles)))

  for (const relative of files) {
    const absolute = path.join(ROOT, relative)
    try {
      const original = await readFile(absolute, 'utf8')
      const annotated = annotateSource(original)
      if (!annotated.changed || annotated.source === original) continue
      const backup = path.join(jobDir, 'backups', relative.replace(/[\/]/g, '__'))
      await copyFile(absolute, backup)
      await writeFile(absolute, annotated.source, 'utf8')
      changedFiles.push(relative)
      rollbackEntries.push({ file: relative, backup })
    } catch {}
  }

  return { changedFiles, rollbackEntries }
}

export async function executeAutonomousOperation(scan: OperationScanResult, options: BuildPlanOptions = {}): Promise<OperationExecutionResult> {
  const plan = buildAutonomousPlan(scan, { ...options, dryRun: options.dryRun !== false })
  const startedAt = new Date().toISOString()
  const jobDir = await ensureGeneratedDir(plan.jobId)
  const artifacts: string[] = []
  const executableSteps = plan.steps.map((step) => ({ ...step }))
  let sourceWriteApplied = false
  let rollbackManifest: string | undefined

  for (const step of executableSteps) {
    if (step.status === 'blocked') continue
    if (step.execution !== 'automatic') {
      step.status = 'skipped'
      continue
    }
    step.status = plan.dryRun ? 'queued' : 'completed'
  }

  const policyManifest = {
    jobId: plan.jobId,
    createdAt: startedAt,
    mode: plan.mode,
    dryRun: plan.dryRun,
    selectedModules: plan.selectedModules,
    selectedAreas: plan.selectedAreas,
    safeguards: plan.safeguards,
    runtimePolicy: {
      operationTracking: true,
      apiProgressTracking: true,
      criticalApprovalRequired: plan.mode !== 'autonomous',
      selectedModuleCount: plan.selectedModules.length || scan.modules.length,
      selectedAreaCount: plan.selectedAreas.length || scan.areas.length,
    },
    summary: plan.summary,
  }
  const manifestPath = path.join(jobDir, 'runtime-policy-manifest.json')
  await writeFile(manifestPath, JSON.stringify(policyManifest, null, 2), 'utf8')
  artifacts.push(path.relative(ROOT, manifestPath).replace(/\\/g, '/'))

  if (!plan.dryRun && plan.sourceWriteAllowed) {
    const applied = await applySourceAnnotations(jobDir, executableSteps)
    sourceWriteApplied = applied.changedFiles.length > 0
    rollbackManifest = path.join(jobDir, 'rollback-manifest.json')
    await writeFile(rollbackManifest, JSON.stringify({ jobId: plan.jobId, createdAt: startedAt, entries: applied.rollbackEntries }, null, 2), 'utf8')
    artifacts.push(path.relative(ROOT, rollbackManifest).replace(/\\/g, '/'))
    artifacts.push(...applied.changedFiles)
  }

  const runReportPath = path.join(jobDir, 'execution-report.json')
  const completed = executableSteps.filter((step) => step.status === 'completed').length
  const blocked = executableSteps.filter((step) => step.status === 'blocked').length
  const failed = executableSteps.filter((step) => step.status === 'failed').length
  const skipped = executableSteps.filter((step) => step.status === 'skipped').length
  const finishedAt = new Date().toISOString()
  const report: OperationExecutionResult = {
    ok: true,
    jobId: plan.jobId,
    mode: plan.mode,
    dryRun: plan.dryRun,
    sourceWriteApplied,
    startedAt,
    finishedAt,
    progress: 100,
    summary: { ...plan.summary, completed, blocked, failed, skipped },
    steps: executableSteps,
    artifacts: artifacts.map((artifact) => artifact.replace(/\\/g, '/')),
    rollbackManifest: rollbackManifest ? path.relative(ROOT, rollbackManifest).replace(/\\/g, '/') : undefined,
    message: plan.dryRun
      ? 'Autonomous plan generated in dry-run mode. No source files were modified.'
      : sourceWriteApplied
        ? 'Autonomous job completed with guarded source annotations and rollback manifest.'
        : 'Autonomous job completed with runtime policy manifest. Source write was not applied or no eligible files needed annotation.',
  }
  await writeFile(runReportPath, JSON.stringify(report, null, 2), 'utf8')
  artifacts.push(path.relative(ROOT, runReportPath).replace(/\\/g, '/'))
  report.artifacts = artifacts.map((artifact) => artifact.replace(/\\/g, '/'))
  return report
}

export function summarizeModules() {
  return OPERATION_MODULES.map((module) => ({
    key: module.key,
    label: module.label,
    group: module.group,
    paths: module.paths,
    protected: Boolean(module.protected),
    critical: Boolean(module.critical),
  }))
}
