'use client'

import { useEffect, useMemo, useState } from 'react'

type Tone = 'blue' | 'green' | 'red' | 'amber' | 'slate' | 'purple'
type ManagerTab = 'overview' | 'modules' | 'actions' | 'rules' | 'preview'

type EngineSettings = {
  enabled: boolean
  autoScan: boolean
  fetchTracking: boolean
  fullAppScan: boolean
  moduleOverrides: Record<string, boolean>
  actionRules: Record<string, boolean>
}

type DetectedAction = {
  label: string
  selector: string
  type: string
  module?: string
  file?: string
  actionType?: string
  confidence?: number
}

const STORAGE_KEY = 'angelcare.operationCompletionEngine.v2'

const DEFAULT_SETTINGS: EngineSettings = {
  enabled: true,
  autoScan: true,
  fetchTracking: true,
  fullAppScan: true,
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
    action: true,
  },
}

const ACTION_WORDS = [
  'save', 'enregistrer', 'delete', 'supprimer', 'create', 'créer', 'submit', 'valider',
  'validate', 'execute', 'run', 'launch', 'import', 'export', 'upload', 'restore',
  'suspend', 'turn off', 'turn on', 'confirm', 'approve', 'reject', 'archive', 'send',
  'sync', 'refresh',
]

const NAV_WORDS = [
  'retour', 'back', 'profile', 'attendance dashboard', 'access control', "user's activities",
  'overview', 'settings', 'next', 'previous', 'open', 'view', 'show',
]

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
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(raw),
      actionRules: { ...DEFAULT_SETTINGS.actionRules, ...(JSON.parse(raw).actionRules || {}) },
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
  if (parts[0] === 'users' && parts[2] === 'edit') return 'users-edit'
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
  if (text.includes('restore')) return 'restore'
  if (text.includes('suspend') || text.includes('turn off')) return 'suspend'
  if (text.includes('import') || text.includes('upload')) return 'import'
  if (text.includes('approve') || text.includes('reject') || text.includes('validate') || text.includes('valider')) return 'approval'
  if (text.includes('sync') || text.includes('refresh')) return 'sync'
  if (text.includes('run') || text.includes('execute') || text.includes('launch')) return 'execute'
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
  if (element.getAttribute('data-operation') === 'true') return true

  const insideForm = Boolean(element.closest('form'))
  const submitButton = tag === 'button' && (type === 'submit' || !type) && insideForm

  return submitButton || ACTION_WORDS.some((word) => label.includes(word))
}

function scanCurrentPage(): DetectedAction[] {
  if (typeof document === 'undefined') return []

  const elements = Array.from(
    document.querySelectorAll('button, [role="button"], input[type="submit"], [data-operation="true"]')
  )

  return elements
    .filter(isExecutionAction)
    .map((element, index) => {
      const label = textOf(element) || 'Execution action'
      return {
        label,
        selector: element.getAttribute('id') ? `#${element.getAttribute('id')}` : `button:nth-action-${index + 1}`,
        type: element.closest('form') ? 'form-submit' : 'button-action',
        module: currentModuleFromPath(),
        actionType: classifyAction(label),
        confidence: 90,
      }
    })
    .slice(0, 100)
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
    action: 'Execute',
  }
  const verb = verbMap[actionType] || 'Execute'

  return [
    `Validate ${verb.toLowerCase()} request`,
    `Authorize ${verb.toLowerCase()} operation`,
    `${verb} synced records`,
    `Refresh linked module state`,
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

export function OperationCompletionManagerButton() {
  return (
    <>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('angelcare:open-operation-manager'))}
        style={managerButtonStyle}
      >
        Operation Toast Engine
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
  const [appActions, setAppActions] = useState<DetectedAction[]>([])
  const [scanMeta, setScanMeta] = useState<{ scannedFiles?: number; generatedAt?: string }>({})
  const [scanBusy, setScanBusy] = useState(false)
  const [operation, setOperation] = useState<{
    title: string
    actionType: string
    progress: number
    stages: string[]
    failed?: boolean
    result?: string
  } | null>(null)

  const moduleKey = useMemo(currentModuleFromPath, [])
  const allModules = Array.from(new Set([...appActions.map((a) => a.module || 'shared'), moduleKey])).sort()
  const moduleEnabled = settings.moduleOverrides[moduleKey] ?? true
  const active = settings.enabled && moduleEnabled

  function updateSettings(next: EngineSettings) {
    setSettings(next)
    saveSettings(next)
  }

  function refreshCurrentScan() {
    setCurrentActions(scanCurrentPage())
  }

  async function refreshFullAppScan() {
    setScanBusy(true)
    try {
      const response = await fetch('/api/operation-completion/scan', { cache: 'no-store' })
      const json = await response.json()
      if (json?.ok) {
        setAppActions(Array.isArray(json.actions) ? json.actions : [])
        setScanMeta({ scannedFiles: json.scannedFiles, generatedAt: json.generatedAt })
      }
    } finally {
      setScanBusy(false)
    }
  }

  function startOperation(label: string, actionType = classifyAction(label)) {
    if (!active) return
    if (settings.actionRules[actionType] === false) return

    setOperation({
      title: label,
      actionType,
      progress: 8,
      stages: stagesFor(actionType, label),
    })

    const ticks = [18, 36, 58, 82, 100]
    ticks.forEach((value, index) => {
      window.setTimeout(() => {
        setOperation((current) => {
          if (!current) return current
          return {
            ...current,
            progress: value,
            result: value >= 100 ? `${current.title} completed successfully.` : current.result,
          }
        })
      }, 260 + index * 420)
    })
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
    if (!managerOpen || !settings.fullAppScan || appActions.length || scanBusy) return
    refreshFullAppScan()
  }, [managerOpen, settings.fullAppScan])

  useEffect(() => {
    if (!settings.autoScan || !active) return

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const button = target?.closest('button, [role="button"], input[type="submit"], [data-operation="true"]')
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
          setOperation((current) =>
            current ? { ...current, failed: true, progress: 100, result: `Operation failed with status ${response.status}.` } : current
          )
        }
        return response
      } catch (error) {
        if (shouldTrack) {
          setOperation((current) =>
            current ? { ...current, failed: true, progress: 100, result: error instanceof Error ? error.message : 'Operation failed.' } : current
          )
        }
        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [active, settings.fetchTracking])

  const tone = toneForProgress(operation?.progress || 0, operation?.failed)
  const currentPalette = palette[tone]

  return (
    <>
      {operation ? (
        <aside style={{ ...toastStyle, border: `1px solid ${currentPalette.border}` }}>
          <div style={toastHeadStyle}>
            <div>
              <div style={eyebrowStyle}>Action progress</div>
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
            <div style={trackStyle}>
              <div style={{ width: `${operation.progress}%`, height: '100%', background: currentPalette.solid, borderRadius: 999 }} />
            </div>
          </div>

          <div style={stageListStyle}>
            {operation.stages.map((stage, index) => {
              const threshold = [10, 35, 60, 85, 100][index]
              const done = operation.progress >= threshold
              return (
                <div key={stage} style={stageItemStyle}>
                  <span>{done ? '✓' : '○'}</span>
                  <span>{stage}</span>
                  <strong>{threshold}%</strong>
                </div>
              )
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
                <div style={blueEyebrowStyle}>Global Operation Completion Engine</div>
                <h2 style={managerTitleStyle}>Native app action scan & execution progress manager</h2>
                <p style={managerSubtitleStyle}>
                  Built for all modules, not only users. It scans current page actions, server app files, module scopes and action rules.
                </p>
              </div>
              <button type="button" onClick={() => setManagerOpen(false)} style={closeBigStyle}>×</button>
            </div>

            <div style={tabRowStyle}>
              {(['overview', 'modules', 'actions', 'rules', 'preview'] as ManagerTab[]).map((item) => (
                <button key={item} type="button" onClick={() => setTab(item)} style={tab === item ? tabActiveStyle : tabStyle}>
                  {item === 'overview' ? 'Overview' : item === 'modules' ? 'Modules' : item === 'actions' ? 'App Scan' : item === 'rules' ? 'Action Rules' : 'Preview'}
                </button>
              ))}
            </div>

            {tab === 'overview' ? (
              <>
                <div style={statGridStyle}>
                  <ManagerStat label="Current module" value={moduleKey} />
                  <ManagerStat label="Current page actions" value={String(currentActions.length)} />
                  <ManagerStat label="Full app actions" value={String(appActions.length)} />
                  <ManagerStat label="Scanned files" value={String(scanMeta.scannedFiles || 0)} />
                  <ManagerStat label="Global engine" value={settings.enabled ? 'Enabled' : 'Disabled'} />
                  <ManagerStat label="This module" value={moduleEnabled ? 'Enabled' : 'Disabled'} />
                </div>

                <div style={toggleGridStyle}>
                  <ToggleCard title="Enable global engine" detail="Turns progress toasts on or off everywhere." enabled={settings.enabled} onClick={() => updateSettings({ ...settings, enabled: !settings.enabled })} />
                  <ToggleCard title={`Enable on ${moduleKey}`} detail="Controls this module separately from the global engine." enabled={moduleEnabled} onClick={() => updateSettings({ ...settings, moduleOverrides: { ...settings.moduleOverrides, [moduleKey]: !moduleEnabled } })} />
                  <ToggleCard title="Auto scan current page" detail="Detects existing buttons and forms in the active screen." enabled={settings.autoScan} onClick={() => updateSettings({ ...settings, autoScan: !settings.autoScan })} />
                  <ToggleCard title="Track non-GET fetch actions" detail="Shows progress for native API execution requests." enabled={settings.fetchTracking} onClick={() => updateSettings({ ...settings, fetchTracking: !settings.fetchTracking })} />
                  <ToggleCard title="Enable full app scan" detail="Uses the server scanner to detect actions across app/components." enabled={settings.fullAppScan} onClick={() => updateSettings({ ...settings, fullAppScan: !settings.fullAppScan })} />
                </div>
              </>
            ) : null}

            {tab === 'modules' ? (
              <div style={listPanelStyle}>
                {allModules.map((moduleName) => {
                  const enabled = settings.moduleOverrides[moduleName] ?? true
                  const count = appActions.filter((action) => action.module === moduleName).length
                  return (
                    <button key={moduleName} type="button" onClick={() => updateSettings({ ...settings, moduleOverrides: { ...settings.moduleOverrides, [moduleName]: !enabled } })} style={moduleRowStyle}>
                      <span>
                        <strong>{moduleName}</strong>
                        <small>{count} scanned action{count === 1 ? '' : 's'}</small>
                      </span>
                      <span style={{ ...pillStyle, background: enabled ? '#ecfdf5' : '#fef2f2', color: enabled ? '#047857' : '#b91c1c' }}>
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}

            {tab === 'actions' ? (
              <>
                <div style={buttonBarStyle}>
                  <button type="button" onClick={refreshCurrentScan} style={managerPrimaryButtonStyle}>Scan current page</button>
                  <button type="button" onClick={refreshFullAppScan} style={managerSecondaryButtonStyle}>{scanBusy ? 'Scanning full app...' : 'Scan full app'}</button>
                  <button type="button" onClick={() => setManagerOpen(false)} style={managerDarkButtonStyle}>Save and close</button>
                </div>

                <ActionList title="Current page detected actions" actions={currentActions} />
                <ActionList title="Full app server scan actions" actions={appActions} />
              </>
            ) : null}

            {tab === 'rules' ? (
              <div style={toggleGridStyle}>
                {Object.keys(settings.actionRules).map((rule) => (
                  <ToggleCard
                    key={rule}
                    title={`${rule.toUpperCase()} actions`}
                    detail={`Show operation toast for ${rule} actions.`}
                    enabled={settings.actionRules[rule] !== false}
                    onClick={() => updateSettings({ ...settings, actionRules: { ...settings.actionRules, [rule]: settings.actionRules[rule] === false } })}
                  />
                ))}
              </div>
            ) : null}

            {tab === 'preview' ? (
              <div style={previewGridStyle}>
                {['save', 'create', 'delete', 'restore', 'suspend', 'import', 'approval', 'sync', 'execute'].map((actionType) => (
                  <button key={actionType} type="button" onClick={() => startOperation(`${actionType} operation preview`, actionType)} style={previewButtonStyle}>
                    Preview {actionType}
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  )
}

function ActionList({ title, actions }: { title: string; actions: DetectedAction[] }) {
  return (
    <div style={scanListStyle}>
      <h3 style={scanTitleStyle}>{title}</h3>
      {actions.length ? actions.map((action, index) => (
        <div key={`${action.label}-${action.file || action.selector}-${index}`} style={scanItemStyle}>
          <div>
            <strong>{action.label}</strong>
            <small>{action.file || action.selector}</small>
          </div>
          <span style={pillStyle}>{action.module || action.type} · {action.actionType || 'action'}</span>
        </div>
      )) : (
        <div style={emptyStyle}>No actions detected yet.</div>
      )}
    </div>
  )
}

function ManagerStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={statCardStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ToggleCard({ title, detail, enabled, onClick }: { title: string; detail: string; enabled: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ ...toggleCardStyle, border: enabled ? '1px solid #bbf7d0' : '1px solid #fecaca', background: enabled ? '#f0fdf4' : '#fff5f5' }}>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span style={{ ...toggleTrackStyle, background: enabled ? '#dcfce7' : '#fee2e2' }}>
        <span style={{ ...toggleKnobStyle, marginLeft: enabled ? 34 : 0, background: enabled ? '#16a34a' : '#dc2626' }} />
      </span>
    </button>
  )
}

const managerButtonStyle = { border: '1px solid #bfdbfe', borderRadius: 999, padding: '15px 22px', background: 'linear-gradient(135deg,#ffffff,#eff6ff)', color: '#0f172a', fontWeight: 1000, fontSize: 15, boxShadow: '0 16px 34px rgba(37,99,235,.12)', cursor: 'pointer', whiteSpace: 'nowrap' }
const toastStyle = { position: 'fixed' as const, right: 24, bottom: 24, zIndex: 9999, width: 390, borderRadius: 28, padding: 18, background: '#fff', boxShadow: '0 34px 90px rgba(15,23,42,.22)', display: 'grid', gap: 14 }
const toastHeadStyle = { display: 'flex', justifyContent: 'space-between', gap: 12 }
const eyebrowStyle = { color: '#64748b', fontSize: 11, fontWeight: 1000, textTransform: 'uppercase' as const, letterSpacing: '.12em' }
const blueEyebrowStyle = { color: '#2563eb', fontSize: 12, fontWeight: 1000, textTransform: 'uppercase' as const, letterSpacing: '.14em' }
const toastTitleStyle = { display: 'block', marginTop: 4, color: '#0f172a', fontSize: 16, fontWeight: 1000 }
const closeButtonStyle = { width: 32, height: 32, borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 1000 }
const progressTopStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }
const progressNumberStyle = { color: '#0f172a', fontSize: 30, fontWeight: 1000 }
const statusChipStyle = { borderRadius: 999, padding: '6px 10px', fontSize: 11, fontWeight: 1000 }
const trackStyle = { height: 10, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const stageListStyle = { display: 'grid', gap: 8 }
const stageItemStyle = { display: 'grid', gridTemplateColumns: '24px minmax(0,1fr) 42px', gap: 8, alignItems: 'center', padding: 8, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', fontSize: 12, fontWeight: 850 }
const resultBoxStyle = { padding: 12, borderRadius: 18, background: '#f0fdf4', color: '#047857', border: '1px solid #bbf7d0', fontSize: 12, fontWeight: 850 }
const modalOverlayStyle = { position: 'fixed' as const, inset: 0, zIndex: 9998, background: 'rgba(15,23,42,.42)', backdropFilter: 'blur(12px)', display: 'grid', placeItems: 'center', padding: 24 }
const modalStyle = { width: 'min(1220px,100%)', maxHeight: '90vh', overflow: 'auto', borderRadius: 34, background: '#fff', border: '1px solid #dbeafe', boxShadow: '0 40px 120px rgba(15,23,42,.26)', padding: 24, display: 'grid', gap: 18 }
const managerHeaderStyle = { display: 'flex', justifyContent: 'space-between', gap: 16 }
const managerTitleStyle = { margin: '8px 0 0', color: '#0f172a', fontSize: 30, fontWeight: 1000, letterSpacing: '-.05em' }
const managerSubtitleStyle = { margin: '8px 0 0', color: '#64748b', fontSize: 14, fontWeight: 750 }
const closeBigStyle = { width: 44, height: 44, borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: 1000, fontSize: 22 }
const tabRowStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 10, padding: 10, borderRadius: 22, background: '#f8fafc', border: '1px solid #e2e8f0' }
const tabStyle = { border: '1px solid #cbd5e1', borderRadius: 999, padding: '11px 14px', background: '#fff', color: '#0f172a', fontWeight: 1000, cursor: 'pointer' }
const tabActiveStyle = { ...tabStyle, background: 'linear-gradient(135deg,#2563eb,#0f172a)', color: '#fff' }
const statGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }
const statCardStyle = { padding: 14, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'grid', gap: 5, color: '#64748b', fontSize: 11, fontWeight: 1000, textTransform: 'uppercase' as const, letterSpacing: '.08em' }
const toggleGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const toggleCardStyle = { textAlign: 'left' as const, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 74px', gap: 12, padding: 16, borderRadius: 22, cursor: 'pointer' }
const toggleTrackStyle = { alignSelf: 'center', height: 38, borderRadius: 999, padding: 4, border: '1px solid rgba(15,23,42,.08)' }
const toggleKnobStyle = { display: 'block', width: 28, height: 28, borderRadius: 999, boxShadow: '0 10px 20px rgba(15,23,42,.16)', transition: 'all .2s ease' }
const buttonBarStyle = { display: 'flex', gap: 10, flexWrap: 'wrap' as const }
const managerPrimaryButtonStyle = { border: 0, borderRadius: 16, padding: '12px 15px', background: 'linear-gradient(135deg,#2563eb,#0f172a)', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const managerSecondaryButtonStyle = { border: '1px solid #bfdbfe', borderRadius: 16, padding: '12px 15px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 1000, cursor: 'pointer' }
const managerDarkButtonStyle = { border: 0, borderRadius: 16, padding: '12px 15px', background: '#0f172a', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const scanListStyle = { display: 'grid', gap: 10, maxHeight: 360, overflow: 'auto', padding: 12, borderRadius: 22, background: '#f8fafc', border: '1px solid #e2e8f0' }
const scanTitleStyle = { margin: 0, color: '#0f172a', fontSize: 18, fontWeight: 1000 }
const scanItemStyle = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, padding: 12, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a' }
const pillStyle = { justifySelf: 'end', alignSelf: 'center', borderRadius: 999, padding: '7px 10px', background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 1000 }
const listPanelStyle = { display: 'grid', gap: 10, maxHeight: 520, overflow: 'auto', padding: 12, borderRadius: 22, background: '#f8fafc', border: '1px solid #e2e8f0' }
const moduleRowStyle = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, padding: 14, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', textAlign: 'left' as const }
const previewGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const previewButtonStyle = { border: '1px solid #bfdbfe', borderRadius: 18, padding: 18, background: '#eff6ff', color: '#1d4ed8', fontWeight: 1000, cursor: 'pointer' }
const emptyStyle = { padding: 18, borderRadius: 18, background: '#fff', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
