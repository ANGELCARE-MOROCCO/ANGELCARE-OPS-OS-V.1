'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BSettingsAutomationWorkspace.module.css'

type SectorKey = 'all' | 'hospitality' | 'healthcare' | 'education' | 'corporate' | 'events'
type ModalMode = 'create' | 'edit' | 'view' | 'generator' | null

type AutomationRule = {
  id: string
  name: string
  status: 'Active' | 'Paused' | 'Draft'
  sector: SectorKey
  trigger: string
  condition: string
  action: string
  cadence: string
  owner: string
  severity: 'Low' | 'Medium' | 'High' | 'Critical'
  channels: string[]
  aiBrief: string
  expectedImpact: string
  createdAt: string
}

type SettingsState = {
  operatingMode: string
  defaultOwner: string
  followUpSlaHours: number
  proposalSlaHours: number
  meetingSlaHours: number
  escalationThresholdHours: number
  autoScoring: boolean
  autoTaskCreation: boolean
  managerAlerts: boolean
  reportGeneration: boolean
  activeChannels: string[]
  scoringWeights: {
    priority: number
    revenue: number
    decisionPower: number
    urgency: number
    relationship: number
  }
}

const SECTORS: { key: SectorKey; label: string; icon: string; description: string }[] = [
  { key: 'all', label: 'All sectors', icon: '🧭', description: 'Global automation rules across the full B2B engine.' },
  { key: 'hospitality', label: 'Hotels & Resorts', icon: '🏨', description: 'Guest experience, VIP family programs, concierge and hotel partnerships.' },
  { key: 'healthcare', label: 'Healthcare & Pediatrics', icon: '🏥', description: 'Clinic referrals, pediatric family support and trust-based follow-up.' },
  { key: 'education', label: 'Schools & Childcare', icon: '🎓', description: 'Parent convenience, school events, after-school and family services.' },
  { key: 'corporate', label: 'Corporate Employers', icon: '🏢', description: 'HR benefits, employee-parent support and corporate family programs.' },
  { key: 'events', label: 'Events & Venues', icon: '🎉', description: 'Kids corner, wedding childcare, guest comfort and venue upsells.' },
]

const CHANNELS = ['WhatsApp', 'Email', 'Call', 'LinkedIn', 'Task', 'Manager alert', 'Report']

const DEFAULT_SETTINGS: SettingsState = {
  operatingMode: 'Revenue domination mode',
  defaultOwner: 'B2B Partnerships Manager',
  followUpSlaHours: 24,
  proposalSlaHours: 48,
  meetingSlaHours: 72,
  escalationThresholdHours: 48,
  autoScoring: true,
  autoTaskCreation: true,
  managerAlerts: true,
  reportGeneration: true,
  activeChannels: ['WhatsApp', 'Email', 'Call', 'Task', 'Manager alert'],
  scoringWeights: {
    priority: 25,
    revenue: 25,
    decisionPower: 20,
    urgency: 20,
    relationship: 10,
  },
}

const DEFAULT_RULES: AutomationRule[] = [
  makeRule('A-priority prospect follow-up', 'all', 'A-priority prospect has no next action', 'Priority equals A and next follow-up is empty', 'Create urgent follow-up task and alert manager', 'Daily 09:00', 'High', ['Task', 'Manager alert', 'WhatsApp']),
  makeRule('Hotel proposal acceleration', 'hospitality', 'Hotel prospect becomes warm', 'Sector is hotel and relationship warmth is warm or hot', 'Recommend Family Stay Booster proposal and schedule call', 'Immediate', 'High', ['Task', 'Email', 'Call']),
  makeRule('Clinic trust-building sequence', 'healthcare', 'Clinic prospect added', 'Sector is healthcare or pediatric clinic', 'Create trust-first outreach sequence with clinic-safe language', 'Immediate', 'Medium', ['Email', 'WhatsApp', 'Task']),
  makeRule('School parent convenience pitch', 'education', 'School prospect is qualified', 'Sector is education and city is Rabat, Salé or Temara', 'Generate parent convenience partnership task and proposal reminder', 'Daily 10:00', 'Medium', ['Task', 'Email']),
  makeRule('Corporate HR benefit trigger', 'corporate', 'Corporate account has HR contact', 'Decision maker role includes HR, People or Direction', 'Prepare employee-parent benefit pitch and meeting request', 'Immediate', 'High', ['LinkedIn', 'Email', 'Call']),
  makeRule('Event venue upsell trigger', 'events', 'Event/venue prospect created', 'Sector is events, venue or wedding planner', 'Suggest Kids Corner / Guest Comfort upsell and create proposal task', 'Immediate', 'Medium', ['WhatsApp', 'Task']),
  makeRule('Proposal stale recovery', 'all', 'Proposal not followed up', 'Proposal status is Draft or Sent and no activity after 48 hours', 'Create recovery call task and manager reminder', 'Every morning', 'Critical', ['Call', 'Task', 'Manager alert']),
  makeRule('Meeting-to-proposal discipline', 'all', 'Meeting completed', 'Meeting status is completed and no proposal exists', 'Create proposal drafting task within 24 hours', 'Immediate', 'High', ['Task', 'Report']),
  makeRule('Weekly controller report', 'all', 'Week closes', 'Every Friday afternoon', 'Generate controller report with alerts, wins, coaching and revenue moves', 'Friday 17:00', 'Medium', ['Report', 'Manager alert']),
  makeRule('Revenue opportunity escalation', 'all', 'High value prospect is inactive', 'Estimated annual value is high and no activity after escalation threshold', 'Escalate to manager and propose closing plan', 'Daily 16:00', 'Critical', ['Manager alert', 'Call', 'Task']),
]

function makeRule(
  name: string,
  sector: SectorKey,
  trigger: string,
  condition: string,
  action: string,
  cadence: string,
  severity: AutomationRule['severity'],
  channels: string[],
): AutomationRule {
  const id = `rule-${sector}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return {
    id,
    name,
    status: 'Active',
    sector,
    trigger,
    condition,
    action,
    cadence,
    owner: 'B2B Partnerships Manager',
    severity,
    channels,
    aiBrief: `System should monitor this rule and push the team toward faster, clearer and more revenue-focused execution.`,
    expectedImpact: 'Improves follow-up discipline, opportunity movement, manager visibility and revenue conversion.',
    createdAt: new Date().toISOString(),
  }
}

function blankRule(sector: SectorKey): AutomationRule {
  return {
    id: `custom-${Date.now()}`,
    name: '',
    status: 'Draft',
    sector,
    trigger: '',
    condition: '',
    action: '',
    cadence: 'Immediate',
    owner: 'B2B Partnerships Manager',
    severity: 'Medium',
    channels: ['Task'],
    aiBrief: '',
    expectedImpact: '',
    createdAt: new Date().toISOString(),
  }
}

function readStoredJson(key: string) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearStoredJson(keys: string[]) {
  try {
    for (const key of keys) window.localStorage.removeItem(key)
  } catch {}
}

function normalizeSettings(next: any): SettingsState {
  return {
    ...DEFAULT_SETTINGS,
    ...(next && typeof next === 'object' ? next : {}),
    scoringWeights: {
      ...DEFAULT_SETTINGS.scoringWeights,
      ...(next?.scoringWeights && typeof next.scoringWeights === 'object' ? next.scoringWeights : {}),
    },
    activeChannels: Array.isArray(next?.activeChannels) ? next.activeChannels.filter((value: any) => typeof value === 'string') : DEFAULT_SETTINGS.activeChannels,
  }
}

function normalizeRule(next: any): AutomationRule {
  const channels = Array.isArray(next?.channels) ? next.channels.filter((value: any) => typeof value === 'string') : ['Task']
  const sector = (next?.sector || 'all') as SectorKey
  const statusValue = String(next?.status || (next?.is_active === false ? 'Paused' : 'Active'))
  const status = (['Active', 'Paused', 'Draft'].includes(statusValue) ? statusValue : (next?.is_active === false ? 'Paused' : 'Active')) as AutomationRule['status']
  return {
    id: String(next?.id || `custom-${Date.now()}`),
    name: String(next?.name || ''),
    status,
    sector,
    trigger: String(next?.trigger || next?.trigger_key || ''),
    condition: String(next?.condition || next?.conditions?.condition || ''),
    action: String(next?.action || next?.actions?.[0]?.title || next?.actions?.[0]?.action || ''),
    cadence: String(next?.cadence || 'Immediate'),
    owner: String(next?.owner || 'B2B Partnerships Manager'),
    severity: (next?.severity || 'Medium') as AutomationRule['severity'],
    channels,
    aiBrief: String(next?.aiBrief || next?.ai_brief || next?.description || ''),
    expectedImpact: String(next?.expectedImpact || next?.expected_impact || ''),
    createdAt: String(next?.createdAt || next?.created_at || new Date().toISOString()),
  }
}

function ruleSignature(rule: Pick<AutomationRule, 'name' | 'sector' | 'trigger'>) {
  return [rule.sector, rule.name, rule.trigger].map((value) => String(value || '').toLowerCase().trim()).join('::')
}

function mergeRules(base: AutomationRule[], rows: any[]) {
  const merged = new Map(base.map((rule) => [rule.id, rule]))
  const seedBySignature = new Map(base.map((rule) => [ruleSignature(rule), rule.id]))
  const seedByName = new Map(base.map((rule) => [rule.name.toLowerCase().trim(), rule.id]))

  for (const row of rows) {
    const normalized = normalizeRule(row)
    if (row?.deleted_at || row?.is_deleted) {
      merged.delete(normalized.id)
      continue
    }

    const existingSeedId = seedBySignature.get(ruleSignature(normalized)) || seedByName.get(normalized.name.toLowerCase().trim())
    merged.set(existingSeedId || normalized.id, existingSeedId ? { ...normalized, id: existingSeedId } : normalized)
  }

  return Array.from(merged.values())
}

async function syncSettings(next: SettingsState) {
  const response = await fetch('/api/b2b-partnerships/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings: next }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || 'Unable to save settings.')
  clearStoredJson(['angelcare:b2b-settings'])
  return normalizeSettings(payload?.data?.settings || next)
}

async function syncRule(next: AutomationRule, method: 'POST' | 'PATCH' | 'DELETE' = 'POST') {
  const response = await fetch('/api/b2b-partnerships/automation-rules', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(next),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.ok === false) throw new Error(payload?.error || 'Unable to save automation rule.')
  clearStoredJson(['angelcare:b2b-automation-rules'])
  return normalizeRule(payload?.data || next)
}

function severityScore(severity: AutomationRule['severity']) {
  return severity === 'Critical' ? 100 : severity === 'High' ? 76 : severity === 'Medium' ? 52 : 28
}

function generateSmartRule(goal: string, sector: SectorKey): AutomationRule {
  const lower = goal.toLowerCase()
  const sectorName = SECTORS.find((s) => s.key === sector)?.label || 'B2B'

  if (lower.includes('proposal') || lower.includes('offer') || lower.includes('devis')) {
    return {
      ...blankRule(sector),
      status: 'Active',
      name: `${sectorName} proposal acceleration`,
      trigger: 'Qualified prospect has no active proposal',
      condition: 'Prospect status is warm, qualified or A-priority and proposal count is zero',
      action: 'Create proposal drafting task, suggest best sector program, and notify owner',
      cadence: 'Immediate',
      severity: 'High',
      channels: ['Task', 'Manager alert', 'Email'],
      aiBrief: 'Controller must push the user to transform interest into a written proposal quickly.',
      expectedImpact: 'Increases proposal volume and reduces lost warm opportunities.',
    }
  }

  if (lower.includes('meeting') || lower.includes('appointment') || lower.includes('rendez')) {
    return {
      ...blankRule(sector),
      status: 'Active',
      name: `${sectorName} meeting creation engine`,
      trigger: 'Warm prospect has no scheduled meeting',
      condition: 'Relationship warmth is warm or hot and next meeting is empty',
      action: 'Create call task, prepare meeting script, and remind owner to request decision-maker slot',
      cadence: 'Daily 10:00',
      severity: 'High',
      channels: ['Call', 'WhatsApp', 'Task'],
      aiBrief: 'Controller should push direct decision-maker access and avoid endless passive messaging.',
      expectedImpact: 'Improves meeting conversion and decision-maker access.',
    }
  }

  if (lower.includes('late') || lower.includes('delay') || lower.includes('overdue') || lower.includes('follow')) {
    return {
      ...blankRule(sector),
      status: 'Active',
      name: `${sectorName} overdue recovery protocol`,
      trigger: 'Follow-up becomes late',
      condition: 'Next follow-up date is past due or no activity after SLA',
      action: 'Escalate to owner, create recovery task, and recommend short WhatsApp/call script',
      cadence: 'Every morning',
      severity: 'Critical',
      channels: ['Task', 'Manager alert', 'WhatsApp'],
      aiBrief: 'Controller should protect trust and discipline by preventing silent opportunities.',
      expectedImpact: 'Reduces forgotten prospects and improves commercial reliability.',
    }
  }

  if (lower.includes('revenue') || lower.includes('sales') || lower.includes('close') || lower.includes('money')) {
    return {
      ...blankRule(sector),
      status: 'Active',
      name: `${sectorName} revenue domination trigger`,
      trigger: 'High-potential prospect is active',
      condition: 'Priority is A or estimated value is high and there is recent activity',
      action: 'Generate closing plan, recommend next offer, and alert manager if no close date exists',
      cadence: 'Daily 16:00',
      severity: 'Critical',
      channels: ['Manager alert', 'Task', 'Call', 'Report'],
      aiBrief: 'Controller should focus the user on revenue movement, not only activity volume.',
      expectedImpact: 'Improves close discipline and short-term revenue conversion.',
    }
  }

  return {
    ...blankRule(sector),
    status: 'Active',
    name: `${sectorName} smart automation rule`,
    trigger: 'Commercial signal detected',
    condition: goal || 'User-defined business condition',
    action: 'Create next-best-action task, notify owner, and recommend the correct sector playbook',
    cadence: 'Immediate',
    severity: 'Medium',
    channels: ['Task', 'Manager alert'],
    aiBrief: 'Controller should translate this rule into clear, practical actions for non-technical users.',
    expectedImpact: 'Improves execution clarity and reduces manual coordination.',
  }
}

export default function B2BSettingsAutomationWorkspace() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES)
  const [sector, setSector] = useState<SectorKey>('all')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null)
  const [form, setForm] = useState<AutomationRule>(blankRule('all'))
  const [goal, setGoal] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function bootstrap() {
      try {
        const [settingsResponse, rulesResponse] = await Promise.all([
          fetch('/api/b2b-partnerships/settings', { cache: 'no-store' }),
          fetch('/api/b2b-partnerships/automation-rules?include_deleted=1', { cache: 'no-store' }),
        ])

        const settingsPayload = await settingsResponse.json().catch(() => null)
        const rulesPayload = await rulesResponse.json().catch(() => null)

        if (!settingsResponse.ok || settingsPayload?.ok === false) throw new Error(settingsPayload?.error || 'Unable to load settings.')
        if (!rulesResponse.ok || rulesPayload?.ok === false) throw new Error(rulesPayload?.error || 'Unable to load automation rules.')
        if (!alive) return

        const serverSettingsSource = settingsPayload?.data?.settings
        const hasServerSettings = serverSettingsSource && typeof serverSettingsSource === 'object' && Object.keys(serverSettingsSource).length > 0
        const serverSettings = normalizeSettings(serverSettingsSource)
        setSettings(serverSettings)
        if (hasServerSettings) clearStoredJson(['angelcare:b2b-settings'])

        const serverRules = Array.isArray(rulesPayload?.data) ? rulesPayload.data : []
        const storedSettings = readStoredJson('angelcare:b2b-settings')
        const storedRules = readStoredJson('angelcare:b2b-automation-rules')

        if (!hasServerSettings && storedSettings) {
          const syncedSettings = await syncSettings(normalizeSettings(storedSettings))
          if (!alive) return
          setSettings(syncedSettings)
        }

        if (serverRules.length) {
          setRules(mergeRules(DEFAULT_RULES, serverRules))
          clearStoredJson(['angelcare:b2b-automation-rules'])
        } else {
          if (Array.isArray(storedRules) && storedRules.length) {
            const normalizedStored = storedRules.map(normalizeRule)
            for (const rule of normalizedStored) {
              await syncRule(rule, rule.id.startsWith('custom-') ? 'POST' : 'PATCH')
            }
            if (!alive) return
            setRules(mergeRules(DEFAULT_RULES, normalizedStored))
            clearStoredJson(['angelcare:b2b-automation-rules'])
          }
        }
      } catch {
        const storedSettings = readStoredJson('angelcare:b2b-settings')
        const storedRules = readStoredJson('angelcare:b2b-automation-rules')
        if (storedSettings) setSettings(normalizeSettings(storedSettings))
        if (Array.isArray(storedRules) && storedRules.length) setRules(mergeRules(DEFAULT_RULES, storedRules.map(normalizeRule)))
      }
    }

    bootstrap()

    return () => {
      alive = false
    }
  }, [])

  function persistSettings(next: SettingsState) {
    setSettings(next)
    setError('')
    void syncSettings(next).catch((error) => {
      setError(error instanceof Error ? error.message : 'Unable to save settings.')
    })
  }

  const filteredRules = useMemo(() => {
    return sector === 'all' ? rules : rules.filter((rule) => rule.sector === sector || rule.sector === 'all')
  }, [rules, sector])

  const activeRules = rules.filter((rule) => rule.status === 'Active').length
  const criticalRules = rules.filter((rule) => rule.severity === 'Critical').length
  const automationCoverage = Math.min(100, Math.round((activeRules / Math.max(rules.length, 1)) * 100))
  const controlScore = Math.min(100, Math.round(
    (settings.autoScoring ? 20 : 0) +
    (settings.autoTaskCreation ? 25 : 0) +
    (settings.managerAlerts ? 25 : 0) +
    (settings.reportGeneration ? 15 : 0) +
    Math.min(15, settings.activeChannels.length * 3)
  ))

  const metrics = [
    { label: 'Automation control', value: `${controlScore}%`, helper: 'System readiness', icon: '⚙️' },
    { label: 'Active rules', value: activeRules, helper: 'Live automations', icon: '✅' },
    { label: 'Critical rules', value: criticalRules, helper: 'Escalation logic', icon: '🚨' },
    { label: 'Coverage', value: `${automationCoverage}%`, helper: 'Rules enabled', icon: '📡' },
    { label: 'Channels', value: settings.activeChannels.length, helper: 'Execution channels', icon: '🔗' },
  ]

  function openCreate() {
    const next = blankRule(sector)
    setForm(next)
    setSelectedRule(null)
    setModalMode('create')
  }

  function openView(rule: AutomationRule) {
    setSelectedRule(rule)
    setForm(rule)
    setModalMode('view')
  }

  function openEdit() {
    if (!selectedRule) return
    setForm(selectedRule)
    setModalMode('edit')
  }

  async function saveRule() {
    setError('')
    const clean: AutomationRule = {
      ...form,
      id: form.id || `custom-${Date.now()}`,
      createdAt: form.createdAt || new Date().toISOString(),
    }

    try {
      const saved = await syncRule(clean, rules.some((rule) => rule.id === clean.id) ? 'PATCH' : 'POST')
      const next = mergeRules(rules, [saved])
      setRules(next)
      clearStoredJson(['angelcare:b2b-automation-rules'])
      setSelectedRule(saved)
      setModalMode('view')
    } catch (error: any) {
      setError(error?.message || 'Unable to save automation rule.')
    }
  }

  async function deleteRule() {
    if (!selectedRule) return
    if (!window.confirm('Delete this automation rule?')) return
    setError('')
    try {
      const deleted = await syncRule(selectedRule, 'DELETE')
      setRules(mergeRules(rules, [deleted]))
      clearStoredJson(['angelcare:b2b-automation-rules'])
      setSelectedRule(null)
      setModalMode(null)
    } catch (error: any) {
      setError(error?.message || 'Unable to delete automation rule.')
    }
  }

  function smartGenerate() {
    const generated = generateSmartRule(goal, sector)
    setForm(generated)
    setSelectedRule(null)
    setModalMode('create')
  }

  function toggleChannel(channel: string) {
    const active = settings.activeChannels.includes(channel)
    const next = {
      ...settings,
      activeChannels: active
        ? settings.activeChannels.filter((item) => item !== channel)
        : [...settings.activeChannels, channel],
    }
    persistSettings(next)
  }

  function toggleRuleChannel(channel: string) {
    const active = form.channels.includes(channel)
    setForm({
      ...form,
      channels: active ? form.channels.filter((item) => item !== channel) : [...form.channels, channel],
    })
  }

  function updateWeight(key: keyof SettingsState['scoringWeights'], value: number) {
    persistSettings({
      ...settings,
      scoringWeights: {
        ...settings.scoringWeights,
        [key]: value,
      },
    })
  }

  async function copyConfig() {
    const payload = {
      settings,
      rules,
      exported_at: new Date().toISOString(),
      source: 'ANGELCARE B2B Settings Automation OS',
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  async function resetDefaults() {
    if (!window.confirm('Reset settings and automation rules to default templates?')) return
    setError('')
    try {
      setSettings(DEFAULT_SETTINGS)
      await syncSettings(DEFAULT_SETTINGS)
      const defaultIds = new Set(DEFAULT_RULES.map((rule) => rule.id))
      const customRules = rules.filter((rule) => !defaultIds.has(rule.id))
      await Promise.all(customRules.map((rule) => syncRule(rule, 'DELETE')))
      const savedRules = await Promise.all(DEFAULT_RULES.map((rule) => syncRule(rule, rules.some((existing) => existing.id === rule.id) ? 'PATCH' : 'POST')))
      const nextRules = mergeRules(DEFAULT_RULES, savedRules)
      setRules(nextRules)
      clearStoredJson(['angelcare:b2b-automation-rules'])
    } catch (error: any) {
      setError(error?.message || 'Unable to reset settings and automation rules.')
    }
  }

  return (
    <main className={styles.workspace}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>No-code automation control center</span>
          <h1>Settings, smart automations & enterprise execution controls</h1>
          <p>Configure ANGELCARE B2B rules without code: triggers, conditions, actions, escalation, channels, scoring weights, SLAs, owner logic and manager-agent behavior.</p>
        </div>

        <aside className={styles.heroCommand}>
          <span>Controller mode</span>
          <strong>{settings.operatingMode}</strong>
          <button type="button" onClick={() => setModalMode('generator')}>Generate smart automation</button>
          <button type="button" onClick={openCreate}>Create rule manually</button>
        </aside>
      </section>

      {error && (
        <div style={{ margin: '0 0 16px', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(239,68,68,.35)', background: 'rgba(254,242,242,.95)', color: '#991b1b' }}>
          {error}
        </div>
      )}

      <section className={styles.metrics}>
        {metrics.map((metric) => (
          <article key={metric.label}>
            <div>{metric.icon}</div>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className={styles.sectorNav}>
        {SECTORS.map((item) => (
          <button key={item.key} type="button" className={sector === item.key ? styles.activeSector : ''} onClick={() => setSector(item.key)}>
            <strong>{item.icon}</strong>
            <span>{item.label}</span>
          </button>
        ))}
      </section>

      <section className={styles.controlGrid}>
        <article className={styles.controlPanel}>
          <div className={styles.panelHeader}>
            <span>Core behavior</span>
            <h2>System settings</h2>
            <p>Simple switches for non-technical users. These settings define how strongly the B2B engine should push actions and management control.</p>
          </div>

          <div className={styles.settingsGrid}>
            <label>
              Operating mode
              <select value={settings.operatingMode} onChange={(e) => persistSettings({ ...settings, operatingMode: e.target.value })}>
                <option>Revenue domination mode</option>
                <option>Balanced execution mode</option>
                <option>Conservative follow-up mode</option>
                <option>High pressure launch mode</option>
                <option>Manager audit mode</option>
              </select>
            </label>

            <label>
              Default owner
              <input value={settings.defaultOwner} onChange={(e) => persistSettings({ ...settings, defaultOwner: e.target.value })} />
            </label>

            <label>
              Follow-up SLA hours
              <input type="number" value={settings.followUpSlaHours} onChange={(e) => persistSettings({ ...settings, followUpSlaHours: Number(e.target.value || 0) })} />
            </label>

            <label>
              Proposal SLA hours
              <input type="number" value={settings.proposalSlaHours} onChange={(e) => persistSettings({ ...settings, proposalSlaHours: Number(e.target.value || 0) })} />
            </label>

            <label>
              Meeting SLA hours
              <input type="number" value={settings.meetingSlaHours} onChange={(e) => persistSettings({ ...settings, meetingSlaHours: Number(e.target.value || 0) })} />
            </label>

            <label>
              Escalation threshold hours
              <input type="number" value={settings.escalationThresholdHours} onChange={(e) => persistSettings({ ...settings, escalationThresholdHours: Number(e.target.value || 0) })} />
            </label>
          </div>

          <div className={styles.switchGrid}>
            <Switch label="Auto scoring" active={settings.autoScoring} onClick={() => persistSettings({ ...settings, autoScoring: !settings.autoScoring })} />
            <Switch label="Auto task creation" active={settings.autoTaskCreation} onClick={() => persistSettings({ ...settings, autoTaskCreation: !settings.autoTaskCreation })} />
            <Switch label="Manager alerts" active={settings.managerAlerts} onClick={() => persistSettings({ ...settings, managerAlerts: !settings.managerAlerts })} />
            <Switch label="Report generation" active={settings.reportGeneration} onClick={() => persistSettings({ ...settings, reportGeneration: !settings.reportGeneration })} />
          </div>
        </article>

        <aside className={styles.aiPanel}>
          <div className={styles.panelHeader}>
            <span>Smart agent</span>
            <h2>AI-responsive controller</h2>
            <p>The system translates business goals into practical automation rules for users who do not know how to code.</p>
          </div>

          <textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Example: I want every warm hotel prospect to receive a proposal quickly and alert the manager if nobody follows up..." />
          <button type="button" onClick={smartGenerate}>Generate automation from goal</button>

          <div className={styles.agentHints}>
            <article><strong>Revenue</strong><span>Closing pressure, proposal reminders, warm lead acceleration.</span></article>
            <article><strong>Discipline</strong><span>Late follow-up recovery, overdue task escalation, owner reminders.</span></article>
            <article><strong>Sector</strong><span>Hotel, clinic, school, corporate and event-specific logic.</span></article>
          </div>
        </aside>
      </section>

      <section className={styles.scoringPanel}>
        <div className={styles.panelHeader}>
          <span>Scoring model</span>
          <h2>Editable scoring weights</h2>
          <p>Adjust how the system prioritizes prospects and actions. The total does not need coding knowledge; users simply move numbers.</p>
        </div>

        <div className={styles.weightGrid}>
          {Object.entries(settings.scoringWeights).map(([key, value]) => (
            <article key={key}>
              <span>{key.replace(/([A-Z])/g, ' $1')}</span>
              <strong>{value}%</strong>
              <input type="range" min="0" max="50" value={value} onChange={(e) => updateWeight(key as keyof SettingsState['scoringWeights'], Number(e.target.value))} />
              <div><i style={{ width: `${Math.max(4, value * 2)}%` }} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.channelsPanel}>
        <div>
          <span>Execution channels</span>
          <h2>Active channels</h2>
          <p>Select the channels the controller can use when building tasks and recommendations.</p>
        </div>

        <div className={styles.channelChips}>
          {CHANNELS.map((channel) => (
            <button key={channel} type="button" className={settings.activeChannels.includes(channel) ? styles.activeChip : ''} onClick={() => toggleChannel(channel)}>
              {channel}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.automationLayout}>
        <div className={styles.rulesPanel}>
          <div className={styles.panelHeader}>
            <span>Automation library</span>
            <h2>{SECTORS.find((s) => s.key === sector)?.label} rules</h2>
            <p>Every card is clickable. Users can view, edit, pause, activate or delete automations without touching code.</p>
          </div>

          <div className={styles.rulesGrid}>
            {filteredRules.map((rule) => (
              <article key={rule.id} className={styles.ruleCard} onClick={() => openView(rule)}>
                <div className={styles.ruleTop}>
                  <div>{SECTORS.find((s) => s.key === rule.sector)?.icon || '⚙️'}</div>
                  <span className={styles[`sev${rule.severity}`]}>{rule.severity}</span>
                </div>

                <h3>{rule.name}</h3>
                <p>{rule.action}</p>

                <div className={styles.ruleMeta}>
                  <span>{rule.status}</span>
                  <span>{rule.cadence}</span>
                  <span>{rule.owner}</span>
                </div>

                <div className={styles.ruleBar}>
                  <i style={{ width: `${severityScore(rule.severity)}%` }} />
                </div>

                <button type="button" onClick={(e) => { e.stopPropagation(); openView(rule) }}>Open automation</button>
              </article>
            ))}
          </div>
        </div>

        <aside className={styles.exportPanel}>
          <div className={styles.panelHeader}>
            <span>Configuration control</span>
            <h2>Export & reset</h2>
            <p>Keep a safe configuration copy for audit, review or future backend sync.</p>
          </div>

          <button type="button" onClick={copyConfig}>{copied ? 'Copied configuration' : 'Copy full config JSON'}</button>
          <button type="button" className={styles.secondaryButton} onClick={resetDefaults}>Reset defaults</button>

          <div className={styles.configPreview}>
            <strong>Current config</strong>
            <small>{rules.length} rules · {settings.activeChannels.length} channels · {settings.operatingMode}</small>
          </div>
        </aside>
      </section>

      {modalMode && (
        <div className={styles.modalBackdrop}>
          <section className={styles.ruleModal}>
            <div className={styles.modalHeader}>
              <div>
                <span>{modalMode === 'generator' ? 'Smart generator' : modalMode === 'view' ? 'Automation dossier' : modalMode === 'edit' ? 'Edit automation' : 'Create automation'}</span>
                <h2>{modalMode === 'generator' ? 'Generate automation without code' : form.name || 'New automation rule'}</h2>
                <p>{SECTORS.find((s) => s.key === form.sector)?.label || 'All sectors'} · {form.status}</p>
              </div>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>

            {modalMode === 'generator' ? (
              <div className={styles.generatorModal}>
                <textarea value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Describe what you want the system to do. Example: When a hotel prospect is warm but no proposal exists, create a proposal task and alert the manager." />
                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setModalMode(null)}>Cancel</button>
                  <button type="button" onClick={smartGenerate}>Generate automation</button>
                </div>
              </div>
            ) : modalMode === 'view' ? (
              <div className={styles.ruleDossier}>
                <div className={styles.dossierGrid}>
                  <article><span>Status</span><strong>{form.status}</strong></article>
                  <article><span>Sector</span><strong>{SECTORS.find((s) => s.key === form.sector)?.label}</strong></article>
                  <article><span>Severity</span><strong>{form.severity}</strong></article>
                  <article><span>Cadence</span><strong>{form.cadence}</strong></article>
                </div>

                <section><h3>Trigger</h3><p>{form.trigger}</p></section>
                <section><h3>Condition</h3><p>{form.condition}</p></section>
                <section><h3>Action</h3><p>{form.action}</p></section>
                <section><h3>Controller brief</h3><p>{form.aiBrief}</p></section>
                <section><h3>Expected impact</h3><p>{form.expectedImpact}</p></section>

                <div className={styles.channelChips}>
                  {form.channels.map((channel) => <span key={channel}>{channel}</span>)}
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setModalMode(null)}>Close</button>
                  <button type="button" onClick={openEdit}>Edit automation</button>
                  <button type="button" className={styles.deleteButton} onClick={deleteRule}>Delete</button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.formGrid}>
                  <label className={styles.fullField}>Automation name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>

                  <label>Sector<select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value as SectorKey })}>{SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></label>
                  <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AutomationRule['status'] })}><option>Active</option><option>Paused</option><option>Draft</option></select></label>
                  <label>Severity<select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as AutomationRule['severity'] })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label>
                  <label>Cadence<input value={form.cadence} onChange={(e) => setForm({ ...form, cadence: e.target.value })} /></label>
                  <label className={styles.fullField}>Owner<input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></label>
                  <label className={styles.fullField}>Trigger<textarea value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} /></label>
                  <label className={styles.fullField}>Condition<textarea value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} /></label>
                  <label className={styles.fullField}>Action<textarea value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} /></label>
                  <label className={styles.fullField}>Controller brief<textarea value={form.aiBrief} onChange={(e) => setForm({ ...form, aiBrief: e.target.value })} /></label>
                  <label className={styles.fullField}>Expected impact<textarea value={form.expectedImpact} onChange={(e) => setForm({ ...form, expectedImpact: e.target.value })} /></label>
                </div>

                <div className={styles.modalChannels}>
                  <strong>Channels allowed for this automation</strong>
                  <div className={styles.channelChips}>
                    {CHANNELS.map((channel) => (
                      <button key={channel} type="button" className={form.channels.includes(channel) ? styles.activeChip : ''} onClick={() => toggleRuleChannel(channel)}>
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setModalMode(null)}>Cancel</button>
                  <button type="button" onClick={saveRule}>{modalMode === 'create' ? 'Create automation' : 'Save changes'}</button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

function Switch({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`${styles.switchButton} ${active ? styles.switchActive : ''}`} onClick={onClick}>
      <span>{active ? 'ON' : 'OFF'}</span>
      <strong>{label}</strong>
    </button>
  )
}
