'use client'

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'

type Row = Record<string, any>
type TabKey = 'overview' | 'submodules' | 'capabilities' | 'scope' | 'governance' | 'devices'
type Tone = 'navy' | 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'purple'

type Snapshot = {
  user: Row
  access: {
    profile?: Row | null
    modules?: Row[]
    submodules?: Row[]
    capabilities?: Row[]
    adapters?: Row[]
    scopes?: Row[]
    autonomy?: Row[]
    approvals?: Row[]
  }
  devices: Row[]
  audit: Row[]
  changes: Row[]
}

type Draft = {
  enabled: boolean
  moduleEnabled: boolean
  moduleAccessLevel: string
  capabilityAccessLevel: string
  submodules: string[]
  capabilities: string[]
  adapters: string[]
  territories: string[]
  verticals: string[]
  accountOwnership: string
  dataVisibility: string
  autonomy: string
  validUntil: string
  notes: string
  requireSensitiveApproval: boolean
  approverRole: string
}

type Props = {
  initialSnapshot: Snapshot
  modules: Row[]
  b2bContract: { capabilities: Row[] }
}

const B2B_MODULE_KEY = 'revenue_b2b'
const adapterCatalog = [
  { key: 'angelcare_saas', label: 'AngelCare SaaS', detail: 'Synchronise le dossier actuel, ouvre les fiches et renvoie les enrichissements validés.', tone: 'navy' as Tone },
  { key: 'generic_web', label: 'Sites professionnels', detail: 'Reconnaissance d’entreprise, coordonnées publiques, métadonnées et texte sélectionné.', tone: 'blue' as Tone },
  { key: 'google_maps', label: 'Google Maps', detail: 'Capture humaine de fiches sélectionnées, territoire et détection des doublons.', tone: 'green' as Tone },
  { key: 'gmail', label: 'Gmail assisté', detail: 'Résolution du fil sélectionné, signaux commerciaux, préparation de réponse et journalisation contrôlée.', tone: 'amber' as Tone },
  { key: 'whatsapp_web', label: 'WhatsApp Web assisté', detail: 'Contexte de la conversation sélectionnée, engagements et messages préparés sans envoi massif.', tone: 'green' as Tone },
  { key: 'google_calendar', label: 'Google Calendar', detail: 'Contexte de réunion sélectionné, préparation, objectifs et conversion post-réunion.', tone: 'purple' as Tone },
  { key: 'linkedin_assisted', label: 'LinkedIn assisté', detail: 'Capture manuelle et contrôlée des contacts et rôles décisionnels.', tone: 'purple' as Tone, future: true },
]

const verticalCatalog = [
  ['hospitality', 'Hôtellerie & resorts'],
  ['education', 'Écoles, crèches & préscolaire'],
  ['corporate', 'Entreprises & employeurs'],
  ['clinics', 'Cliniques & professionnels pédiatriques'],
  ['events', 'Événements & lieux de réception'],
  ['institutional', 'Partenaires institutionnels'],
]

const mega2Submodules = [
  'account_recognition',
  'duplicate_review',
  'prospects',
  'accounts',
  'contacts',
  'decision_makers',
  'territory_sweep',
  'evidence',
  'account_plans',
  'intelligence',
  'tasks',
  'audit',

]

const mega3Submodules = [
  ...mega2Submodules,
  'today',
  'opportunities',
  'pipeline',
  'outreach',
  'communications',
  'calls',
  'field_visits',
  'meetings',
  'sequences',
  'campaign_attribution',
  'referral_sources',
  'activity_timeline',
]


const mega4Submodules = [
  ...mega3Submodules,
  'partner_programs',
  'proposal_studio',
  'pricing_margin',
  'negotiation_deal_room',
  'closing_room',
  'contracts',
  'payment_promises',
  'revenue_rescue',
]

const mega5Submodules = [
  ...mega4Submodules,
  'operational_handoff',
  'handoff_acceptance',
  'partner_onboarding',
  'partner_activation',
  'activation_management',
  'launch_approval',
  'first_service',
  'hypercare',
  'partner_performance',
  'issue_management',
  'corrective_actions',
  'partner_reviews',
  'upsell',
  'cross_sell',
  'multi_site_expansion',
  'renewals',
  'renewal_approval',
  'tender_management',
  'tender_submission',
  'partner_documents',
  'partner_timeline',
]


const mega6Submodules = [
  ...mega5Submodules,
  'ai_sales_director',
  'management_command',
  'team_priority_management',
  'account_reassignment',
  'pipeline_truth',
  'forecast_management',
  'forecast_override_approval',
  'revenue_risk_command',
  'executive_intervention',
  'staff_execution_quality',
  'coaching_missions',
  'coaching_review',
  'territory_intelligence',
  'vertical_intelligence',
  'executive_reporting',
  'automation_center',
  'automation_approval',
  'automation_administration',
  'automation_kill_switch',
]

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function unique(values: unknown[]) {
  return Array.from(new Set(values.map((value) => clean(value)).filter(Boolean)))
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function scopeValues(access: Snapshot['access'], key: string) {
  const row = (access.scopes || []).find((item) => item.scope_key === key)
  const value = row?.scope_value
  return Array.isArray(value?.values) ? unique(value.values) : []
}

function scopeValue(access: Snapshot['access'], key: string, fallback: string) {
  const row = (access.scopes || []).find((item) => item.scope_key === key)
  return clean(row?.scope_value?.value) || fallback
}

function normalize(snapshot: Snapshot | null | undefined): Draft {
  const access: Snapshot['access'] = snapshot?.access || {}
  const b2bModule = (access.modules || []).find((row) => row.module_key === B2B_MODULE_KEY)
  const b2bAutonomy = (access.autonomy || []).find((row) => row.action_pattern === 'b2b.*')
  const hasSensitiveApproval = (access.approvals || []).some((row) => ['b2b.prospect.merge_request', 'b2b.prospect.branch_create', 'b2b.territory.mission_create'].includes(row.command_pattern))
  return {
    enabled: Boolean(access.profile?.enabled),
    moduleEnabled: Boolean(b2bModule),
    moduleAccessLevel: clean(b2bModule?.access_level) || 'EXECUTE',
    capabilityAccessLevel: clean((access.capabilities || []).find((row) => row.module_key === B2B_MODULE_KEY)?.access_level) || 'EXECUTE',
    submodules: unique((access.submodules || []).filter((row) => row.module_key === B2B_MODULE_KEY).map((row) => row.submodule_key)),
    capabilities: unique((access.capabilities || []).filter((row) => row.module_key === B2B_MODULE_KEY).map((row) => row.capability_key)),
    adapters: unique((access.adapters || []).map((row) => row.adapter_key)).filter((key) => ['angelcare_saas', 'generic_web', 'google_maps', 'gmail', 'whatsapp_web', 'google_calendar'].includes(key)),
    territories: scopeValues(access, 'territories'),
    verticals: scopeValues(access, 'verticals'),
    accountOwnership: scopeValue(access, 'account_ownership', 'assigned_or_created'),
    dataVisibility: scopeValue(access, 'data_visibility', 'authorized_b2b'),
    autonomy: clean(b2bAutonomy?.mode) || clean(access.profile?.default_autonomy) || 'USER_CONFIRMATION',
    validUntil: access.profile?.valid_until ? String(access.profile.valid_until).slice(0, 16) : '',
    notes: clean(access.profile?.notes),
    requireSensitiveApproval: hasSensitiveApproval,
    approverRole: clean((access.approvals || []).find((row) => String(row.command_pattern || '').startsWith('b2b.'))?.approver_role) || 'manager',
  }
}

function toneForStatus(status: unknown): Tone {
  const text = clean(status).toLowerCase()
  if (text === 'active' || text === 'enabled') return 'green'
  if (text.includes('revoked') || text.includes('blocked') || text.includes('disabled')) return 'red'
  if (text.includes('suspend')) return 'amber'
  return 'slate'
}

function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) {
  const palette = palettes[tone]
  return <span style={{ ...badgeStyle, color: palette.text, background: palette.soft, borderColor: palette.border }}>{children}</span>
}

function Metric({ label, value, detail, tone = 'blue' }: { label: string; value: string; detail: string; tone?: Tone }) {
  const palette = palettes[tone]
  return (
    <div style={{ ...metricStyle, borderColor: palette.border, background: palette.fade }}>
      <span style={metricLabelStyle}>{label}</span>
      <strong style={{ ...metricValueStyle, color: palette.text }}>{value}</strong>
      <small style={metricDetailStyle}>{detail}</small>
    </div>
  )
}

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{ ...toggleTrackStyle, background: checked ? '#143d67' : '#dbe5ef', opacity: disabled ? 0.45 : 1 }}
    >
      <span style={{ ...toggleKnobStyle, transform: checked ? 'translateX(22px)' : 'translateX(0)' }} />
    </button>
  )
}

function ChoiceCard({ selected, disabled = false, title, detail, badge, onClick, tone = 'blue' }: { selected: boolean; disabled?: boolean; title: string; detail: string; badge?: string; onClick: () => void; tone?: Tone }) {
  const palette = palettes[tone]
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...choiceStyle,
        borderColor: selected ? palette.solid : '#dce6ef',
        background: selected ? palette.fade : '#fff',
        opacity: disabled ? 0.58 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span style={{ ...choiceCheckStyle, background: selected ? palette.solid : '#fff', borderColor: selected ? palette.solid : '#b8c8d8', color: '#fff' }}>{selected ? '✓' : ''}</span>
      <span style={{ minWidth: 0, textAlign: 'left' }}>
        <strong style={choiceTitleStyle}>{title}</strong>
        <small style={choiceDetailStyle}>{detail}</small>
      </span>
      {badge ? <Badge tone={disabled ? 'slate' : tone}>{badge}</Badge> : null}
    </button>
  )
}

export default function UserBrowserExtensionAccessSection({ initialSnapshot, modules, b2bContract }: Props) {
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const [draft, setDraft] = useState<Draft>(() => normalize(initialSnapshot))
  const [savedDraft, setSavedDraft] = useState<Draft>(() => normalize(initialSnapshot))
  const [tab, setTab] = useState<TabKey>('overview')
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const b2bModule = useMemo(() => modules.find((item) => item.key === B2B_MODULE_KEY) || { submodules: [] }, [modules])
  const capabilities = b2bContract.capabilities || []
  const operationalCapabilities = useMemo(() => capabilities.filter((item) => item.patch02Status === 'implemented' || item.patch03Status === 'implemented' || item.patch04Status === 'implemented' || item.patch05Status === 'implemented' || (item.patch06Status === 'implemented' || item.patch06Status === 'preserved')), [capabilities])
  const futureCapabilities = useMemo(() => capabilities.filter((item) => item.patch02Status !== 'implemented' && item.patch03Status !== 'implemented' && item.patch04Status !== 'implemented' && item.patch05Status !== 'implemented' && item.patch06Status !== 'implemented' && item.patch06Status !== 'preserved'), [capabilities])
  const filteredOperational = useMemo(() => operationalCapabilities.filter((item) => `${item.id} ${item.title} ${item.permission}`.toLowerCase().includes(search.toLowerCase())), [operationalCapabilities, search])
  const filteredFuture = useMemo(() => futureCapabilities.filter((item) => `${item.id} ${item.title} ${item.permission}`.toLowerCase().includes(search.toLowerCase())), [futureCapabilities, search])
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDraft)
  const profile = snapshot.access.profile
  const activeDevices = snapshot.devices.filter((device) => device.status === 'active')
  const completion = operationalCapabilities.length ? Math.round((draft.capabilities.filter((key) => operationalCapabilities.some((item) => item.permission === key)).length / operationalCapabilities.length) * 100) : 0

  function patch(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }))
    setMessage('')
    setError('')
  }

  function toggleList(list: string[], key: string) {
    return list.includes(key) ? list.filter((item) => item !== key) : [...list, key]
  }

  function applyMega2Preset() {
    patch({
      enabled: true,
      moduleEnabled: true,
      moduleAccessLevel: 'EXECUTE',
      capabilityAccessLevel: 'EXECUTE',
      submodules: mega2Submodules.filter((key) => (b2bModule.submodules || []).some((item: Row) => item.key === key)),
      capabilities: operationalCapabilities.map((item) => item.permission),
      adapters: ['angelcare_saas', 'generic_web', 'google_maps'],
      autonomy: 'USER_CONFIRMATION',
      requireSensitiveApproval: true,
      approverRole: 'manager',
      dataVisibility: 'authorized_b2b',
      accountOwnership: 'assigned_or_created',
    })
  }

  function applyMega3Preset() {
    patch({
      enabled: true,
      moduleEnabled: true,
      moduleAccessLevel: 'EXECUTE',
      capabilityAccessLevel: 'EXECUTE',
      submodules: mega3Submodules.filter((key) => (b2bModule.submodules || []).some((item: Row) => item.key === key)),
      capabilities: operationalCapabilities.map((item) => item.permission),
      adapters: ['angelcare_saas', 'generic_web', 'google_maps', 'gmail', 'whatsapp_web', 'google_calendar'],
      autonomy: 'USER_CONFIRMATION',
      requireSensitiveApproval: true,
      approverRole: 'manager',
      dataVisibility: 'authorized_b2b',
      accountOwnership: 'assigned_or_created',
    })
  }

  function applyMega4Preset() {
    patch({
      enabled: true,
      moduleEnabled: true,
      moduleAccessLevel: 'EXECUTE',
      capabilityAccessLevel: 'EXECUTE',
      submodules: mega4Submodules.filter((key) => (b2bModule.submodules || []).some((item: Row) => item.key === key)),
      capabilities: operationalCapabilities.map((item) => item.permission),
      adapters: ['angelcare_saas', 'generic_web', 'google_maps', 'gmail', 'whatsapp_web', 'google_calendar'],
      autonomy: 'USER_CONFIRMATION',
      requireSensitiveApproval: true,
      approverRole: 'managing_director',
      dataVisibility: 'authorized_b2b',
      accountOwnership: 'assigned_or_created',
    })
  }

  function applyMega6Preset() {
    patch({
      enabled: true,
      moduleEnabled: true,
      moduleAccessLevel: 'EXECUTE',
      capabilityAccessLevel: 'EXECUTE',
      submodules: mega6Submodules.filter((key) => (b2bModule.submodules || []).some((item: Row) => item.key === key)),
      capabilities: operationalCapabilities.map((item) => item.permission),
      adapters: ['angelcare_saas', 'generic_web', 'google_maps', 'gmail', 'whatsapp_web', 'google_calendar'],
      autonomy: 'USER_CONFIRMATION',
      requireSensitiveApproval: true,
      approverRole: 'managing_director',
      dataVisibility: 'authorized_b2b',
      accountOwnership: 'assigned_or_created',
    })
  }

  function applyReadOnlyPreset() {
    patch({
      enabled: true,
      moduleEnabled: true,
      moduleAccessLevel: 'VIEW',
      capabilityAccessLevel: 'VIEW',
      submodules: mega3Submodules.filter((key) => (b2bModule.submodules || []).some((item: Row) => item.key === key)),
      capabilities: operationalCapabilities.map((item) => item.permission),
      adapters: ['angelcare_saas', 'generic_web', 'gmail', 'google_calendar'],
      autonomy: 'READ_ONLY',
      requireSensitiveApproval: true,
    })
  }

  function disableB2B() {
    patch({ moduleEnabled: false, submodules: [], capabilities: [], adapters: [], autonomy: 'BLOCKED' })
  }

  async function refresh() {
    const response = await fetch(`/api/browser-extension/v1/admin/users/${snapshot.user.id}/access`, { cache: 'no-store' })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'Unable to refresh Browser OS access.')
    const next = payload.snapshot as Snapshot | null
    if (!next?.user?.id) {
      throw new Error(
        'Le profil Browser OS a été enregistré, mais son instantané n’a pas pu être rechargé.'
      )
    }
    const nextDraft = normalize(next)
    setSnapshot(next)
    setDraft(nextDraft)
    setSavedDraft(nextDraft)
  }

  async function save() {
    if (draft.moduleEnabled && !draft.capabilities.length) {
      setError('Sélectionnez au moins une capacité B2B opérationnelle avant d’activer le module.')
      setTab('capabilities')
      return
    }
    if (draft.moduleEnabled && !draft.adapters.length) {
      setError('Sélectionnez au moins un adaptateur navigateur autorisé.')
      setTab('scope')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    const response = await fetch(`/api/browser-extension/v1/admin/users/${snapshot.user.id}/access`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b2b: draft }),
    })
    const payload = await response.json().catch(() => ({}))
    setBusy(false)
    if (!response.ok || !payload.ok) {
      setError(payload.error || 'Échec de la sauvegarde de l’accès Browser OS.')
      return
    }
    const next = payload.snapshot as Snapshot | null
    if (!next?.user?.id) {
      setError(
        'L’accès a été enregistré, mais le profil actualisé n’a pas pu être rechargé. Rechargez la page.'
      )
      return
    }
    const nextDraft = normalize(next)
    setSnapshot(next)
    setDraft(nextDraft)
    setSavedDraft(nextDraft)
    setMessage(`Accès Browser OS sauvegardé et propagé — version ${payload.accessVersion}.`)
  }

  async function revokeDevice(deviceId: string) {
    if (!window.confirm('Révoquer immédiatement cet appareil et ses sessions Browser OS ?')) return
    setBusy(true)
    setError('')
    const response = await fetch(`/api/browser-extension/v1/admin/devices/${deviceId}/revoke`, { method: 'POST' })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || !payload.ok) setError(payload.error || 'Révocation impossible.')
    else {
      await refresh().catch((refreshError) => setError(refreshError instanceof Error ? refreshError.message : 'Actualisation impossible.'))
      setMessage('Appareil révoqué immédiatement.')
    }
    setBusy(false)
  }

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: 'overview', label: 'Cockpit' },
    { key: 'submodules', label: 'Sous-modules', count: draft.submodules.length },
    { key: 'capabilities', label: '45 capacités', count: draft.capabilities.length },
    { key: 'scope', label: 'Adaptateurs & périmètre', count: draft.adapters.length },
    { key: 'governance', label: 'Autonomie & approbations' },
    { key: 'devices', label: 'Appareils & audit', count: activeDevices.length },
  ]

  return (
    <section style={shellStyle} id="browser-extension-access">
      <div style={heroStyle}>
        <div style={heroGlowStyle} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={eyebrowStyle}>ANGELCARE REVENUE COMMAND · ACCÈS UTILISATEUR</div>
          <h2 style={titleStyle}>Browser OS B2B — configuration individuelle</h2>
          <p style={subtitleStyle}>
            Activez précisément les capacités navigateur de <strong>{snapshot.user.full_name || snapshot.user.name || snapshot.user.email}</strong>. Les modules, commandes, adaptateurs et données non attribués restent indisponibles et non chargés.
          </p>
          <div style={heroBadgesStyle}>
            <Badge tone={draft.enabled ? 'green' : 'red'}>{draft.enabled ? 'Extension autorisée' : 'Extension désactivée'}</Badge>
            <Badge tone={draft.moduleEnabled ? 'blue' : 'slate'}>{draft.moduleEnabled ? 'Revenue B2B chargé' : 'Revenue B2B non chargé'}</Badge>
            <Badge tone="purple">Accès version {profile?.access_version || 0}</Badge>
            <Badge tone={activeDevices.length ? 'green' : 'amber'}>{activeDevices.length} appareil(s) actif(s)</Badge>
          </div>
        </div>
        <div style={heroActionsStyle}>
          <label style={masterToggleStyle}>
            <span>
              <strong>Autoriser l’extension</strong>
              <small>Condition obligatoire avant tout appairage.</small>
            </span>
            <Toggle checked={draft.enabled} onChange={(enabled) => patch({ enabled })} />
          </label>
          <button type="button" onClick={save} disabled={busy || !dirty} style={{ ...saveButtonStyle, opacity: busy || !dirty ? 0.55 : 1 }}>
            {busy ? 'Propagation en cours…' : dirty ? 'Enregistrer et propager' : 'Configuration synchronisée'}
          </button>
        </div>
      </div>

      <div style={metricsStyle}>
        <Metric label="Compétences opérationnelles" value={`${draft.capabilities.length}/${operationalCapabilities.length}`} detail="Mega ZIP 6 assignées" tone="blue" />
        <Metric label="Couverture intelligence" value={`${completion}%`} detail="Contrat opérationnel actuel" tone={completion === 100 ? 'green' : 'amber'} />
        <Metric label="Sous-modules" value={String(draft.submodules.length)} detail="Interfaces chargées à la demande" tone="purple" />
        <Metric label="Adaptateurs" value={String(draft.adapters.length)} detail="Origines navigateur autorisées" tone="green" />
        <Metric label="Contrat signé" value="45" detail={`${futureCapabilities.length} capacités verrouillées pour les vagues suivantes`} tone="navy" />
      </div>

      {error ? <div style={errorStyle}><strong>Configuration bloquée</strong><span>{error}</span></div> : null}
      {message ? <div style={successStyle}><strong>Succès</strong><span>{message}</span></div> : null}

      <div style={workspaceStyle}>
        <nav style={tabBarStyle}>
          {tabs.map((item) => (
            <button key={item.key} type="button" onClick={() => setTab(item.key)} style={{ ...tabStyle, ...(tab === item.key ? activeTabStyle : {}) }}>
              {item.label}{typeof item.count === 'number' ? <span style={tabCountStyle}>{item.count}</span> : null}
            </button>
          ))}
        </nav>

        <div style={scrollBodyStyle}>
          {tab === 'overview' ? (
            <div style={contentGridStyle}>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <div>
                    <span style={panelEyebrowStyle}>Runtime individuel</span>
                    <h3 style={panelTitleStyle}>Revenue B2B Partnerships</h3>
                    <p style={panelTextStyle}>Ce commutateur décide si le bundle B2B, ses écrans et ses commandes sont chargés pour cet utilisateur.</p>
                  </div>
                  <Toggle checked={draft.moduleEnabled} onChange={(moduleEnabled) => patch({ moduleEnabled })} />
                </div>
                <div style={twoColStyle}>
                  <label style={fieldStyle}>Niveau module
                    <select value={draft.moduleAccessLevel} onChange={(event) => patch({ moduleAccessLevel: event.target.value })} style={inputStyle}>
                      {['VIEW', 'SUGGEST', 'CREATE', 'EXECUTE', 'APPROVE', 'ADMINISTER'].map((value) => <option key={value}>{value}</option>)}
                    </select>
                  </label>
                  <label style={fieldStyle}>Niveau capacités
                    <select value={draft.capabilityAccessLevel} onChange={(event) => patch({ capabilityAccessLevel: event.target.value })} style={inputStyle}>
                      {['VIEW', 'SUGGEST', 'CREATE', 'EXECUTE', 'APPROVE'].map((value) => <option key={value}>{value}</option>)}
                    </select>
                  </label>
                </div>
                <div style={runtimeDoctrineStyle}>
                  <strong>Comportement appliqué</strong>
                  <span>Au démarrage, l’extension récupère la version d’accès, charge uniquement Revenue B2B et refuse toute commande non attribuée côté serveur.</span>
                </div>
              </div>

              <div style={panelStyle}>
                <span style={panelEyebrowStyle}>Profils rapides</span>
                <h3 style={panelTitleStyle}>Déploiement contrôlé</h3>
                <p style={panelTextStyle}>Appliquez un socle cohérent, puis affinez individuellement les sous-modules et compétences.</p>
                <div style={presetListStyle}>
                  <button type="button" onClick={applyMega6Preset} style={presetButtonStyle}><strong>Mega ZIP 6 — AI Sales Director complet</strong><span>{operationalCapabilities.length} capacités opérationnelles, AI Sales Director, management, forecast, revenue risk, coaching, reporting et automation contrôlée.</span></button>
                  <button type="button" onClick={applyMega4Preset} style={presetButtonStyle}><strong>Mega ZIP 4 — Deal Closing complet</strong><span>{operationalCapabilities.length} capacités opérationnelles, Proposal Studio, pricing, marge, négociation, closing, paiement et rescue.</span></button>
                  <button type="button" onClick={applyMega3Preset} style={presetButtonStyle}><strong>Mega ZIP 3 — Exécution Revenue complète</strong><span>{operationalCapabilities.length} capacités opérationnelles, 6 adaptateurs, pipeline, outreach, réunions, suivis et commandement quotidien.</span></button>
                  <button type="button" onClick={applyMega2Preset} style={presetButtonStyle}><strong>Mega ZIP 2 — Intelligence complète</strong><span>{operationalCapabilities.length} capacités opérationnelles, 3 adaptateurs, confirmation utilisateur et approbations sensibles.</span></button>
                  <button type="button" onClick={applyReadOnlyPreset} style={presetButtonStyle}><strong>Observation B2B en lecture seule</strong><span>Reconnaissance et intelligence visibles sans mutation commerciale.</span></button>
                  <button type="button" onClick={disableB2B} style={{ ...presetButtonStyle, borderColor: '#fecaca', background: '#fff7f7' }}><strong style={{ color: '#b42318' }}>Désactiver Revenue B2B</strong><span>Retire les compétences, adaptateurs et bloque les commandes B2B.</span></button>
                </div>
              </div>

              <div style={{ ...panelStyle, gridColumn: '1 / -1' }}>
                <div style={panelHeaderStyle}>
                  <div>
                    <span style={panelEyebrowStyle}>Aperçu d’exécution</span>
                    <h3 style={panelTitleStyle}>Ce que l’utilisateur pourra réellement faire</h3>
                  </div>
                  <Badge tone={completion === 100 ? 'green' : 'amber'}>{completion}% de la vague active</Badge>
                </div>
                <div style={flowGridStyle}>
                  {[
                    ['1', 'Détecter', 'Comprendre la page, l’entreprise, le secteur et la source.'],
                    ['2', 'Reconnaître', 'Retrouver le prospect existant ou prévenir le doublon.'],
                    ['3', 'Qualifier', 'Scorer le potentiel, le vertical et les signaux commerciaux.'],
                    ['4', 'Structurer', 'Créer contacts, comité d’achat, plan de compte et missions de recherche.'],
                    ['5', 'Territoire', 'Capturer des cibles Google Maps sélectionnées et mesurer la couverture.'],
                    ['6', 'Tracer', 'Conserver preuve, confiance, utilisateur, appareil et audit.'],
                  ].map(([step, title, detail]) => <div key={step} style={flowCardStyle}><span style={flowStepStyle}>{step}</span><strong>{title}</strong><small>{detail}</small></div>)}
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'submodules' ? (
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <span style={panelEyebrowStyle}>Chargement dynamique</span>
                  <h3 style={panelTitleStyle}>Sous-modules B2B visibles dans l’extension</h3>
                  <p style={panelTextStyle}>Une section non cochée ne doit ni apparaître, ni charger son interface, ni exposer ses données.</p>
                </div>
                <Badge tone="blue">{draft.submodules.length}/{(b2bModule.submodules || []).length}</Badge>
              </div>
              <div style={choiceGridStyle}>
                {(b2bModule.submodules || []).map((submodule: Row) => {
                  const future = !mega6Submodules.includes(submodule.key)
                  return <ChoiceCard key={submodule.key} selected={draft.submodules.includes(submodule.key)} disabled={future} title={submodule.label} detail={future ? 'Contrat signé — non activée dans le runtime B2B actuel.' : `Runtime Mega ZIP 6 · ${submodule.key}`} badge={future ? 'À venir' : 'Opérationnel'} tone={future ? 'slate' : 'blue'} onClick={() => patch({ submodules: toggleList(draft.submodules, submodule.key) })} />
                })}
              </div>
            </div>
          ) : null}

          {tab === 'capabilities' ? (
            <div style={panelStyle}>
              <div style={panelHeaderStyle}>
                <div>
                  <span style={panelEyebrowStyle}>Contrat signé et traçable</span>
                  <h3 style={panelTitleStyle}>Compétences B2B individuelles</h3>
                  <p style={panelTextStyle}>Les capacités opérationnelles peuvent être attribuées maintenant. Les autres restent visibles mais verrouillées jusqu’à leur livraison.</p>
                </div>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher B2B-001, scoring, meeting…" style={{ ...inputStyle, width: 330 }} />
              </div>
              <div style={capabilitySectionStyle}>
                <div style={capabilityGroupHeaderStyle}><strong>Opérationnelles — Mega ZIP 6</strong><Badge tone="green">{draft.capabilities.length}/{operationalCapabilities.length} attribuées</Badge></div>
                <div style={choiceGridStyle}>
                  {filteredOperational.map((capability) => <ChoiceCard key={capability.permission} selected={draft.capabilities.includes(capability.permission)} title={`${capability.id} · ${capability.title}`} detail={`${capability.permission} · ${capability.commands?.length || 0} commande(s) gouvernée(s)`} badge="Live" tone="green" onClick={() => patch({ capabilities: toggleList(draft.capabilities, capability.permission) })} />)}
                </div>
              </div>
              <div style={capabilitySectionStyle}>
                <div style={capabilityGroupHeaderStyle}><strong>Contrat verrouillé — prochaines vagues</strong><Badge tone="slate">{futureCapabilities.length} protégées</Badge></div>
                <div style={choiceGridStyle}>
                  {filteredFuture.map((capability) => <ChoiceCard key={capability.permission} selected={false} disabled title={`${capability.id} · ${capability.title}`} detail={`Vague ${capability.deliveryWave || 'future'} · non assignable avant implémentation complète`} badge="Signé" tone="slate" onClick={() => undefined} />)}
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'scope' ? (
            <div style={contentGridStyle}>
              <div style={{ ...panelStyle, gridColumn: '1 / -1' }}>
                <span style={panelEyebrowStyle}>Origines autorisées</span>
                <h3 style={panelTitleStyle}>Adaptateurs navigateur</h3>
                <p style={panelTextStyle}>Un adaptateur non attribué reste non injecté et ses commandes sont refusées par le gateway.</p>
                <div style={choiceGridStyle}>
                  {adapterCatalog.map((adapter) => <ChoiceCard key={adapter.key} selected={draft.adapters.includes(adapter.key)} disabled={Boolean(adapter.future)} title={adapter.label} detail={adapter.detail} badge={adapter.future ? 'À venir' : 'Disponible'} tone={adapter.tone} onClick={() => patch({ adapters: toggleList(draft.adapters, adapter.key) })} />)}
                </div>
              </div>

              <div style={panelStyle}>
                <span style={panelEyebrowStyle}>Territoire</span>
                <h3 style={panelTitleStyle}>Zones autorisées</h3>
                <p style={panelTextStyle}>Laissez vide pour ne pas appliquer de filtre géographique supplémentaire au périmètre B2B autorisé.</p>
                <label style={fieldStyle}>Villes / territoires
                  <textarea value={draft.territories.join(', ')} onChange={(event) => patch({ territories: unique(event.target.value.split(',')) })} placeholder="Casablanca, Rabat, Kénitra…" style={{ ...inputStyle, minHeight: 110 }} />
                </label>
                <div style={quickChipsStyle}>{['Casablanca', 'Rabat', 'Kénitra', 'Tanger', 'Marrakech', 'Fès', 'Agadir'].map((city) => <button type="button" key={city} onClick={() => patch({ territories: toggleList(draft.territories, city) })} style={{ ...quickChipStyle, ...(draft.territories.includes(city) ? quickChipActiveStyle : {}) }}>{city}</button>)}</div>
              </div>

              <div style={panelStyle}>
                <span style={panelEyebrowStyle}>Verticals</span>
                <h3 style={panelTitleStyle}>Marchés autorisés</h3>
                <div style={verticalListStyle}>
                  {verticalCatalog.map(([key, label]) => <label key={key} style={verticalChoiceStyle}><input type="checkbox" checked={draft.verticals.includes(key)} onChange={() => patch({ verticals: toggleList(draft.verticals, key) })} /><span>{label}</span></label>)}
                </div>
              </div>

              <div style={{ ...panelStyle, gridColumn: '1 / -1' }}>
                <div style={twoColStyle}>
                  <label style={fieldStyle}>Portefeuille visible
                    <select value={draft.accountOwnership} onChange={(event) => patch({ accountOwnership: event.target.value })} style={inputStyle}>
                      <option value="assigned_or_created">Comptes assignés ou créés par l’utilisateur</option>
                      <option value="department">Comptes du département</option>
                      <option value="territory">Comptes du territoire attribué</option>
                      <option value="all_authorized">Tous les comptes B2B autorisés</option>
                    </select>
                  </label>
                  <label style={fieldStyle}>Visibilité des données
                    <select value={draft.dataVisibility} onChange={(event) => patch({ dataVisibility: event.target.value })} style={inputStyle}>
                      <option value="authorized_b2b">Données B2B autorisées uniquement</option>
                      <option value="assigned_records">Enregistrements assignés uniquement</option>
                      <option value="metadata_only">Métadonnées sans contenu sensible</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'governance' ? (
            <div style={contentGridStyle}>
              <div style={panelStyle}>
                <span style={panelEyebrowStyle}>Niveau d’autonomie</span>
                <h3 style={panelTitleStyle}>Comportement des commandes B2B</h3>
                <label style={fieldStyle}>Politique `b2b.*`
                  <select value={draft.autonomy} onChange={(event) => patch({ autonomy: event.target.value })} style={inputStyle}>
                    <option value="READ_ONLY">READ_ONLY — lecture uniquement</option>
                    <option value="SUGGEST_ONLY">SUGGEST_ONLY — recommandations sans exécution</option>
                    <option value="USER_CONFIRMATION">USER_CONFIRMATION — confirmation avant mutation</option>
                    <option value="MANAGER_APPROVAL">MANAGER_APPROVAL — validation manager</option>
                    <option value="SAFE_AUTOMATION">SAFE_AUTOMATION — actions internes sûres</option>
                    <option value="BLOCKED">BLOCKED — toutes commandes B2B bloquées</option>
                  </select>
                </label>
                <div style={governanceNoticeStyle}><strong>Recommandation actuelle</strong><span>USER_CONFIRMATION pour l’intelligence B2B, afin que la reconnaissance soit automatique mais que toute création ou modification reste confirmée.</span></div>
              </div>

              <div style={panelStyle}>
                <span style={panelEyebrowStyle}>Actions sensibles</span>
                <h3 style={panelTitleStyle}>Approbations obligatoires</h3>
                <label style={approvalToggleStyle}><Toggle checked={draft.requireSensitiveApproval} onChange={(requireSensitiveApproval) => patch({ requireSensitiveApproval })} /><span><strong>Exiger une approbation</strong><small>Fusion, branche, territoire, remise, pricing exceptionnel, clôture, contrat et paiement sensibles.</small></span></label>
                <label style={fieldStyle}>Rôle approbateur
                  <select value={draft.approverRole} onChange={(event) => patch({ approverRole: event.target.value })} style={inputStyle}>
                    <option value="manager">Manager</option>
                    <option value="sales_director">Sales Director</option>
                    <option value="managing_director">Managing Director</option>
                    <option value="ceo">CEO</option>
                  </select>
                </label>
              </div>

              <div style={panelStyle}>
                <span style={panelEyebrowStyle}>Durée</span>
                <h3 style={panelTitleStyle}>Validité de l’accès</h3>
                <label style={fieldStyle}>Expiration facultative
                  <input type="datetime-local" value={draft.validUntil} onChange={(event) => patch({ validUntil: event.target.value })} style={inputStyle} />
                </label>
                <p style={panelTextStyle}>Une expiration déclenche un refus serveur même si le bundle est encore visible dans une session ancienne.</p>
              </div>

              <div style={panelStyle}>
                <span style={panelEyebrowStyle}>Justification administrative</span>
                <h3 style={panelTitleStyle}>Note d’attribution</h3>
                <textarea value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} placeholder="Mission, périmètre, responsable, conditions et date de revue…" style={{ ...inputStyle, minHeight: 140 }} />
              </div>
            </div>
          ) : null}

          {tab === 'devices' ? (
            <div style={contentGridStyle}>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}><div><span style={panelEyebrowStyle}>Appareils enregistrés</span><h3 style={panelTitleStyle}>Chrome Browser OS</h3></div><Badge tone={activeDevices.length ? 'green' : 'amber'}>{activeDevices.length} actif(s)</Badge></div>
                <div style={deviceListStyle}>
                  {snapshot.devices.length ? snapshot.devices.map((device) => <div key={device.id} style={deviceCardStyle}><div style={deviceHeaderStyle}><span style={deviceIconStyle}>◫</span><div><strong>{device.device_name || 'Chrome device'}</strong><small>{device.platform || 'Plateforme inconnue'} · extension {device.extension_version || '—'}</small></div><Badge tone={toneForStatus(device.status)}>{String(device.status || 'unknown').toUpperCase()}</Badge></div><div style={deviceMetaStyle}><span>Dernière activité: {formatDate(device.last_seen_at)}</span><span>Appairé: {formatDate(device.paired_at)}</span><span>Canal: {device.release_channel || 'pilot'}</span></div>{device.status === 'active' ? <button type="button" disabled={busy} onClick={() => revokeDevice(device.id)} style={revokeButtonStyle}>Révoquer immédiatement</button> : null}</div>) : <div style={emptyStyle}>Aucun appareil appairé. L’utilisateur pourra se connecter après sauvegarde de l’accès.</div>}
                </div>
              </div>

              <div style={panelStyle}>
                <span style={panelEyebrowStyle}>Historique des accès</span>
                <h3 style={panelTitleStyle}>Versions et changements</h3>
                <div style={timelineStyle}>
                  {snapshot.changes.length ? snapshot.changes.map((change) => <div key={change.id} style={timelineRowStyle}><span style={timelineDotStyle} /><div><strong>Version {change.previous_version || 0} → {change.new_version}</strong><small>{formatDate(change.created_at)}</small></div></div>) : <div style={emptyStyle}>Aucun changement d’accès enregistré.</div>}
                </div>
              </div>

              <div style={{ ...panelStyle, gridColumn: '1 / -1' }}>
                <span style={panelEyebrowStyle}>Audit immuable</span>
                <h3 style={panelTitleStyle}>Événements Browser OS récents</h3>
                <div style={auditTableStyle}>
                  <div style={auditHeaderStyle}><span>Événement</span><span>Résultat</span><span>Sévérité</span><span>Date</span></div>
                  {snapshot.audit.length ? snapshot.audit.map((event) => <div key={event.id} style={auditRowStyle}><span><strong>{event.event_type}</strong><small>{event.module_key || event.target_type || 'Browser OS'}</small></span><Badge tone={event.result === 'ok' ? 'green' : 'red'}>{event.result || '—'}</Badge><Badge tone={event.severity === 'high' ? 'red' : event.severity === 'medium' ? 'amber' : 'slate'}>{event.severity || 'info'}</Badge><span>{formatDate(event.created_at)}</span></div>) : <div style={emptyStyle}>Aucun événement Browser OS pour cet utilisateur.</div>}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <footer style={stickyFooterStyle}>
          <div>
            <strong>{dirty ? 'Modifications non enregistrées' : 'Accès synchronisé'}</strong>
            <span>{draft.moduleEnabled ? `${draft.capabilities.length} capacité(s), ${draft.submodules.length} sous-module(s), ${draft.adapters.length} adaptateur(s)` : 'Revenue B2B non attribué'}</span>
          </div>
          <button type="button" onClick={() => { setDraft(savedDraft); setError(''); setMessage('') }} disabled={!dirty || busy} style={secondaryButtonStyle}>Annuler modifications</button>
          <button type="button" onClick={save} disabled={busy || !dirty} style={{ ...saveButtonStyle, opacity: busy || !dirty ? 0.55 : 1 }}>{busy ? 'Sauvegarde…' : 'Enregistrer l’accès individuel'}</button>
        </footer>
      </div>
    </section>
  )
}

const palettes: Record<Tone, { solid: string; text: string; soft: string; fade: string; border: string }> = {
  navy: { solid: '#123a63', text: '#123a63', soft: '#eaf2fa', fade: '#f6faff', border: '#b9d2e8' },
  blue: { solid: '#2563eb', text: '#1d4ed8', soft: '#eff6ff', fade: '#f7faff', border: '#bfdbfe' },
  green: { solid: '#16a34a', text: '#08783d', soft: '#ecfdf3', fade: '#f5fff8', border: '#bbf7d0' },
  amber: { solid: '#d97706', text: '#a95508', soft: '#fff7e8', fade: '#fffbf4', border: '#fde0a5' },
  red: { solid: '#dc2626', text: '#b42318', soft: '#fff0ee', fade: '#fff8f7', border: '#fecaca' },
  slate: { solid: '#64748b', text: '#475569', soft: '#f1f5f9', fade: '#fbfcfe', border: '#dbe4ed' },
  purple: { solid: '#7c3aed', text: '#6d28d9', soft: '#f5f0ff', fade: '#fbf9ff', border: '#ddd0ff' },
}

const shellStyle: CSSProperties = { gridColumn: '1 / -1', display: 'grid', gap: 16, padding: 18, borderRadius: 34, border: '1px solid #b9d2e8', background: 'linear-gradient(180deg,#eef6fd 0%,#f8fbfe 100%)', boxShadow: '0 30px 80px rgba(15,45,75,.13)' }
const heroStyle: CSSProperties = { position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 390px', gap: 24, padding: 26, borderRadius: 28, background: 'linear-gradient(135deg,#ffffff 0%,#eef6ff 45%,#e8f4fb 100%)', border: '1px solid rgba(166,201,230,.9)' }
const heroGlowStyle: CSSProperties = { position: 'absolute', right: -80, bottom: -180, width: 430, height: 430, borderRadius: 999, background: 'radial-gradient(circle,rgba(37,99,235,.2),transparent 66%)', pointerEvents: 'none' }
const eyebrowStyle: CSSProperties = { color: '#557798', fontSize: 11, fontWeight: 1000, letterSpacing: '.18em' }
const titleStyle: CSSProperties = { margin: '9px 0 10px', color: '#102e4e', fontSize: 31, lineHeight: 1.08, letterSpacing: '-.04em', fontWeight: 1000 }
const subtitleStyle: CSSProperties = { margin: 0, maxWidth: 900, color: '#5a7087', fontSize: 14, lineHeight: 1.7, fontWeight: 650 }
const heroBadgesStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }
const heroActionsStyle: CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', gap: 12, alignContent: 'center' }
const masterToggleStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: 16, borderRadius: 20, background: 'rgba(255,255,255,.88)', border: '1px solid #c9dceb', boxShadow: '0 12px 30px rgba(19,56,92,.08)' }
const badgeStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 26, padding: '4px 9px', borderRadius: 999, border: '1px solid', fontSize: 10, fontWeight: 950, letterSpacing: '.03em', whiteSpace: 'nowrap' }
const toggleTrackStyle: CSSProperties = { width: 50, height: 28, border: 0, borderRadius: 999, padding: 3, transition: '.2s ease', cursor: 'pointer', flexShrink: 0 }
const toggleKnobStyle: CSSProperties = { display: 'block', width: 22, height: 22, borderRadius: 999, background: '#fff', boxShadow: '0 3px 9px rgba(15,23,42,.22)', transition: '.2s ease' }
const saveButtonStyle: CSSProperties = { border: 0, borderRadius: 15, padding: '14px 18px', background: 'linear-gradient(135deg,#123a63,#245f95)', color: '#fff', fontSize: 13, fontWeight: 950, cursor: 'pointer', boxShadow: '0 13px 28px rgba(18,58,99,.24)' }
const metricsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }
const metricStyle: CSSProperties = { display: 'grid', gap: 5, minHeight: 112, padding: 16, border: '1px solid', borderRadius: 20 }
const metricLabelStyle: CSSProperties = { color: '#62778c', fontSize: 10, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase' }
const metricValueStyle: CSSProperties = { fontSize: 27, lineHeight: 1, fontWeight: 1000 }
const metricDetailStyle: CSSProperties = { color: '#728396', fontSize: 11, lineHeight: 1.45, fontWeight: 700 }
const errorStyle: CSSProperties = { display: 'grid', gap: 3, padding: 14, borderRadius: 15, background: '#fff1ef', border: '1px solid #fecaca', color: '#a52b22' }
const successStyle: CSSProperties = { display: 'grid', gap: 3, padding: 14, borderRadius: 15, background: '#ecfdf3', border: '1px solid #bbf7d0', color: '#08783d' }
const workspaceStyle: CSSProperties = { overflow: 'hidden', border: '1px solid #c9dcea', borderRadius: 26, background: '#fff', boxShadow: '0 18px 48px rgba(15,45,75,.08)' }
const tabBarStyle: CSSProperties = { position: 'sticky', top: 0, zIndex: 10, display: 'flex', gap: 6, overflowX: 'auto', padding: 10, background: 'rgba(247,251,254,.96)', borderBottom: '1px solid #dce7f0', backdropFilter: 'blur(18px)' }
const tabStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid transparent', borderRadius: 13, padding: '10px 13px', background: 'transparent', color: '#597087', fontSize: 12, fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }
const activeTabStyle: CSSProperties = { background: '#123a63', color: '#fff', boxShadow: '0 9px 20px rgba(18,58,99,.22)' }
const tabCountStyle: CSSProperties = { display: 'inline-grid', placeItems: 'center', minWidth: 22, height: 20, padding: '0 5px', borderRadius: 999, background: 'rgba(255,255,255,.18)', fontSize: 10 }
const scrollBodyStyle: CSSProperties = { maxHeight: 980, overflowY: 'auto', padding: 18, background: 'linear-gradient(180deg,#f8fbfd,#f4f8fb)' }
const contentGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16 }
const panelStyle: CSSProperties = { padding: 19, borderRadius: 21, background: '#fff', border: '1px solid #dce7f0', boxShadow: '0 8px 24px rgba(17,50,83,.05)' }
const panelHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 15 }
const panelEyebrowStyle: CSSProperties = { color: '#67819a', fontSize: 10, fontWeight: 1000, letterSpacing: '.13em', textTransform: 'uppercase' }
const panelTitleStyle: CSSProperties = { margin: '5px 0 7px', color: '#173550', fontSize: 20, fontWeight: 1000, letterSpacing: '-.025em' }
const panelTextStyle: CSSProperties = { margin: 0, color: '#6b7f92', fontSize: 12, lineHeight: 1.65, fontWeight: 650 }
const twoColStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 7, color: '#435b72', fontSize: 11, fontWeight: 900 }
const inputStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', border: '1px solid #cddce8', borderRadius: 13, padding: '11px 12px', background: '#fff', color: '#173550', fontSize: 12, fontWeight: 750, outline: 'none' }
const runtimeDoctrineStyle: CSSProperties = { display: 'grid', gap: 5, marginTop: 15, padding: 14, borderRadius: 15, background: '#eef6ff', border: '1px solid #c9def3', color: '#315b82', fontSize: 12, lineHeight: 1.55 }
const presetListStyle: CSSProperties = { display: 'grid', gap: 10, marginTop: 14 }
const presetButtonStyle: CSSProperties = { display: 'grid', gap: 4, textAlign: 'left', padding: 14, borderRadius: 15, border: '1px solid #cfdeea', background: '#f9fcff', color: '#173550', cursor: 'pointer' }
const flowGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginTop: 12 }
const flowCardStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '34px 1fr', gap: '3px 10px', alignItems: 'center', padding: 13, borderRadius: 15, background: '#f8fbfe', border: '1px solid #dce7f0', color: '#31506d' }
const flowStepStyle: CSSProperties = { gridRow: '1 / span 2', display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 10, background: '#123a63', color: '#fff', fontWeight: 1000 }
const choiceGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 14 }
const choiceStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '25px minmax(0,1fr) auto', alignItems: 'center', gap: 11, minHeight: 78, padding: 12, border: '1px solid', borderRadius: 16 }
const choiceCheckStyle: CSSProperties = { display: 'grid', placeItems: 'center', width: 23, height: 23, borderRadius: 8, border: '1px solid', fontSize: 12, fontWeight: 1000 }
const choiceTitleStyle: CSSProperties = { display: 'block', color: '#173550', fontSize: 12, lineHeight: 1.35, fontWeight: 950 }
const choiceDetailStyle: CSSProperties = { display: 'block', marginTop: 4, color: '#728396', fontSize: 10, lineHeight: 1.45, fontWeight: 650, overflowWrap: 'anywhere' }
const capabilitySectionStyle: CSSProperties = { marginTop: 18, paddingTop: 16, borderTop: '1px solid #e3ebf2' }
const capabilityGroupHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, color: '#274761' }
const quickChipsStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 11 }
const quickChipStyle: CSSProperties = { border: '1px solid #d1deea', borderRadius: 999, padding: '7px 10px', background: '#fff', color: '#5b7186', fontSize: 10, fontWeight: 850, cursor: 'pointer' }
const quickChipActiveStyle: CSSProperties = { background: '#123a63', borderColor: '#123a63', color: '#fff' }
const verticalListStyle: CSSProperties = { display: 'grid', gap: 9, marginTop: 12 }
const verticalChoiceStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, padding: 10, borderRadius: 12, background: '#f8fbfd', border: '1px solid #e0e9f1', color: '#36536d', fontSize: 11, fontWeight: 850 }
const governanceNoticeStyle: CSSProperties = { display: 'grid', gap: 4, marginTop: 14, padding: 13, borderRadius: 14, background: '#fff7e8', border: '1px solid #fde0a5', color: '#8a540d', fontSize: 11, lineHeight: 1.55 }
const approvalToggleStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 13, margin: '12px 0 15px', padding: 13, borderRadius: 14, border: '1px solid #dce7f0', background: '#f8fbfd' }
const deviceListStyle: CSSProperties = { display: 'grid', gap: 11, marginTop: 12 }
const deviceCardStyle: CSSProperties = { display: 'grid', gap: 10, padding: 14, borderRadius: 16, border: '1px solid #dce7f0', background: '#f9fcfe' }
const deviceHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '38px minmax(0,1fr) auto', alignItems: 'center', gap: 10 }
const deviceIconStyle: CSSProperties = { display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 12, background: '#eaf3fb', color: '#123a63', fontSize: 19 }
const deviceMetaStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 10, color: '#6d8092', fontSize: 10, fontWeight: 700 }
const revokeButtonStyle: CSSProperties = { justifySelf: 'start', border: '1px solid #fecaca', borderRadius: 11, padding: '8px 10px', background: '#fff4f2', color: '#b42318', fontSize: 10, fontWeight: 900, cursor: 'pointer' }
const timelineStyle: CSSProperties = { display: 'grid', gap: 10, marginTop: 13 }
const timelineRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '12px 1fr', gap: 10, alignItems: 'start' }
const timelineDotStyle: CSSProperties = { width: 9, height: 9, borderRadius: 999, marginTop: 4, background: '#2563eb', boxShadow: '0 0 0 4px #eaf2ff' }
const auditTableStyle: CSSProperties = { display: 'grid', marginTop: 13, overflow: 'hidden', border: '1px solid #dce7f0', borderRadius: 15 }
const auditHeaderStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) 110px 110px 170px', gap: 10, padding: 11, background: '#eef5fb', color: '#5b7186', fontSize: 10, fontWeight: 950, textTransform: 'uppercase' }
const auditRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) 110px 110px 170px', gap: 10, alignItems: 'center', padding: 11, borderTop: '1px solid #e5edf3', color: '#4e667d', fontSize: 11 }
const emptyStyle: CSSProperties = { padding: 18, borderRadius: 14, background: '#f8fbfd', color: '#6f8294', fontSize: 12, fontWeight: 750, textAlign: 'center' }
const stickyFooterStyle: CSSProperties = { position: 'sticky', bottom: 0, zIndex: 10, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', alignItems: 'center', gap: 12, padding: 13, background: 'rgba(255,255,255,.96)', borderTop: '1px solid #dce7f0', backdropFilter: 'blur(18px)' }
const secondaryButtonStyle: CSSProperties = { border: '1px solid #cddce8', borderRadius: 13, padding: '12px 14px', background: '#fff', color: '#4d657c', fontSize: 11, fontWeight: 900, cursor: 'pointer' }
