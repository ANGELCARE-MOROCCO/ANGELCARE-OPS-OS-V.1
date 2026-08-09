'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'

type Tone = 'blue' | 'green' | 'red' | 'amber' | 'slate' | 'purple'
type ManagerTab = 'overview' | 'scope' | 'scan' | 'execution' | 'history' | 'safeguards'
type Risk = 'low' | 'medium' | 'high' | 'critical'
type ExecutionMode = 'observe' | 'controlled' | 'strict' | 'autonomous'
type Area = 'ui-actions' | 'forms' | 'api-routes' | 'data-sync' | 'runtime-policy' | 'quality' | 'security' | 'performance'

type RegistryModule = {
  key: string
  label: string
  group: string
  paths: string[]
  protected: boolean
  critical: boolean
}

type DetectedAction = {
  id?: string
  label: string
  selector?: string
  type?: string
  module?: string
  file?: string
  actionType?: string
  confidence?: number
  area?: Area
  risk?: Risk
  method?: string
  endpoint?: string
  protectedAction?: boolean
  evidence?: string[]
  recommendations?: string[]
}

type ScanResult = {
  ok: true
  scanId: string
  generatedAt: string
  scannedFiles: number
  selectedModules: string[]
  selectedAreas: Area[]
  modules: string[]
  areas: Area[]
  actionTypes: string[]
  riskSummary: Record<Risk, number>
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
  items: DetectedAction[]
  registry?: {
    modules: RegistryModule[]
    areas: Area[]
  }
}

type PlanStep = {
  id: string
  title: string
  area: Area
  module: string
  risk: Risk
  execution: 'automatic' | 'approval-required' | 'manual-review'
  status: 'queued' | 'running' | 'completed' | 'blocked' | 'failed' | 'skipped'
  description: string
  targetFiles: string[]
  rollbackHint: string
}

type AutonomousPlan = {
  jobId: string
  mode: ExecutionMode
  dryRun: boolean
  sourceWriteRequested: boolean
  sourceWriteAllowed: boolean
  selectedModules: string[]
  selectedAreas: Area[]
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
  steps: PlanStep[]
}

type ExecutionResult = {
  ok: true
  jobId: string
  mode: ExecutionMode
  dryRun: boolean
  sourceWriteApplied: boolean
  startedAt: string
  finishedAt: string
  progress: number
  summary: AutonomousPlan['summary'] & { completed: number; blocked: number; failed: number; skipped: number }
  steps: PlanStep[]
  artifacts: string[]
  rollbackManifest?: string
  message: string
}

type EngineSettings = {
  enabled: boolean
  autoScan: boolean
  fetchTracking: boolean
  moduleOverrides: Record<string, boolean>
  actionRules: Record<string, boolean>
}

const STORAGE_KEY = 'angelcare.operationCompletionEngine.autonomous.v2'

const AREAS: Area[] = ['ui-actions', 'forms', 'api-routes', 'data-sync', 'runtime-policy', 'quality', 'security', 'performance']

const DEFAULT_MODULES: RegistryModule[] = [
  { key: 'ac360', label: 'AC360 Direction Cockpit', group: 'Executive Operations', paths: [], protected: false, critical: true },
  { key: 'carelink-ops', label: 'CareLink OPS Dispatch', group: 'Operations', paths: [], protected: false, critical: true },
  { key: 'carelink', label: 'CareLink Mobile App', group: 'Mobile Execution', paths: [], protected: false, critical: true },
  { key: 'users', label: 'Users, Access & Attendance', group: 'Security / HR', paths: [], protected: false, critical: true },
  { key: 'market-os', label: 'Market OS', group: 'Commercial Growth', paths: [], protected: false, critical: false },
  { key: 'b2b-partnerships', label: 'B2B Partnerships', group: 'Sales / Partnerships', paths: [], protected: false, critical: false },
  { key: 'capital-command-center', label: 'Capital Command Center', group: 'Fundraising', paths: [], protected: false, critical: false },
  { key: 'email-os', label: 'Email OS Core', group: 'Communication', paths: [], protected: false, critical: true },
  { key: 'academy', label: 'Academy / Training', group: 'Training Business', paths: [], protected: false, critical: false },
  { key: 'service-os', label: 'Service OS', group: 'Service Operations', paths: [], protected: false, critical: false },
  { key: 'system-control', label: 'System Control', group: 'Runtime Governance', paths: [], protected: true, critical: true },
  { key: 'operation-completion', label: 'Global Operation Completion Engine', group: 'OPSOS Runtime', paths: [], protected: true, critical: true },
]

const DEFAULT_SETTINGS: EngineSettings = {
  enabled: true,
  autoScan: true,
  fetchTracking: true,
  moduleOverrides: {},
  actionRules: {
    save: true,
    create: true,
    delete: true,
    restore: true,
    suspend: true,
    import: true,
    approval: true,
    sync: true,
    execute: true,
    send: true,
    document: true,
    action: true,
  },
}

const ACTION_WORDS = [
  'save', 'enregistrer', 'delete', 'supprimer', 'create', 'créer', 'submit', 'valider', 'validate', 'execute', 'run', 'launch',
  'import', 'export', 'upload', 'restore', 'suspend', 'confirm', 'approve', 'reject', 'archive', 'send', 'sync', 'refresh',
  'assign', 'dispatch', 'duplicate', 'generate', 'print', 'repair', 'rollback', 'optimize',
]

const NAV_WORDS = ['retour', 'back', 'profile', 'attendance dashboard', 'overview', 'settings', 'next', 'previous', 'open', 'view', 'show', 'cancel']

const palette: Record<Tone, { bg: string; color: string; border: string; solid: string; soft: string }> = {
  blue: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', solid: '#2563eb', soft: '#f8fbff' },
  green: { bg: '#ecfdf5', color: '#047857', border: '#bbf7d0', solid: '#22c55e', soft: '#f0fdf4' },
  red: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', solid: '#ef4444', soft: '#fff5f5' },
  amber: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', solid: '#f59e0b', soft: '#fffaf0' },
  slate: { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', solid: '#64748b', soft: '#ffffff' },
  purple: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe', solid: '#7c3aed', soft: '#fbfaff' },
}

function readSettings(): EngineSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<EngineSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      actionRules: { ...DEFAULT_SETTINGS.actionRules, ...(parsed.actionRules || {}) },
      moduleOverrides: { ...(parsed.moduleOverrides || {}) },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: EngineSettings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

function currentModuleFromPath() {
  if (typeof window === 'undefined') return 'unknown'
  const parts = window.location.pathname.split('/').filter(Boolean)
  if (!parts.length) return 'home'
  if (parts[0] === 'users' && parts[2] === 'edit') return 'users'
  if (parts[0] === 'carelink-ops') return 'carelink-ops'
  if (parts[0] === 'carelink') return 'carelink'
  if (parts[0] === 'traininghub') return 'academy'
  return parts[0]
}

function textOf(element: Element | null) {
  return String(element?.textContent || '').replace(/\s+/g, ' ').trim()
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

function isProbablyNavigation(element: Element) {
  const label = textOf(element).toLowerCase()
  if (element.closest('a')) return true
  if (element.closest('nav')) return true
  if (element.getAttribute('role') === 'tab') return true
  if (element.closest('[role="tablist"]')) return true
  return NAV_WORDS.some((word) => label === word || label.includes(word))
}

function isExecutionAction(element: Element) {
  const label = textOf(element).toLowerCase()
  const tag = element.tagName.toLowerCase()
  const type = (element as HTMLButtonElement).type
  if (!label) return false
  if (isProbablyNavigation(element)) return false
  if (element.getAttribute('data-operation') === 'true' || element.getAttribute('data-operation-key')) return true
  const insideForm = Boolean(element.closest('form'))
  const submitButton = tag === 'button' && (type === 'submit' || !type) && insideForm
  return submitButton || ACTION_WORDS.some((word) => label.includes(word))
}

function scanCurrentPage(): DetectedAction[] {
  if (typeof document === 'undefined') return []
  const elements = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], [data-operation="true"], [data-operation-key]'))
  return elements
    .filter(isExecutionAction)
    .map((element, index) => {
      const label = textOf(element) || 'Execution action'
      return {
        id: `dom-${index}`,
        label,
        selector: element.getAttribute('data-operation-key') || element.getAttribute('id') || `button:nth-action-${index + 1}`,
        type: element.closest('form') ? 'form-submit' : 'button-action',
        module: currentModuleFromPath(),
        actionType: classifyAction(label),
        confidence: element.getAttribute('data-operation-key') ? 99 : 86,
        area: element.closest('form') ? 'forms' : 'ui-actions',
        risk: /delete|supprimer|suspend|archive|rollback/i.test(label) ? 'high' : 'low',
      } satisfies DetectedAction
    })
    .slice(0, 140)
}

function stagesFor(actionType: string, label: string) {
  const verbMap: Record<string, string> = {
    save: 'Save',
    create: 'Create',
    delete: 'Delete',
    restore: 'Restore',
    suspend: 'Suspend',
    import: 'Import',
    approval: 'Approve',
    sync: 'Sync',
    execute: 'Execute',
    send: 'Send',
    document: 'Generate',
    action: 'Execute',
  }
  const verb = verbMap[actionType] || 'Execute'
  return [
    `Preflight ${verb.toLowerCase()} request`,
    `Authorize ${verb.toLowerCase()} operation`,
    `${verb} synchronized records`,
    `Write audit and refresh module state`,
    `${label} completed`,
  ]
}

function toneForProgress(progress: number, failed = false): Tone {
  if (failed) return 'red'
  if (progress >= 100) return 'green'
  if (progress >= 70) return 'blue'
  if (progress >= 35) return 'amber'
  return 'slate'
}

function riskTone(risk?: Risk): Tone {
  if (risk === 'critical') return 'red'
  if (risk === 'high') return 'amber'
  if (risk === 'medium') return 'blue'
  return 'green'
}

export function OperationCompletionManagerButton() {
  return (
    <>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('angelcare:open-operation-manager'))}
        style={managerButtonStyle}
      >
        Operation Completion Engine V2
      </button>
      <OperationCompletionEngine />
    </>
  )
}

export default function OperationCompletionEngine() {
  const [settings, setSettings] = useState<EngineSettings>(DEFAULT_SETTINGS)
  const [managerOpen, setManagerOpen] = useState(false)
  const [tab, setTab] = useState<ManagerTab>('overview')
  const [currentActions, setCurrentActions] = useState<DetectedAction[]>([])
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [plan, setPlan] = useState<AutonomousPlan | null>(null)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModules, setSelectedModules] = useState<string[]>(['carelink-ops', 'carelink', 'users', 'ac360', 'email-os', 'operation-completion'])
  const [selectedAreas, setSelectedAreas] = useState<Area[]>(['ui-actions', 'forms', 'api-routes', 'data-sync', 'runtime-policy', 'security'])
  const [mode, setMode] = useState<ExecutionMode>('controlled')
  const [dryRun, setDryRun] = useState(true)
  const [sourceWrite, setSourceWrite] = useState(false)
  const [operation, setOperation] = useState<{
    title: string
    actionType: string
    progress: number
    stages: string[]
    failed?: boolean
    result?: string
  } | null>(null)

  const moduleKey = useMemo(currentModuleFromPath, [])
  const registryModules = scan?.registry?.modules?.length ? scan.registry.modules : DEFAULT_MODULES
  const allAreas = scan?.registry?.areas?.length ? scan.registry.areas : AREAS
  const moduleEnabled = settings.moduleOverrides[moduleKey] ?? true
  const active = settings.enabled && moduleEnabled
  const appItems = scan?.items || []
  const riskSummary = scan?.riskSummary || { low: 0, medium: 0, high: 0, critical: 0 }

  function updateSettings(next: EngineSettings) {
    setSettings(next)
    saveSettings(next)
  }

  function refreshCurrentScan() {
    setCurrentActions(scanCurrentPage())
  }

  function toggleModule(module: string) {
    setSelectedModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module])
  }

  function toggleArea(area: Area) {
    setSelectedAreas((current) => current.includes(area) ? current.filter((item) => item !== area) : [...current, area])
  }

  function startOperation(label: string, actionType = classifyAction(label)) {
    if (!active) return
    if (settings.actionRules[actionType] === false) return
    setOperation({ title: label, actionType, progress: 8, stages: stagesFor(actionType, label) })
    const ticks = [18, 36, 58, 82, 100]
    ticks.forEach((value, index) => {
      window.setTimeout(() => {
        setOperation((current) => current ? { ...current, progress: value, result: value >= 100 ? `${current.title} completed successfully.` : current.result } : current)
      }, 180 + index * 360)
    })
  }

  async function runScan() {
    setBusy(true)
    setError(null)
    setPlan(null)
    setResult(null)
    try {
      const response = await fetch('/api/operation-completion/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedModules, selectedAreas, maxFiles: 1800 }),
      })
      const json = await response.json()
      if (!response.ok || !json?.ok) throw new Error(json?.error || `Scan failed with ${response.status}`)
      setScan(json as ScanResult)
      setTab('scan')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed.')
    } finally {
      setBusy(false)
    }
  }

  async function runAutonomous(action: 'plan' | 'execute') {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/operation-completion/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, selectedModules, selectedAreas, mode, dryRun, sourceWrite, maxFiles: 1800 }),
      })
      const json = await response.json()
      if (!response.ok || !json?.ok) throw new Error(json?.error || `${action} failed with ${response.status}`)
      if (json.scan) setScan(json.scan as ScanResult)
      if (json.plan) setPlan(json.plan as AutonomousPlan)
      if (json.result) {
        setResult(json.result as ExecutionResult)
        setPlan(null)
      }
      setTab('execution')
    } catch (err) {
      setError(err instanceof Error ? err.message : `${action} failed.`)
    } finally {
      setBusy(false)
    }
  }

  async function loadHistory() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/operation-completion/autonomous', { cache: 'no-store' })
      const json = await response.json()
      if (!response.ok || !json?.ok) throw new Error(json?.error || `History failed with ${response.status}`)
      setHistory(Array.isArray(json.jobs) ? json.jobs : [])
      setTab('history')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'History failed.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    setSettings(readSettings())
    window.setTimeout(refreshCurrentScan, 300)
    const open = () => {
      refreshCurrentScan()
      setManagerOpen(true)
    }
    window.addEventListener('angelcare:open-operation-manager', open)
    return () => window.removeEventListener('angelcare:open-operation-manager', open)
  }, [])

  useEffect(() => {
    if (!settings.autoScan || !active) return
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const button = target?.closest('button, [role="button"], input[type="submit"], [data-operation="true"], [data-operation-key]')
      if (!button || !isExecutionAction(button)) return
      const label = textOf(button) || 'Execution action'
      startOperation(label, classifyAction(label))
    }
    const onSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement | null
      if (!form) return
      const submitter = (event as SubmitEvent & { submitter?: HTMLElement }).submitter
      const label = textOf(submitter || form) || form.getAttribute('aria-label') || 'Form submission'
      startOperation(label, classifyAction(label))
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('submit', onSubmit, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('submit', onSubmit, true)
    }
  }, [active, settings])

  useEffect(() => {
    if (!settings.fetchTracking || !active) return
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const method = typeof args[1]?.method === 'string' ? args[1].method.toUpperCase() : 'GET'
      const shouldTrack = method !== 'GET' && method !== 'HEAD'
      if (shouldTrack) startOperation(`${method} API execution`, 'execute')
      try {
        const response = await originalFetch(...args)
        if (shouldTrack && !response.ok) {
          setOperation((current) => current ? { ...current, failed: true, progress: 100, result: `Operation failed with status ${response.status}.` } : current)
        }
        return response
      } catch (err) {
        if (shouldTrack) {
          setOperation((current) => current ? { ...current, failed: true, progress: 100, result: err instanceof Error ? err.message : 'Operation failed.' } : current)
        }
        throw err
      }
    }
    return () => {
      window.fetch = originalFetch
    }
  }, [active, settings.fetchTracking])

  const tone = toneForProgress(operation?.progress || 0, operation?.failed)
  const currentPalette = palette[tone]
  const executionRows = result?.steps || plan?.steps || []

  return (
    <>
      {operation ? (
        <aside style={{ ...toastStyle, border: `1px solid ${currentPalette.border}` }}>
          <div style={toastHeadStyle}>
            <div>
              <div style={eyebrowStyle}>Native execution progress</div>
              <strong style={toastTitleStyle}>{operation.title}</strong>
            </div>
            <button type="button" onClick={() => setOperation(null)} style={closeButtonStyle}>×</button>
          </div>
          <div>
            <div style={progressTopStyle}>
              <strong style={progressNumberStyle}>{operation.progress}%</strong>
              <span style={{ ...statusChipStyle, background: currentPalette.bg, color: currentPalette.color, border: `1px solid ${currentPalette.border}` }}>
                {operation.failed ? 'FAILED' : operation.progress >= 100 ? 'SUCCESS' : 'RUNNING'}
              </span>
            </div>
            <div style={trackStyle}><div style={{ width: `${operation.progress}%`, height: '100%', background: currentPalette.solid, borderRadius: 999 }} /></div>
          </div>
          <div style={stageListStyle}>
            {operation.stages.map((stage, index) => {
              const threshold = [10, 35, 60, 85, 100][index]
              const done = operation.progress >= threshold
              return <div key={stage} style={stageItemStyle}><span>{done ? '✓' : '○'}</span><span>{stage}</span><strong>{threshold}%</strong></div>
            })}
          </div>
          {operation.result ? <div style={resultBoxStyle}>{operation.result}</div> : null}
        </aside>
      ) : null}

      {managerOpen ? (
        <div style={modalOverlayStyle}>
          <section style={modalStyle}>
            <div style={managerHeaderStyle}>
              <div>
                <div style={blueEyebrowStyle}>OPSOS runtime control plane · V2 autonomous core</div>
                <h2 style={managerTitleStyle}>Global Operation Completion Engine</h2>
                <p style={managerSubtitleStyle}>
                  Enterprise scan, selected-module execution planning, API/action governance, audit persistence, rollback manifests and guarded implementation.
                </p>
              </div>
              <button type="button" onClick={() => setManagerOpen(false)} style={closeBigStyle}>×</button>
            </div>

            <div style={tabRowStyle}>
              {(['overview', 'scope', 'scan', 'execution', 'history', 'safeguards'] as ManagerTab[]).map((item) => (
                <button key={item} type="button" onClick={() => item === 'history' ? loadHistory() : setTab(item)} style={tab === item ? tabActiveStyle : tabStyle}>
                  {item === 'overview' ? 'Overview' : item === 'scope' ? 'Modules & Areas' : item === 'scan' ? 'Action Scan' : item === 'execution' ? 'Autonomous Execution' : item === 'history' ? 'History' : 'Safeguards'}
                </button>
              ))}
            </div>

            {error ? <div style={errorBoxStyle}>{error}</div> : null}

            {tab === 'overview' ? (
              <div style={sectionGridStyle}>
                <div style={statGridStyle}>
                  <ManagerStat label="Current module" value={moduleKey} />
                  <ManagerStat label="Current DOM actions" value={String(currentActions.length)} />
                  <ManagerStat label="Server scan actions" value={String(scan?.coverage.totalActions || 0)} />
                  <ManagerStat label="Scanned files" value={String(scan?.scannedFiles || 0)} />
                  <ManagerStat label="Completion score" value={`${scan?.completionScore ?? 0}%`} />
                  <ManagerStat label="Engine" value={settings.enabled ? 'Enabled' : 'Disabled'} />
                </div>

                <div style={commandStripStyle}>
                  <button type="button" onClick={refreshCurrentScan} style={managerSecondaryButtonStyle}>Scan current page</button>
                  <button type="button" onClick={runScan} style={managerPrimaryButtonStyle}>{busy ? 'Scanning...' : 'Run enterprise scan'}</button>
                  <button type="button" onClick={() => runAutonomous('plan')} style={managerDarkButtonStyle}>{busy ? 'Planning...' : 'Generate autonomous plan'}</button>
                  <button type="button" onClick={() => runAutonomous('execute')} style={dangerButtonStyle}>{busy ? 'Executing...' : dryRun ? 'Execute dry-run' : 'Execute controlled job'}</button>
                </div>

                <div style={toggleGridStyle}>
                  <ToggleCard title="Enable global engine" detail="Turns native operation progress tracking on/off everywhere." enabled={settings.enabled} onClick={() => updateSettings({ ...settings, enabled: !settings.enabled })} />
                  <ToggleCard title={`Enable on ${moduleKey}`} detail="Controls this module separately from the global engine." enabled={moduleEnabled} onClick={() => updateSettings({ ...settings, moduleOverrides: { ...settings.moduleOverrides, [moduleKey]: !moduleEnabled } })} />
                  <ToggleCard title="Auto scan current page" detail="Detects buttons, forms and data-operation keys in the active screen." enabled={settings.autoScan} onClick={() => updateSettings({ ...settings, autoScan: !settings.autoScan })} />
                  <ToggleCard title="Track non-GET API execution" detail="Shows real progress for POST/PATCH/PUT/DELETE fetch requests." enabled={settings.fetchTracking} onClick={() => updateSettings({ ...settings, fetchTracking: !settings.fetchTracking })} />
                </div>
              </div>
            ) : null}

            {tab === 'scope' ? (
              <div style={twoColumnStyle}>
                <div style={panelStyle}>
                  <PanelTitle title="Selected modules" subtitle="Choose where the autonomous scanner and implementation manager may operate." />
                  <div style={moduleGridStyle}>
                    {registryModules.map((module) => {
                      const selected = selectedModules.includes(module.key)
                      return (
                        <button key={module.key} type="button" onClick={() => toggleModule(module.key)} style={{ ...moduleCardStyle, borderColor: selected ? '#2563eb' : '#e2e8f0', background: selected ? '#eff6ff' : '#fff' }}>
                          <span style={moduleTopStyle}>
                            <strong>{module.label}</strong>
                            <span style={{ ...pillStyle, background: module.critical ? '#fef2f2' : '#f8fafc', color: module.critical ? '#b91c1c' : '#475569' }}>{module.critical ? 'Critical' : 'Standard'}</span>
                          </span>
                          <small>{module.group}</small>
                          <em>{selected ? 'Included in execution scope' : 'Excluded'}</em>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={panelStyle}>
                  <PanelTitle title="Operational areas" subtitle="Limit the action engine to precise surfaces: UI, API, data sync, runtime governance, security or performance." />
                  <div style={areaGridStyle}>
                    {allAreas.map((area) => {
                      const selected = selectedAreas.includes(area)
                      return <button key={area} type="button" onClick={() => toggleArea(area)} style={selected ? areaSelectedStyle : areaStyle}>{area}</button>
                    })}
                  </div>
                  <div style={executionModeBoxStyle}>
                    <label style={labelStyle}>Execution mode</label>
                    <select value={mode} onChange={(event) => setMode(event.target.value as ExecutionMode)} style={selectStyle}>
                      <option value="observe">Observe only</option>
                      <option value="controlled">Controlled</option>
                      <option value="strict">Strict approval</option>
                      <option value="autonomous">Autonomous guarded</option>
                    </select>
                    <ToggleCard title="Dry-run by default" detail="Generate policy, plan and job report without modifying source files." enabled={dryRun} onClick={() => setDryRun(!dryRun)} />
                    <ToggleCard title="Request local source annotation" detail="Only works if OPERATION_COMPLETION_ALLOW_SOURCE_WRITE=true on the server." enabled={sourceWrite} onClick={() => setSourceWrite(!sourceWrite)} />
                  </div>
                </div>
              </div>
            ) : null}

            {tab === 'scan' ? (
              <div style={sectionGridStyle}>
                <div style={statGridStyle}>
                  <ManagerStat label="Low risk" value={String(riskSummary.low)} />
                  <ManagerStat label="Medium risk" value={String(riskSummary.medium)} />
                  <ManagerStat label="High risk" value={String(riskSummary.high)} />
                  <ManagerStat label="Critical risk" value={String(riskSummary.critical)} />
                  <ManagerStat label="API routes" value={String(scan?.coverage.apiRoutes || 0)} />
                  <ManagerStat label="Requires approval" value={String(scan?.coverage.requiresApproval || 0)} />
                </div>
                <ActionList title="Current page native actions" actions={currentActions} />
                <ActionList title="Enterprise server scan results" actions={appItems} />
              </div>
            ) : null}

            {tab === 'execution' ? (
              <div style={sectionGridStyle}>
                <div style={commandStripStyle}>
                  <button type="button" onClick={() => runAutonomous('plan')} style={managerPrimaryButtonStyle}>{busy ? 'Planning...' : 'Generate plan'}</button>
                  <button type="button" onClick={() => runAutonomous('execute')} style={dangerButtonStyle}>{busy ? 'Executing...' : dryRun ? 'Run safe dry-run' : 'Execute guarded implementation'}</button>
                </div>

                {plan ? <ExecutionSummary title="Plan summary" plan={plan} /> : null}
                {result ? <ResultSummary result={result} /> : null}
                <StepList steps={executionRows} />
              </div>
            ) : null}

            {tab === 'history' ? (
              <div style={scanListStyle}>
                <PanelTitle title="Autonomous execution history" subtitle="Reads from operation_completion_jobs after the SQL migration is installed." />
                {history.length ? history.map((job, index) => (
                  <div key={job.id || index} style={scanItemStyle}>
                    <div>
                      <strong>{job.id || `Job ${index + 1}`}</strong>
                      <small>{job.status || 'completed'} · {job.mode || 'controlled'} · {job.created_at || job.started_at || 'local'}</small>
                    </div>
                    <span style={pillStyle}>{job.progress ?? 100}%</span>
                  </div>
                )) : <div style={emptyStyle}>No persisted history yet. Apply the SQL migration, then run an execution job.</div>}
              </div>
            ) : null}

            {tab === 'safeguards' ? (
              <div style={twoColumnStyle}>
                <div style={panelStyle}>
                  <PanelTitle title="Hard safety rules" subtitle="This is autonomous, but it is not reckless." />
                  <ul style={bulletListStyle}>
                    <li>No shell execution from the browser route.</li>
                    <li>Critical actions require approval outside autonomous guarded mode.</li>
                    <li>Source write is blocked unless the server env explicitly allows it.</li>
                    <li>Every source-write run creates rollback files and a manifest.</li>
                    <li>SQL persistence records scans, jobs, steps, approvals and audit events.</li>
                  </ul>
                </div>
                <div style={panelStyle}>
                  <PanelTitle title="Production growth readiness" subtitle="Designed for enterprise expansion across AngelCare modules." />
                  <ul style={bulletListStyle}>
                    <li>Module adapters cover CareLink, AC360, Users, Market OS, Academy, Email OS and more.</li>
                    <li>Area targeting prevents global uncontrolled changes.</li>
                    <li>Risk classifier separates low/medium automatic steps from high/critical approvals.</li>
                    <li>Runtime policy manifest becomes the operational source of truth per run.</li>
                    <li>Execution reports can be used for QA, deployment gates and investor-grade proof.</li>
                  </ul>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  )
}

function PanelTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div><h3 style={panelTitleStyle}>{title}</h3><p style={panelSubtitleStyle}>{subtitle}</p></div>
}

function ExecutionSummary({ title, plan }: { title: string; plan: AutonomousPlan }) {
  return (
    <div style={summaryCardStyle}>
      <PanelTitle title={title} subtitle={`Job ${plan.jobId} · ${plan.mode} · ${plan.dryRun ? 'dry-run' : 'execution requested'}`} />
      <div style={statGridStyle}>
        <ManagerStat label="Total steps" value={String(plan.summary.totalSteps)} />
        <ManagerStat label="Automatic" value={String(plan.summary.automatic)} />
        <ManagerStat label="Approvals" value={String(plan.summary.approvalRequired)} />
        <ManagerStat label="Manual review" value={String(plan.summary.manualReview)} />
        <ManagerStat label="Blocked critical" value={String(plan.summary.blockedCritical)} />
        <ManagerStat label="Coverage gain" value={`${plan.summary.estimatedCoverageGain}%`} />
      </div>
      <div style={noticeStyle}>{plan.sourceWriteAllowed ? 'Source write is allowed by environment and request.' : 'Source write is guarded off unless OPERATION_COMPLETION_ALLOW_SOURCE_WRITE=true.'}</div>
    </div>
  )
}

function ResultSummary({ result }: { result: ExecutionResult }) {
  return (
    <div style={summaryCardStyle}>
      <PanelTitle title="Execution result" subtitle={`${result.jobId} · ${result.message}`} />
      <div style={statGridStyle}>
        <ManagerStat label="Completed" value={String(result.summary.completed)} />
        <ManagerStat label="Skipped" value={String(result.summary.skipped)} />
        <ManagerStat label="Blocked" value={String(result.summary.blocked)} />
        <ManagerStat label="Failed" value={String(result.summary.failed)} />
        <ManagerStat label="Progress" value={`${result.progress}%`} />
        <ManagerStat label="Source write" value={result.sourceWriteApplied ? 'Applied' : 'No'} />
      </div>
      <div style={artifactGridStyle}>{result.artifacts.map((artifact) => <code key={artifact} style={codePillStyle}>{artifact}</code>)}</div>
    </div>
  )
}

function StepList({ steps }: { steps: PlanStep[] }) {
  return (
    <div style={scanListStyle}>
      <PanelTitle title="Execution steps" subtitle="Each step is scoped by module, area, risk and target file." />
      {steps.length ? steps.slice(0, 180).map((step) => {
        const tone = palette[riskTone(step.risk)]
        return (
          <div key={step.id} style={scanItemStyle}>
            <div>
              <strong>{step.title}</strong>
              <small>{step.execution} · {step.status} · {step.targetFiles.join(', ')}</small>
            </div>
            <span style={{ ...pillStyle, background: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}>{step.risk}</span>
          </div>
        )
      }) : <div style={emptyStyle}>No plan yet. Generate an autonomous plan first.</div>}
    </div>
  )
}

function ActionList({ title, actions }: { title: string; actions: DetectedAction[] }) {
  return (
    <div style={scanListStyle}>
      <PanelTitle title={title} subtitle={`${actions.length} detected item${actions.length === 1 ? '' : 's'}.`} />
      {actions.length ? actions.slice(0, 220).map((action, index) => {
        const tone = palette[riskTone(action.risk)]
        return (
          <div key={`${action.id || action.label}-${action.file || action.selector}-${index}`} style={scanItemStyle}>
            <div>
              <strong>{action.label}</strong>
              <small>{action.file || action.selector} {action.evidence?.length ? `· ${action.evidence[0]}` : ''}</small>
            </div>
            <span style={{ ...pillStyle, background: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}>{action.module || action.type} · {action.area || 'ui'} · {action.risk || 'low'}</span>
          </div>
        )
      }) : <div style={emptyStyle}>No actions detected yet.</div>}
    </div>
  )
}

function ManagerStat({ label, value }: { label: string; value: string }) {
  return <div style={statCardStyle}><span>{label}</span><strong>{value}</strong></div>
}

function ToggleCard({ title, detail, enabled, onClick }: { title: string; detail: string; enabled: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ ...toggleCardStyle, border: enabled ? '1px solid #bbf7d0' : '1px solid #fecaca', background: enabled ? '#f0fdf4' : '#fff5f5' }}>
      <span><strong>{title}</strong><small>{detail}</small></span>
      <span style={{ ...toggleTrackStyle, background: enabled ? '#dcfce7' : '#fee2e2' }}><span style={{ ...toggleKnobStyle, marginLeft: enabled ? 34 : 0, background: enabled ? '#16a34a' : '#dc2626' }} /></span>
    </button>
  )
}

const managerButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 999, padding: '15px 22px', background: 'linear-gradient(135deg,#ffffff,#eff6ff)', color: '#0f172a', fontWeight: 1000, fontSize: 15, boxShadow: '0 16px 34px rgba(37,99,235,.12)', cursor: 'pointer', whiteSpace: 'nowrap' }
const toastStyle: CSSProperties = { position: 'fixed', right: 24, bottom: 24, zIndex: 9999, width: 410, borderRadius: 28, padding: 18, background: '#fff', boxShadow: '0 34px 90px rgba(15,23,42,.22)', display: 'grid', gap: 14 }
const toastHeadStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12 }
const eyebrowStyle: CSSProperties = { color: '#64748b', fontSize: 11, fontWeight: 1000, textTransform: 'uppercase', letterSpacing: '.12em' }
const blueEyebrowStyle: CSSProperties = { color: '#2563eb', fontSize: 12, fontWeight: 1000, textTransform: 'uppercase', letterSpacing: '.14em' }
const toastTitleStyle: CSSProperties = { display: 'block', marginTop: 4, color: '#0f172a', fontSize: 16, fontWeight: 1000 }
const closeButtonStyle: CSSProperties = { width: 32, height: 32, borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 1000 }
const progressTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }
const progressNumberStyle: CSSProperties = { color: '#0f172a', fontSize: 30, fontWeight: 1000 }
const statusChipStyle: CSSProperties = { borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 1000 }
const trackStyle: CSSProperties = { height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const stageListStyle: CSSProperties = { display: 'grid', gap: 8 }
const stageItemStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '24px minmax(0,1fr) 42px', gap: 8, alignItems: 'center', padding: 8, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontSize: 12, fontWeight: 850 }
const resultBoxStyle: CSSProperties = { padding: 12, borderRadius: 18, background: '#f0fdf4', color: '#047857', border: '1px solid #bbf7d0', fontSize: 12, fontWeight: 850 }
const modalOverlayStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,.42)', backdropFilter: 'blur(12px)', display: 'grid', placeItems: 'center', padding: 24 }
const modalStyle: CSSProperties = { width: 'min(1380px,100%)', maxHeight: '92vh', overflow: 'auto', borderRadius: 34, background: '#fff', border: '1px solid #dbeafe', boxShadow: '0 40px 120px rgba(15,23,42,.26)', padding: 24, display: 'grid', gap: 18 }
const managerHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16 }
const managerTitleStyle: CSSProperties = { margin: '8px 0 0', color: '#0f172a', fontSize: 32, fontWeight: 1000, letterSpacing: '-.05em' }
const managerSubtitleStyle: CSSProperties = { margin: '8px 0 0', color: '#64748b', fontSize: 14, fontWeight: 750, maxWidth: 850 }
const closeBigStyle: CSSProperties = { width: 44, height: 44, borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 1000, fontSize: 22 }
const tabRowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, padding: 10, borderRadius: 22, background: '#f8fafc', border: '1px solid #e2e8f0' }
const tabStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 999, padding: '11px 14px', background: '#fff', color: '#0f172a', fontWeight: 1000, cursor: 'pointer' }
const tabActiveStyle: CSSProperties = { ...tabStyle, background: 'linear-gradient(135deg,#2563eb,#0f172a)', color: '#fff' }
const sectionGridStyle: CSSProperties = { display: 'grid', gap: 14 }
const statGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }
const statCardStyle: CSSProperties = { padding: 14, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', gap: 5, color: '#64748b', fontSize: 11, fontWeight: 1000, textTransform: 'uppercase', letterSpacing: '.08em' }
const toggleGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const toggleCardStyle: CSSProperties = { textAlign: 'left', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 74px', gap: 12, padding: 16, borderRadius: 22, cursor: 'pointer' }
const toggleTrackStyle: CSSProperties = { alignSelf: 'center', height: 38, borderRadius: 999, padding: 4, border: '1px solid rgba(15,23,42,.08)' }
const toggleKnobStyle: CSSProperties = { display: 'block', width: 28, height: 28, borderRadius: 999, boxShadow: '0 10px 20px rgba(15,23,42,.16)', transition: 'all .2s ease' }
const commandStripStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', padding: 12, borderRadius: 22, background: '#f8fafc', border: '1px solid #e2e8f0' }
const managerPrimaryButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 15px', background: 'linear-gradient(135deg,#2563eb,#0f172a)', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const managerSecondaryButtonStyle: CSSProperties = { border: '1px solid #bfdbfe', borderRadius: 16, padding: '12px 15px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 1000, cursor: 'pointer' }
const managerDarkButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 15px', background: '#0f172a', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const dangerButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 15px', background: 'linear-gradient(135deg,#b91c1c,#0f172a)', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const scanListStyle: CSSProperties = { display: 'grid', gap: 10, maxHeight: 520, overflow: 'auto', padding: 12, borderRadius: 22, background: '#f8fafc', border: '1px solid #e2e8f0' }
const scanItemStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, padding: 12, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }
const pillStyle: CSSProperties = { justifySelf: 'end', alignSelf: 'center', borderRadius: 999, padding: '7px 10px', background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 1000, whiteSpace: 'nowrap' }
const emptyStyle: CSSProperties = { padding: 18, borderRadius: 18, background: '#fff', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
const twoColumnStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 14, alignItems: 'start' }
const panelStyle: CSSProperties = { display: 'grid', gap: 12, padding: 16, borderRadius: 26, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 16px 40px rgba(15,23,42,.06)' }
const panelTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 1000, letterSpacing: '-.03em' }
const panelSubtitleStyle: CSSProperties = { margin: '5px 0 0', color: '#64748b', fontSize: 12, fontWeight: 760 }
const moduleGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, maxHeight: 560, overflow: 'auto' }
const moduleCardStyle: CSSProperties = { display: 'grid', gap: 8, padding: 14, borderRadius: 20, border: '1px solid #e2e8f0', textAlign: 'left', color: '#0f172a', cursor: 'pointer' }
const moduleTopStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }
const areaGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const areaStyle: CSSProperties = { border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', borderRadius: 16, padding: 12, fontWeight: 950, cursor: 'pointer' }
const areaSelectedStyle: CSSProperties = { ...areaStyle, background: '#eff6ff', color: '#1d4ed8', borderColor: '#2563eb' }
const executionModeBoxStyle: CSSProperties = { display: 'grid', gap: 10, padding: 12, borderRadius: 20, background: '#f8fafc', border: '1px solid #e2e8f0' }
const labelStyle: CSSProperties = { color: '#334155', fontSize: 12, fontWeight: 1000, textTransform: 'uppercase', letterSpacing: '.08em' }
const selectStyle: CSSProperties = { width: '100%', border: '1px solid #cbd5e1', borderRadius: 14, padding: '12px 14px', background: '#fff', color: '#0f172a', fontWeight: 900 }
const errorBoxStyle: CSSProperties = { padding: 13, borderRadius: 18, background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontWeight: 900 }
const summaryCardStyle: CSSProperties = { display: 'grid', gap: 12, padding: 16, borderRadius: 24, background: '#fff', border: '1px solid #dbeafe', boxShadow: '0 16px 44px rgba(37,99,235,.08)' }
const noticeStyle: CSSProperties = { padding: 12, borderRadius: 18, background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', fontWeight: 850 }
const artifactGridStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const codePillStyle: CSSProperties = { borderRadius: 999, padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 800 }
const bulletListStyle: CSSProperties = { margin: 0, paddingLeft: 20, color: '#334155', display: 'grid', gap: 10, fontWeight: 800, lineHeight: 1.5 }
