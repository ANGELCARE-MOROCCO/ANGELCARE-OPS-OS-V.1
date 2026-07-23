import type { CSSProperties } from 'react'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import EmailOSMailboxAccessSection from '@/app/(protected)/users/_components/EmailOSMailboxAccessSection'
import UserBrowserExtensionAccessSection from '@/app/(protected)/users/_components/UserBrowserExtensionAccessSection'
import StaffDossierNavigator from './_components/StaffDossierNavigator'
import { getMailboxAccessAudit, getUserEmailOSMailboxAssignments } from '@/lib/email-os-core/access-governance'
import { isExtensionAdmin } from '@/lib/browser-extension/access'
import { loadUserAccess } from '@/lib/browser-extension/runtime'
import { B2B_EXTENSION_CONTRACT, BROWSER_EXTENSION_MODULES } from '@/lib/browser-extension/catalog'

type Tone = 'green' | 'red' | 'blue' | 'purple' | 'amber' | 'slate'
type AnyRecord = Record<string, any>

function safeText(value: unknown, fallback = '—') {
  const text = String(value ?? '').trim()
  return text.length ? text : fallback
}

function initialsFromName(value: unknown) {
  const text = safeText(value, 'User')
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U'
}

function profileCompletionScore(user: AnyRecord) {
  const keys = [
    user.full_name || user.name || user.display_name,
    user.username,
    user.email,
    user.phone || user.phone_number,
    user.language,
    user.department || user.department_name,
    user.job_title || user.position || user.role_title,
    user.role,
    user.status,
    user.created_at,
    user.last_login_at,
    Array.isArray(user.permissions) ? user.permissions.length : null,
  ]

  const present = keys.filter((value) => {
    if (Array.isArray(value)) return value.length > 0
    return String(value ?? '').trim().length > 0
  }).length

  return Math.round((present / keys.length) * 100)
}

function missingProfileFields(user: AnyRecord) {
  const required = [
    ['Nom complet', user.full_name || user.name || user.display_name],
    ['Nom utilisateur', user.username],
    ['Email', user.email],
    ['Téléphone', user.phone || user.phone_number],
    ['Langue', user.language],
    ['Département', user.department || user.department_name],
    ['Poste', user.job_title || user.position || user.role_title],
  ]
  return required.filter(([, value]) => !String(value ?? '').trim()).map(([label]) => label)
}

function formatDate(date?: string | null) {
  if (!date) return '—'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return String(date)
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function shortDate(date?: string | null) {
  if (!date) return '—'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return String(date)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(parsed)
}

function dateInputValue(value: unknown) {
  const text = String(value ?? '').trim()
  if (!text) return ''
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().slice(0, 10)
}

function statusTone(value: unknown): Tone {
  const text = String(value ?? '').toLowerCase()
  if (text.includes('active') || text.includes('actif')) return 'green'
  if (text.includes('suspend') || text.includes('inactive') || text.includes('blocked') || text.includes('désactiv')) return 'red'
  return 'blue'
}

function roleTone(value: unknown): Tone {
  const text = String(value ?? '').toLowerCase()
  if (text.includes('admin') || text.includes('ceo') || text.includes('super')) return 'purple'
  if (text.includes('manager') || text.includes('lead')) return 'blue'
  return 'slate'
}

function permissionTone(permission: string): Tone {
  const text = permission.toLowerCase()
  if (text.includes('delete') || text.includes('admin') || text.includes('manage') || text.includes('governance')) return 'red'
  if (text.includes('billing') || text.includes('payment') || text.includes('payroll') || text.includes('revenue')) return 'amber'
  if (text.startsWith('page:') || text.startsWith('page/')) return 'blue'
  if (text.includes('view')) return 'green'
  return 'slate'
}

function permissionCategory(permission: string) {
  const text = permission.toLowerCase()
  if (text.includes('delete') || text.includes('admin') || text.includes('manage') || text.includes('governance')) return 'Critical access'
  if (text.startsWith('page:') || text.startsWith('page/')) return 'Page routes'
  if (text.includes('.view') || text.includes(':view') || text.endsWith('view')) return 'Read scopes'
  if (text.includes('create') || text.includes('edit') || text.includes('update') || text.includes('write')) return 'Write scopes'
  return 'Module scopes'
}

function permissionLabel(permission: string) {
  const labels: Record<string, string> = {
    'leads.view': 'Voir les leads',
    'leads.create': 'Créer des leads',
    'families.view': 'Voir familles',
    'caregivers.view': 'Voir intervenantes',
    'missions.view': 'Voir missions',
    'missions.assign': 'Assigner missions',
    'billing.view': 'Voir facturation',
    'reports.view': 'Voir rapports',
    'users.manage': 'Gérer utilisateurs',
    'voice_center.access': 'Voice Center',
    'revenue_center.access': 'Revenue Center',
  }

  return labels[permission] || permission
}

function accessHealthScore(permissions: string[], user: AnyRecord, activeSessions: number) {
  let score = 48
  if (String(user.status || '').toLowerCase() === 'active') score += 15
  if (permissions.length > 0) score += 15
  if (permissions.length > 25) score += 8
  if (activeSessions > 0) score += 6
  if (user.last_login_at) score += 8
  if (user.must_change_password) score -= 12
  return Math.max(0, Math.min(100, score))
}

function groupPermissions(permissions: string[]) {
  return permissions.reduce<Record<string, string[]>>((acc, permission) => {
    const category = permissionCategory(permission)
    acc[category] = acc[category] || []
    acc[category].push(permission)
    return acc
  }, {})
}

function sessionState(session: AnyRecord) {
  const expiresAt = session.expires_at ? new Date(session.expires_at) : null
  const active = expiresAt ? expiresAt > new Date() : false
  return active ? 'active' : 'expired'
}

function matchesText(row: AnyRecord, query: string) {
  if (!query) return true
  const haystack = Object.values(row).map((value) => String(value ?? '')).join(' ').toLowerCase()
  return haystack.includes(query.toLowerCase())
}

function toneForActivity(action: unknown): Tone {
  const text = String(action ?? '').toLowerCase()
  if (text.includes('delete') || text.includes('remove') || text.includes('failed') || text.includes('blocked')) return 'red'
  if (text.includes('create') || text.includes('added') || text.includes('login')) return 'green'
  if (text.includes('update') || text.includes('edit') || text.includes('change')) return 'blue'
  return 'slate'
}

function PremiumChip({ label, tone = 'slate', icon }: { label: string; tone?: Tone; icon?: string }) {
  const palette = chipPalette[tone]
  return (
    <span style={{ ...chipStyle, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.color }}>
      {icon ? <span>{icon}</span> : null}
      {label}
    </span>
  )
}

function MiniBar({ value, tone = 'blue' }: { value: number; tone?: Tone }) {
  const palette = chipPalette[tone]
  return (
    <div style={miniBarTrackStyle}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', borderRadius: 999, background: palette.solid }} />
    </div>
  )
}

function RingMeter({ value, label, tone = 'blue' }: { value: number; label: string; tone?: Tone }) {
  const palette = chipPalette[tone]
  return (
    <div style={ringMeterStyle}>
      <div style={{ ...ringCircleStyle, background: `conic-gradient(${palette.solid} ${Math.max(0, Math.min(100, value)) * 3.6}deg,#e2e8f0 0deg)` }}>
        <div style={ringInnerStyle}>{value}%</div>
      </div>
      <div>
        <strong style={ringLabelStyle}>{label}</strong>
        <span style={ringSubStyle}>Synced score</span>
      </div>
    </div>
  )
}

function PremiumKpi({ label, value, detail, tone = 'blue', icon = '◆' }: { label: string; value: string; detail?: string; tone?: Tone; icon?: string }) {
  const palette = chipPalette[tone]
  return (
    <div style={{ ...premiumKpiStyle, border: `1px solid ${palette.border}`, background: palette.soft }}>
      <div style={{ ...kpiIconStyle, background: palette.bg, color: palette.color }}>{icon}</div>
      <div>
        <div style={kpiLabelStyle}>{label}</div>
        <div style={kpiValueStyle}>{value}</div>
        {detail ? <div style={kpiDetailStyle}>{detail}</div> : null}
      </div>
    </div>
  )
}

function Header({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div style={sectionHeaderStyle}>
      <div>
        <div style={eyebrowStyle}>{eyebrow}</div>
        <h2 style={sectionTitleStyle}>{title}</h2>
        {subtitle ? <p style={sectionSubtitleStyle}>{subtitle}</p> : null}
      </div>
    </div>
  )
}

function InfoCard({ label, value, icon = '•', tone = 'slate' }: { label: string; value?: unknown; icon?: string; tone?: Tone }) {
  const palette = chipPalette[tone]
  return (
    <div style={infoCardStyle}>
      <div style={{ ...infoIconStyle, background: palette.bg, color: palette.color }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <span style={infoLabelStyle}>{label}</span>
        <strong style={infoValueStyle}>{safeText(value)}</strong>
      </div>
    </div>
  )
}


function PermissionCard({ permission }: { permission: string }) {
  const tone = permissionTone(permission)
  const palette = chipPalette[tone]
  const isRoute = permission.startsWith('page:') || permission.startsWith('page/')
  const cleanRoute = permission.replace(/^page[:/]/, '/')
  const depth = cleanRoute.split('/').filter(Boolean).length
  const sensitivity =
    tone === 'red' ? 'High control scope' :
    tone === 'amber' ? 'Financial / sensitive scope' :
    isRoute ? 'Workspace route access' :
    'Standard permission scope'

  return (
    <details style={{ ...permissionCardStyle, border: `1px solid ${palette.border}`, background: palette.soft }}>
      <summary style={permissionSummaryButtonStyle}>
        <div style={permissionTopStyle}>
          <div style={{ ...permissionIconStyle, background: palette.bg, color: palette.color }}>{isRoute ? '↗' : '✓'}</div>
          <PremiumChip label={permissionCategory(permission)} tone={tone} />
        </div>
        <strong style={permissionTitleStyle}>{permissionLabel(permission)}</strong>
        <span style={permissionCodeStyle}>{permission}</span>
        <MiniBar value={tone === 'red' ? 92 : tone === 'amber' ? 68 : tone === 'blue' ? 54 : 38} tone={tone} />
        <span style={expandHintStyle}>Click to expand full access details</span>
      </summary>

      <div style={permissionDetailsStyle}>
        <InfoMini label="Full permission key" value={permission} />
        <InfoMini label="Access type" value={permissionCategory(permission)} />
        <InfoMini label="Sensitivity" value={sensitivity} />
        <InfoMini label="Route depth" value={isRoute ? `${depth} levels` : 'Not a page route'} />
        <div style={fullRouteBoxStyle}>
          <span>Full accessed page / module</span>
          <strong>{isRoute ? cleanRoute : permission}</strong>
        </div>
      </div>
    </details>
  )
}

function PermissionGroup({ group, items, total }: { group: string; items: string[]; total: number }) {
  const isPageRoutes = group === 'Page routes'
  const tone: Tone = group === 'Critical access' ? 'red' : isPageRoutes ? 'purple' : 'blue'
  const percent = Math.min(100, Math.round((items.length / Math.max(1, total)) * 100))

  if (isPageRoutes) {
    return (
      <details style={permissionRoutesDetailsStyle}>
        <summary style={permissionRoutesSummaryStyle}>
          <div>
            <h3 style={permissionGroupTitleStyle}>Page routes</h3>
            <p style={permissionGroupTextStyle}>{items.length} synced page route permission{items.length > 1 ? 's' : ''}</p>
          </div>
          <div style={permissionRoutesActionStyle}>
            <MiniBar value={percent} tone="purple" />
            <span style={permissionRoutesButtonStyle}>Show all page routes / retract</span>
          </div>
        </summary>

        <div style={permissionRoutesScrollStyle}>
          <div style={permissionCompactGridStyle}>
            {items.map((permission) => (
              <PermissionCard key={permission} permission={permission} />
            ))}
          </div>
        </div>
      </details>
    )
  }

  return (
    <div style={permissionGroupStyle}>
      <div style={permissionGroupHeadStyle}>
        <div>
          <h3 style={permissionGroupTitleStyle}>{group}</h3>
          <p style={permissionGroupTextStyle}>{items.length} synced permission{items.length > 1 ? 's' : ''}</p>
        </div>
        <MiniBar value={percent} tone={tone} />
      </div>
      <div style={permissionCompactGridStyle}>
        {items.map((permission) => (
          <PermissionCard key={permission} permission={permission} />
        ))}
      </div>
    </div>
  )
}


function SessionCard({ session }: { session: AnyRecord }) {
  const state = sessionState(session)
  const tone: Tone = state === 'active' ? 'green' : 'slate'
  return (
    <div style={sessionCardStyle}>
      <div style={sessionTopStyle}>
        <div style={sessionIconStyle}>{state === 'active' ? '●' : '◌'}</div>
        <div>
          <strong style={sessionTitleStyle}>{state === 'active' ? 'Session active' : 'Session expirée'}</strong>
          <div style={sessionMetaStyle}>ID: {safeText(session.id).slice(0, 18)}</div>
        </div>
        <PremiumChip label={state === 'active' ? 'Active' : 'Expired'} tone={tone} />
      </div>
      <div style={sessionGridStyle}>
        <InfoMini label="Créée" value={formatDate(session.created_at)} />
        <InfoMini label="Expire" value={formatDate(session.expires_at)} />
        <InfoMini label="Source" value={session.source || session.device || session.ip_address || 'Synced session'} />
      </div>
    </div>
  )
}

function ActivityCard({ log }: { log: AnyRecord }) {
  const tone = toneForActivity(log.action)
  const palette = chipPalette[tone]
  return (
    <div style={activityCardStyle}>
      <div style={{ ...activityDotStyle, background: palette.bg, color: palette.color }}>◆</div>
      <div style={{ minWidth: 0 }}>
        <div style={activityTopStyle}>
          <strong style={activityTitleStyle}>{safeText(log.action, 'Activity')}</strong>
          <PremiumChip label={safeText(log.target_table || log.source || 'Système')} tone={tone} />
        </div>
        <p style={activityTextStyle}>{safeText(log.description || log.summary || log.details || log.target_id || 'Synced audit event')}</p>
        <span style={activityDateStyle}>{formatDate(log.created_at)}</span>
      </div>
    </div>
  )
}

function InfoMini({ label, value }: { label: string; value: unknown }) {
  return (
    <div style={infoMiniStyle}>
      <span>{label}</span>
      <strong>{safeText(value)}</strong>
    </div>
  )
}

function Empty({ text, icon = '◇' }: { text: string; icon?: string }) {
  return (
    <div style={emptyStyle}>
      <span style={emptyIconStyle}>{icon}</span>
      <strong>{text}</strong>
    </div>
  )
}


function LiveAccessStatePanel({ isLive, activeSessions, lastLogin }: { isLive: boolean; activeSessions: number; lastLogin?: string | null }) {
  const tone: Tone = isLive ? 'green' : 'slate'
  const palette = chipPalette[tone]

  return (
    <div style={{ ...livePanelStyle, border: `1px solid ${palette.border}`, background: palette.soft }}>
      <div style={liveOrbWrapStyle}>
        <div style={{ ...liveOrbStyle, background: isLive ? 'radial-gradient(circle,#22c55e 0%,#16a34a 45%,#052e16 100%)' : 'radial-gradient(circle,#94a3b8 0%,#64748b 55%,#1e293b 100%)' }} />
        <div>
          <span style={liveEyebrowStyle}>Live access state</span>
          <strong style={liveTitleStyle}>{isLive ? 'Currently logged in' : 'Logged out'}</strong>
        </div>
      </div>

      <div style={liveGraphStyle}>
        <div style={{ ...liveGraphBarStyle, height: isLive ? '88%' : '28%', background: isLive ? '#22c55e' : '#94a3b8' }} />
        <div style={{ ...liveGraphBarStyle, height: `${Math.max(18, Math.min(100, activeSessions * 28))}%`, background: '#2563eb' }} />
        <div style={{ ...liveGraphBarStyle, height: lastLogin ? '62%' : '22%', background: '#7c3aed' }} />
      </div>

      <div style={liveMetaGridStyle}>
        <InfoMini label="Active sessions" value={activeSessions} />
        <InfoMini label="Last login" value={formatDate(lastLogin)} />
      </div>
    </div>
  )
}

function TemporaryAccessPanel({ userId, suspended, status }: { userId: string; suspended: boolean; status: string }) {
  return (
    <div style={{ ...accessSwitchPanelStyle, border: suspended ? '1px solid #fecaca' : '1px solid #bbf7d0', background: suspended ? 'linear-gradient(135deg,#fff5f5,#ffffff)' : 'linear-gradient(135deg,#f0fdf4,#ffffff)' }}>
      <div style={switchHeaderStyle}>
        <div>
          <span style={liveEyebrowStyle}>Temporary access control</span>
          <strong style={liveTitleStyle}>{suspended ? 'Access suspended' : 'Access enabled'}</strong>
        </div>
        <PremiumChip label={status} tone={suspended ? 'red' : 'green'} icon={suspended ? '⛔' : '✓'} />
      </div>

      <div style={switchVisualStyle}>
        <div style={{ ...switchTrackStyle, background: suspended ? '#fee2e2' : '#dcfce7' }}>
          <div style={{ ...switchKnobStyle, marginLeft: suspended ? 4 : 42, background: suspended ? '#dc2626' : '#16a34a' }} />
        </div>
        <p style={switchCopyStyle}>
          {suspended
            ? 'User cannot access protected workspace while suspended.'
            : 'User can access authorized AngelCare workspaces.'}
        </p>
      </div>

      <form action={`/users/${userId}/access`} method="post" style={switchActionsStyle}>
        <input type="hidden" name="intent" value={suspended ? 'restore' : 'suspend'} />
        <button style={suspended ? restoreAccessButtonStyle : suspendAccessButtonStyle}>
          {suspended ? 'Turn access back on' : 'Turn off access temporarily'}
        </button>
      </form>
    </div>
  )
}


export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const actor = await requireRole(['ceo', 'manager'])

  const { id } = await params
  const query = (await searchParams) || {}
  const getParam = (key: string) => {
    const value = query[key]
    return Array.isArray(value) ? value[0] || '' : String(value || '')
  }

  const sessionFrom = getParam('sessionFrom')
  const sessionTo = getParam('sessionTo')
  const sessionStatus = getParam('sessionStatus')
  const sessionSearch = getParam('sessionSearch')
  const activityFrom = getParam('activityFrom')
  const activityTo = getParam('activityTo')
  const activityAction = getParam('activityAction')
  const activitySearch = getParam('activitySearch')

  const supabase = await createClient()

  async function safeOne(table: string, column: string, needle: string) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(column, needle)
        .maybeSingle()

      if (error) return null
      return data as AnyRecord | null
    } catch {
      return null
    }
  }

  async function resolveSystemUserProfile(rawKey: string) {
    const key = decodeURIComponent(String(rawKey || '').trim())
    if (!key) return null

    const directById = await safeOne('app_users', 'id', key)
    if (directById) return directById

    const directByEmail = await safeOne('app_users', 'email', key)
    if (directByEmail) return directByEmail

    const directByUsername = await safeOne('app_users', 'username', key)
    if (directByUsername) return directByUsername

    const employeeTables = [
      'hr_staff_profiles',
      'hr_staff',
      'employees',
      'employee_profiles',
      'staff_profiles',
      'profiles',
    ]

    const employeeLookupColumns = [
      'id',
      'employee_id',
      'staff_id',
      'profile_id',
      'user_id',
      'app_user_id',
      'auth_user_id',
      'email',
      'user_email',
      'username',
    ]

    let employee: AnyRecord | null = null

    for (const table of employeeTables) {
      for (const column of employeeLookupColumns) {
        employee = await safeOne(table, column, key)
        if (employee) break
      }
      if (employee) break
    }

    if (!employee) return null

    const candidateUserIds = [
      employee.user_id,
      employee.app_user_id,
      employee.auth_user_id,
      employee.profile_id,
    ].map((value) => String(value || '').trim()).filter(Boolean)

    for (const candidate of candidateUserIds) {
      const byCandidateId = await safeOne('app_users', 'id', candidate)
      if (byCandidateId) return byCandidateId
    }

    const candidateEmails = [
      employee.email,
      employee.user_email,
      employee.username,
      employee.work_email,
    ].map((value) => String(value || '').trim()).filter(Boolean)

    for (const candidate of candidateEmails) {
      const byEmail = await safeOne('app_users', 'email', candidate)
      if (byEmail) return byEmail

      const byUsername = await safeOne('app_users', 'username', candidate)
      if (byUsername) return byUsername
    }

    return null
  }

  const user = await resolveSystemUserProfile(id)

  if (!user) notFound()

  const resolvedUserId = String(user.id || id)

  let sessionsQuery = supabase
    .from('app_sessions')
    .select('*')
    .eq('user_id', resolvedUserId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (sessionFrom) sessionsQuery = sessionsQuery.gte('created_at', `${sessionFrom}T00:00:00`)
  if (sessionTo) sessionsQuery = sessionsQuery.lte('created_at', `${sessionTo}T23:59:59`)

  const { data: rawSessions } = await sessionsQuery

  let logsQuery = supabase
    .from('app_audit_logs')
    .select('*')
    .eq('actor_user_id', resolvedUserId)
    .order('created_at', { ascending: false })
    .limit(40)

  if (activityFrom) logsQuery = logsQuery.gte('created_at', `${activityFrom}T00:00:00`)
  if (activityTo) logsQuery = logsQuery.lte('created_at', `${activityTo}T23:59:59`)
  if (activityAction) logsQuery = logsQuery.ilike('action', `%${activityAction}%`)

  const { data: rawLogs } = await logsQuery

  const userRecord = user as AnyRecord
  const permissions: string[] = Array.isArray(userRecord.permissions) ? userRecord.permissions : []
  const sessions = (rawSessions || []).filter((session) => {
    const state = sessionState(session)
    const statusOk = !sessionStatus || sessionStatus === 'all' || sessionStatus === state
    return statusOk && matchesText(session, sessionSearch)
  })
  const logs = (rawLogs || []).filter((log) => matchesText(log, activitySearch))

  const activeSessions = sessions.filter((session) => sessionState(session) === 'active').length
  const expiredSessions = sessions.filter((session) => sessionState(session) === 'expired').length
  const completion = profileCompletionScore(userRecord)
  const missingFields = missingProfileFields(userRecord)
  const groupedPermissions = groupPermissions(permissions)
  const pageRoutes = permissions.filter((permission) => permission.startsWith('page:') || permission.startsWith('page/')).length
  const criticalPermissions = permissions.filter((permission) => permissionTone(permission) === 'red').length
  const accessScore = accessHealthScore(permissions, userRecord, activeSessions)
  const readinessTone: Tone = completion >= 75 ? 'green' : completion >= 45 ? 'amber' : 'red'
  const accessTone: Tone = accessScore >= 80 ? 'green' : accessScore >= 55 ? 'blue' : accessScore >= 35 ? 'amber' : 'red'
  const userStatus = String(userRecord.status || '').toLowerCase()
  const isAccessSuspended = userStatus.includes('suspend') || userStatus.includes('blocked') || userStatus.includes('inactive') || userStatus.includes('disabled')
  const isLiveLoggedIn = activeSessions > 0
  const emailOSAccess = await getUserEmailOSMailboxAssignments(resolvedUserId)
  const emailOSAudit = await getMailboxAccessAudit(resolvedUserId, null, 100)
  const { data: mailboxRows } = await supabase.from('email_os_core_mailboxes').select('*').order('name', { ascending: true })
  const safeMailboxes = (mailboxRows || []).map((row: AnyRecord) => ({
    id: String(row.id || ''),
    name: String(row.name || row.label || row.address || row.email_address || row.email || row.id || 'Mailbox'),
    address: String(row.address || row.email_address || row.email || row.from_email || row.username || ''),
    status: String(row.status || 'active'),
    owner: row.owner ? String(row.owner) : null,
    provider: row.provider ? String(row.provider) : null,
  }))

  const canManageBrowserExtension = isExtensionAdmin({
    id: String(actor.id || ''),
    email: actor.email ? String(actor.email) : null,
    full_name: actor.full_name ? String(actor.full_name) : null,
    name: actor.name ? String(actor.name) : null,
    role: actor.role ? String(actor.role) : null,
    role_key: actor.role_key ? String(actor.role_key) : null,
    permissions: Array.isArray(actor.permissions)
      ? actor.permissions.map(String)
      : null,
  })
  let browserExtensionSnapshot: AnyRecord | null = null
  if (canManageBrowserExtension) {
    const extensionAccess = await loadUserAccess(supabase, resolvedUserId)
    const [{ data: extensionDevices }, { data: extensionChanges }] = await Promise.all([
      supabase.from('browser_extension_devices').select('*').eq('user_id', resolvedUserId).order('created_at', { ascending: false }).limit(30),
      supabase.from('browser_extension_access_changes').select('*').eq('user_id', resolvedUserId).order('created_at', { ascending: false }).limit(20),
    ])
    const extensionDeviceIds = (extensionDevices || []).map((row: AnyRecord) => row.id).filter(Boolean)
    let extensionAuditQuery = supabase.from('browser_extension_audit_logs').select('*').order('created_at', { ascending: false }).limit(60)
    if (extensionDeviceIds.length) extensionAuditQuery = extensionAuditQuery.or(`target_id.eq.${resolvedUserId},device_id.in.(${extensionDeviceIds.join(',')})`)
    else extensionAuditQuery = extensionAuditQuery.eq('target_id', resolvedUserId)
    const { data: extensionAudit } = await extensionAuditQuery
    browserExtensionSnapshot = {
      user: {
        id: resolvedUserId,
        full_name: userRecord.full_name || userRecord.name || userRecord.display_name,
        name: userRecord.name || userRecord.full_name,
        email: userRecord.email,
        role: userRecord.role,
        role_key: userRecord.role_key,
        status: userRecord.status,
        department: userRecord.department || userRecord.department_name,
        job_title: userRecord.job_title || userRecord.position || userRecord.role_title,
      },
      access: extensionAccess,
      devices: extensionDevices || [],
      audit: extensionAudit || [],
      changes: extensionChanges || [],
    }
  }

  const profilePhotoUrl = userRecord.profile_photo_path
    ? `/api/users/${encodeURIComponent(String(userRecord.id))}/profile-photo?v=${encodeURIComponent(String(userRecord.updated_at || '1'))}`
    : ''
  const emailSummary = emailOSAccess.summary || {}
  const emailAssignmentCount = Number(emailSummary.assigned_mailboxes_count || emailOSAccess.assignments?.length || 0)
  const emailLockedCount = Number(emailSummary.locked_assignments_count || 0)
  const browserDevices = browserExtensionSnapshot?.devices || []
  const browserActiveDevices = browserDevices.filter((device: AnyRecord) => String(device.status || '').toLowerCase() === 'active').length
  const browserProfile = browserExtensionSnapshot?.access?.profile || null
  const managerAttention = missingFields.length + (userRecord.must_change_password ? 1 : 0) + emailLockedCount

  const overview = (
    <div style={dossierStackStyle}>
      <div style={executiveGridStyle}>
        <section style={executiveCardStyle}>
          <span style={cardEyebrowStyle}>Lecture direction</span>
          <h3 style={cardTitleStyle}>État opérationnel du collaborateur</h3>
          <div style={executiveFactsStyle}>
            <InfoMini label="Compte" value={isAccessSuspended ? 'Suspendu / restreint' : 'Actif et autorisé'} />
            <InfoMini label="Présence digitale" value={isLiveLoggedIn ? `${activeSessions} session(s) active(s)` : 'Hors ligne'} />
            <InfoMini label="Dernière connexion" value={formatDate(userRecord.last_login_at)} />
            <InfoMini label="Accès SANILA" value={`${permissions.length} autorisation(s)`} />
          </div>
        </section>
        <section style={executiveCardStyle}>
          <span style={cardEyebrowStyle}>Action management</span>
          <h3 style={cardTitleStyle}>{managerAttention ? 'Points d’attention à traiter' : 'Dossier sous contrôle'}</h3>
          <div style={alertStackStyle}>
            {missingFields.length ? <div style={alertAmberStyle}>Compléter : {missingFields.join(', ')}</div> : null}
            {userRecord.must_change_password ? <div style={alertAmberStyle}>Le mot de passe temporaire doit être remplacé.</div> : null}
            {emailLockedCount ? <div style={alertRedStyle}>{emailLockedCount} accès Email OS verrouillé(s).</div> : null}
            {!managerAttention ? <div style={alertGreenStyle}>Aucune anomalie prioritaire détectée dans les données disponibles.</div> : null}
          </div>
        </section>
      </div>

      <div style={quickGridStyle}>
        <a href={`/users/${userRecord.id}/attendance`} style={quickLinkStyle}><strong>Présence & ponctualité</strong><span>Ouvrir le cockpit individuel</span></a>
        <a href={`/users/${userRecord.id}/tasks`} style={quickLinkStyle}><strong>Exécution des tâches</strong><span>Voir charge et échéances</span></a>
        <a href={`/users/${userRecord.id}/lead-portfolio`} style={quickLinkStyle}><strong>Portefeuille commercial</strong><span>Voir leads et suivis</span></a>
        <a href={`/users/${userRecord.id}/edit`} style={quickLinkStyle}><strong>Gouvernance identité</strong><span>Modifier avec contrôle</span></a>
      </div>

      <div style={trustGridStyle}>
        <div style={trustCardStyle}><span style={trustLabelStyle}>SANILA OS</span><strong style={trustValueStyle}>{permissions.length}</strong><small style={trustDetailStyle}>{pageRoutes} routes · {criticalPermissions} sensibles</small></div>
        <div style={trustCardStyle}><span style={trustLabelStyle}>EMAIL OS</span><strong style={trustValueStyle}>{emailAssignmentCount}</strong><small style={trustDetailStyle}>{emailLockedCount ? `${emailLockedCount} verrouillé(s)` : 'Sécurité saine'}</small></div>
        <div style={trustCardStyle}><span style={trustLabelStyle}>BROWSER OS</span><strong style={trustValueStyle}>{browserProfile?.enabled ? 'ACTIF' : 'NON ACTIF'}</strong><small style={trustDetailStyle}>{browserActiveDevices} appareil(s) actif(s)</small></div>
      </div>
    </div>
  )

  const identity = (
    <div style={dossierStackStyle}>
      <div style={twoColStyle}>
        <section style={subPanelStyle}>
          <Header eyebrow="Identité" title="Informations personnelles" subtitle="Lecture officielle de l’identité numérique SANILA." />
          <div style={infoGridStyle}>
            <InfoCard label="Nom complet" value={userRecord.full_name || userRecord.name || userRecord.display_name} tone="blue" />
            <InfoCard label="Nom utilisateur" value={userRecord.username} tone="slate" />
            <InfoCard label="Email" value={userRecord.email} tone="blue" />
            <InfoCard label="Téléphone" value={userRecord.phone || userRecord.phone_number} tone="green" />
            <InfoCard label="Langue" value={userRecord.language} tone="purple" />
            <InfoCard label="Créé le" value={formatDate(userRecord.created_at)} tone="slate" />
          </div>
        </section>
        <section style={subPanelStyle}>
          <Header eyebrow="Organisation" title="Position professionnelle" subtitle="Rattachement, rôle et état du compte." />
          <div style={infoGridStyle}>
            <InfoCard label="Département" value={userRecord.department || userRecord.department_name} tone="blue" />
            <InfoCard label="Poste" value={userRecord.job_title || userRecord.position || userRecord.role_title} tone="purple" />
            <InfoCard label="Rôle système" value={userRecord.role} tone={roleTone(userRecord.role)} />
            <InfoCard label="Statut" value={userRecord.status} tone={statusTone(userRecord.status)} />
            <InfoCard label="Mot de passe initial" value={userRecord.must_change_password ? 'Changement requis' : 'Stabilisé'} tone={userRecord.must_change_password ? 'amber' : 'green'} />
            <InfoCard label="Complétude" value={`${completion}%`} tone={readinessTone} />
          </div>
        </section>
      </div>
      <TemporaryAccessPanel userId={String(userRecord.id)} suspended={isAccessSuspended} status={safeText(userRecord.status, 'active')} />
    </div>
  )

  const sanilaAccess = (
    <div style={dossierStackStyle}>
      <div style={permissionSummaryStyle}>
        <PremiumKpi label="Autorisations" value={String(permissions.length)} detail="Source app_users.permissions" tone="blue" />
        <PremiumKpi label="Routes" value={String(pageRoutes)} detail="Pages et espaces explicitement exposés" tone="purple" />
        <PremiumKpi label="Scopes sensibles" value={String(criticalPermissions)} detail="Manage / admin / delete" tone={criticalPermissions ? 'red' : 'green'} />
      </div>
      <div style={securityBoundaryStyle}>
        <strong>Frontière de sécurité SANILA</strong>
        <span>Ces autorisations gouvernent les cartes et routes de l’application. Elles ne donnent pas automatiquement accès aux boîtes Email OS ni aux capacités Browser OS.</span>
      </div>
      {permissions.length ? <div style={permissionGroupListStyle}>{Object.entries(groupedPermissions).map(([group, items]) => <PermissionGroup key={group} group={group} items={items} total={permissions.length} />)}</div> : <Empty text="Aucune autorisation SANILA détaillée." />}
    </div>
  )

  const emailOS = (
    <div style={dossierStackStyle}>
      <div style={specializedHeroStyle}>
        <div><span style={cardEyebrowStyle}>Système spécialisé indépendant</span><h3 style={cardTitleStyle}>Email OS Access Passport</h3><p style={specializedCopyStyle}>Les rôles, PIN, sessions et droits de chaque boîte sont gouvernés séparément des permissions générales SANILA.</p></div>
        <div style={specializedMetricStyle}><strong>{emailAssignmentCount}</strong><span>boîte(s) assignée(s)</span></div>
      </div>
      <details style={governanceDetailsStyle}>
        <summary style={governanceSummaryStyle}><span><strong>Ouvrir la gouvernance Email OS</strong><small>Attributions, rôles, droits, PIN, sessions et audit</small></span><span style={openPillStyle}>ACCÈS CONTRÔLÉ</span></summary>
        <div style={embeddedSystemStyle}><EmailOSMailboxAccessSection userId={resolvedUserId} initialSummary={emailOSAccess.summary} initialAssignments={emailOSAccess.assignments} initialMailboxes={safeMailboxes} initialAudit={emailOSAudit} /></div>
      </details>
    </div>
  )

  const browserOS = (
    <div style={dossierStackStyle}>
      <div style={specializedHeroStyle}>
        <div><span style={cardEyebrowStyle}>Runtime commercial spécialisé</span><h3 style={cardTitleStyle}>Revenue Command Browser OS</h3><p style={specializedCopyStyle}>Accès individuel aux modules, capacités, adaptateurs, territoires, autonomie, approbations et appareils Chrome.</p></div>
        <div style={specializedMetricStyle}><strong>{browserProfile?.enabled ? 'ACTIF' : 'NON ACTIF'}</strong><span>{browserActiveDevices} appareil(s) actif(s)</span></div>
      </div>
      {browserExtensionSnapshot ? <details style={governanceDetailsStyle}><summary style={governanceSummaryStyle}><span><strong>Ouvrir le Browser OS Access Studio</strong><small>Capacités signées, autonomie, devices et versions d’accès</small></span><span style={openPillStyle}>GOUVERNANCE AVANCÉE</span></summary><div style={embeddedSystemStyle}><UserBrowserExtensionAccessSection initialSnapshot={browserExtensionSnapshot as any} modules={BROWSER_EXTENSION_MODULES as any} b2bContract={B2B_EXTENSION_CONTRACT as any} /></div></details> : <Empty text="Vous ne disposez pas du niveau d’administration Browser OS requis pour ouvrir cette gouvernance." />}
    </div>
  )

  const sessionsAudit = (
    <div style={dossierStackStyle}>
      <div style={twoColStyle}>
        <section style={subPanelStyle}>
          <Header eyebrow="Connexions" title="Sessions récentes" subtitle="État des connexions applicatives filtrées." />
          <form action={`/users/${userRecord.id}`} method="get" style={compactFilterStyle}>
            <input name="sessionFrom" type="date" defaultValue={sessionFrom} style={filterInputStyle} />
            <input name="sessionTo" type="date" defaultValue={sessionTo} style={filterInputStyle} />
            <select name="sessionStatus" defaultValue={sessionStatus || 'all'} style={filterInputStyle}><option value="all">Toutes</option><option value="active">Actives</option><option value="expired">Expirées</option></select>
            <input name="sessionSearch" defaultValue={sessionSearch} placeholder="Source, appareil, ID" style={filterInputStyle} />
            <button style={filterButtonStyle}>Appliquer</button>
          </form>
          <div style={sessionListStyle}>{sessions.length ? sessions.map((session) => <SessionCard key={session.id || `${session.created_at}-${session.expires_at}`} session={session} />) : <Empty text="Aucune session pour ces filtres." />}</div>
        </section>
        <section style={subPanelStyle}>
          <Header eyebrow="Audit" title="Chronologie utilisateur" subtitle="Actions récentes et preuves système." />
          <form action={`/users/${userRecord.id}`} method="get" style={compactFilterStyle}>
            <input name="activityFrom" type="date" defaultValue={activityFrom} style={filterInputStyle} />
            <input name="activityTo" type="date" defaultValue={activityTo} style={filterInputStyle} />
            <input name="activityAction" defaultValue={activityAction} placeholder="Action" style={filterInputStyle} />
            <input name="activitySearch" defaultValue={activitySearch} placeholder="Source ou cible" style={filterInputStyle} />
            <button style={filterButtonStyle}>Appliquer</button>
          </form>
          <div style={activityListStyle}>{logs.length ? logs.map((log) => <ActivityCard key={log.id || `${log.action}-${log.created_at}`} log={log} />) : <Empty text="Aucune activité pour ces filtres." />}</div>
        </section>
      </div>
    </div>
  )

  const administration = (
    <div style={dossierStackStyle}>
      <div style={securityBoundaryStyle}><strong>Contrôles administratifs protégés</strong><span>Privilégier la suspension ou la révocation des systèmes spécialisés avant toute suppression définitive.</span></div>
      <details style={dangerDetailsStyle}><summary style={dangerSummaryStyle}>Afficher la zone de suppression permanente</summary><div style={dangerContentStyle}><div><strong style={dangerTitleStyle}>Supprimer définitivement ce compte utilisateur</strong><p style={dangerTextStyle}>Cette action est irréversible et doit rester exceptionnelle.</p></div><form action={`/users/${userRecord.id}/delete`} method="get" style={dangerFormStyle}><input type="hidden" name="confirm" value="DELETE" /><button style={dangerButtonStyle}>Continuer vers la confirmation DELETE</button></form></div></details>
    </div>
  )

  return (
    <AppShell
      hideSidebar
      title={userRecord.full_name || 'Dossier collaborateur'}
      subtitle={`SANILA Staff 360° • ${safeText(userRecord.role, 'staff')} • ${safeText(userRecord.status, 'active')}`}
      breadcrumbs={[{ label: 'People Command', href: '/users' }, { label: userRecord.full_name || 'Dossier collaborateur' }]}
      actions={<><PageAction href="/users" variant="light">People Command</PageAction><PageAction href={`/users/${userRecord.id}/edit`}>Modifier l’identité</PageAction><PageAction href={`/users/${userRecord.id}/attendance`} variant="light">Présence</PageAction><PageAction href={`/users/${userRecord.id}/tasks`} variant="light">Tâches</PageAction><PageAction href={`/users/${userRecord.id}/lead-portfolio`} variant="light">Leads</PageAction></>}
    >
      <div style={dossierPageStyle}>
        <section style={dossierHeroStyle}>
          <div style={brandBlockStyle}><img src="/logo.png" alt="AngelCare" style={brandLogoStyle} /><span>SANILA OS · STAFF 360° EXECUTIVE DOSSIER</span></div>
          <div style={identityHeroGridStyle}>
            <div style={identityMainStyle}>
              <div style={portraitFrameStyle}>{profilePhotoUrl ? <img src={profilePhotoUrl} alt={safeText(userRecord.full_name, 'Photo collaborateur')} style={portraitImageStyle} /> : <span>{initialsFromName(userRecord.full_name || userRecord.email)}</span>}<i style={verifiedDotStyle}>✓</i></div>
              <div><div style={badgeRowStyle}><PremiumChip label={safeText(userRecord.status, 'active')} tone={statusTone(userRecord.status)} /><PremiumChip label={safeText(userRecord.role, 'staff')} tone={roleTone(userRecord.role)} /><PremiumChip label={isLiveLoggedIn ? 'En ligne' : 'Hors ligne'} tone={isLiveLoggedIn ? 'green' : 'slate'} /></div><h1 style={dossierHeroTitleStyle}>{safeText(userRecord.full_name || userRecord.name || userRecord.display_name, 'Collaborateur')}</h1><p style={dossierHeroSubtitleStyle}>{safeText(userRecord.job_title || userRecord.position || userRecord.role_title, 'Poste non renseigné')} · {safeText(userRecord.department || userRecord.department_name, 'Département non défini')}</p><div style={identityFactsStyle}><span>{safeText(userRecord.email)}</span><span>{safeText(userRecord.phone || userRecord.phone_number)}</span><span>ID {String(userRecord.id).slice(0, 8).toUpperCase()}</span></div></div>
            </div>
            <div style={passportMetricsStyle}><div><span>Identité</span><strong>{completion}%</strong></div><div><span>Accès SANILA</span><strong>{permissions.length}</strong></div><div><span>Sessions actives</span><strong>{activeSessions}</strong></div><div><span>Systèmes spécialisés</span><strong>{(emailAssignmentCount ? 1 : 0) + (browserProfile?.enabled ? 1 : 0)}/2</strong></div></div>
          </div>
        </section>

        <StaffDossierNavigator sections={[
          { key: 'overview', label: 'Vue exécutive', eyebrow: 'Command brief', description: 'Lecture immédiate de l’état, des responsabilités, des risques et des prochaines actions.', content: overview, attention: managerAttention },
          { key: 'identity', label: 'Identité & organisation', eyebrow: 'Official staff passport', description: 'Vérité administrative et professionnelle du collaborateur.', content: identity, attention: missingFields.length },
          { key: 'sanila', label: 'Accès SANILA', eyebrow: 'Application access boundary', description: 'Permissions générales, routes et scopes visibles dans les espaces SANILA.', content: sanilaAccess, attention: criticalPermissions },
          { key: 'email', label: 'Email OS', eyebrow: 'Independent mailbox security', description: 'Attributions de boîtes, rôles, PIN, sessions et audit dans une frontière séparée.', content: emailOS, attention: emailLockedCount },
          { key: 'browser', label: 'Browser OS', eyebrow: 'Revenue runtime clearance', description: 'Capacités commerciales, autonomie, adaptateurs et appareils autorisés individuellement.', content: browserOS },
          { key: 'audit', label: 'Sessions & audit', eyebrow: 'Digital trust evidence', description: 'Connexions, chronologie et preuves d’activité du compte.', content: sessionsAudit },
          { key: 'admin', label: 'Contrôles administratifs', eyebrow: 'Protected governance', description: 'Suspension, révocation et suppression dans une zone volontairement isolée.', content: administration },
        ]} />
      </div>
    </AppShell>
  )
}

function ManagerCard({ title, value, tone = 'blue' }: { title: string; value: string; tone?: Tone }) {
  const palette = chipPalette[tone]
  return (
    <div style={{ ...managerCardStyle, border: `1px solid ${palette.border}`, background: palette.soft }}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  )
}

const chipPalette: Record<Tone, { bg: string; soft: string; solid: string; color: string; border: string }> = {
  green: { bg: '#ecfdf5', soft: '#f0fdf4', solid: '#22c55e', color: '#047857', border: '#bbf7d0' },
  red: { bg: '#fef2f2', soft: '#fff5f5', solid: '#ef4444', color: '#b91c1c', border: '#fecaca' },
  blue: { bg: '#eff6ff', soft: '#f8fbff', solid: '#2563eb', color: '#1d4ed8', border: '#bfdbfe' },
  purple: { bg: '#f5f3ff', soft: '#fbfaff', solid: '#7c3aed', color: '#6d28d9', border: '#ddd6fe' },
  amber: { bg: '#fffbeb', soft: '#fffaf0', solid: '#f59e0b', color: '#b45309', border: '#fde68a' },
  slate: { bg: '#f8fafc', soft: '#ffffff', solid: '#64748b', color: '#475569', border: '#e2e8f0' },
}

const pageStyle: CSSProperties = { display: 'grid', gap: 22 }
const heroStyle: CSSProperties = { position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(520px,1fr) minmax(760px,.95fr)', gap: 22, alignItems: 'stretch', background: 'linear-gradient(135deg,#ffffff 0%,#eff6ff 42%,#eef2ff 100%)', border: '1px solid #bfdbfe', borderRadius: 34, padding: 26, boxShadow: '0 32px 80px rgba(15,23,42,.12)' }
const heroGlowStyle: CSSProperties = { position: 'absolute', inset: 'auto -120px -170px auto', width: 420, height: 420, borderRadius: 999, background: 'radial-gradient(circle,rgba(37,99,235,.22),transparent 62%)', pointerEvents: 'none' }
const heroIdentityStyle: CSSProperties = { position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 20, minWidth: 0 }
const avatarStyle: CSSProperties = { width: 112, height: 112, borderRadius: 32, background: 'linear-gradient(135deg,#0f172a,#2563eb)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 34, fontWeight: 1000, border: '1px solid rgba(255,255,255,.65)', boxShadow: '0 24px 48px rgba(37,99,235,.28)', flexShrink: 0 }
const badgeRowStyle: CSSProperties = { display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 12 }
const heroTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 42, lineHeight: 1, fontWeight: 1000, letterSpacing: '-.06em' }
const heroTextStyle: CSSProperties = { margin: '12px 0 18px', color: '#475569', fontWeight: 900, fontSize: 15 }
const heroSignalGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const heroRightStyle: CSSProperties = { position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(360px,1fr))', gap: 16, alignContent: 'stretch', alignItems: 'stretch', width: '100%', minWidth: 0 }
const chipStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '7px 11px', fontSize: 11, fontWeight: 950, letterSpacing: '.04em', whiteSpace: 'nowrap' }
const miniBarTrackStyle: CSSProperties = { height: 10, borderRadius: 999, overflow: 'hidden', background: '#e2e8f0', border: '1px solid #dbe5f2' }
const ringMeterStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24, background: 'rgba(255,255,255,.72)', border: '1px solid #dbeafe', boxShadow: '0 16px 34px rgba(15,23,42,.055)' }
const ringCircleStyle: CSSProperties = { width: 76, height: 76, borderRadius: 999, display: 'grid', placeItems: 'center', flexShrink: 0 }
const ringInnerStyle: CSSProperties = { width: 56, height: 56, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#fff', color: '#0f172a', fontSize: 15, fontWeight: 1000 }
const ringLabelStyle: CSSProperties = { display: 'block', color: '#0f172a', fontSize: 14, fontWeight: 1000 }
const ringSubStyle: CSSProperties = { display: 'block', marginTop: 3, color: '#64748b', fontSize: 12, fontWeight: 750 }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 12 }
const premiumKpiStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '42px minmax(0,1fr)', gap: 12, alignItems: 'start', borderRadius: 24, padding: 16, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const kpiIconStyle: CSSProperties = { width: 42, height: 42, borderRadius: 16, display: 'grid', placeItems: 'center', fontWeight: 1000 }
const kpiLabelStyle: CSSProperties = { color: '#64748b', fontSize: 10, fontWeight: 950, letterSpacing: '.1em', textTransform: 'uppercase' }
const kpiValueStyle: CSSProperties = { marginTop: 7, color: '#0f172a', fontSize: 25, lineHeight: 1, fontWeight: 1000, letterSpacing: '-.04em' }
const kpiDetailStyle: CSSProperties = { marginTop: 7, color: '#64748b', fontSize: 12, fontWeight: 750, lineHeight: 1.45 }
const warningBannerStyle: CSSProperties = { display: 'grid', gap: 4, padding: 16, borderRadius: 22, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', boxShadow: '0 14px 30px rgba(245,158,11,.08)' }
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 18 }
const panelStyle: CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 28, padding: 26, boxShadow: '0 22px 48px rgba(15,23,42,.065)' }
const widePanelStyle: CSSProperties = { ...panelStyle, gridColumn: '1 / -1' }
const sectionHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 18 }
const eyebrowStyle: CSSProperties = { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', fontWeight: 950, fontSize: 12, marginBottom: 9 }
const sectionTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 25, fontWeight: 1000, letterSpacing: '-.035em' }
const sectionSubtitleStyle: CSSProperties = { margin: '6px 0 0', color: '#64748b', fontSize: 13, fontWeight: 750, lineHeight: 1.45 }
const infoGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const infoCardStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 12, alignItems: 'center', padding: 15, borderRadius: 20, background: 'linear-gradient(135deg,#ffffff,#f8fafc)', border: '1px solid #e2e8f0' }
const infoIconStyle: CSSProperties = { width: 44, height: 44, borderRadius: 16, display: 'grid', placeItems: 'center', fontWeight: 1000 }
const infoLabelStyle: CSSProperties = { display: 'block', color: '#64748b', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.08em' }
const infoValueStyle: CSSProperties = { display: 'block', marginTop: 5, color: '#0f172a', fontSize: 15, fontWeight: 950, overflowWrap: 'anywhere' }
const opsVisualStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12, marginBottom: 14 }
const opsScoreStyle: CSSProperties = { display: 'grid', gap: 9, padding: 14, borderRadius: 20, border: '1px solid #dbeafe', background: '#f8fbff', color: '#334155', fontWeight: 850 }
const permissionSummaryStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 16 }
const permissionGroupListStyle: CSSProperties = { display: 'grid', gap: 18 }
const permissionGroupStyle: CSSProperties = { display: 'grid', gap: 12, padding: 16, borderRadius: 24, border: '1px solid #e2e8f0', background: 'linear-gradient(180deg,#ffffff,#f8fafc)' }
const permissionGroupHeadStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 220px', gap: 12, alignItems: 'center' }
const permissionGroupTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 1000 }
const permissionGroupTextStyle: CSSProperties = { margin: '4px 0 0', color: '#64748b', fontSize: 12, fontWeight: 750 }
const permissionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }

const permissionCompactGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
  gap: 12,
}
const permissionRoutesDetailsStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 16,
  borderRadius: 24,
  border: '1px solid #ddd6fe',
  background: 'linear-gradient(180deg,#ffffff,#faf7ff)',
}
const permissionRoutesSummaryStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) 280px',
  gap: 16,
  alignItems: 'center',
  cursor: 'pointer',
  listStyle: 'none',
}
const permissionRoutesActionStyle: CSSProperties = { display: 'grid', gap: 10 }
const permissionRoutesButtonStyle: CSSProperties = {
  justifySelf: 'end',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  padding: '9px 13px',
  background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 1000,
  boxShadow: '0 14px 28px rgba(124,58,237,.18)',
}
const permissionRoutesScrollStyle: CSSProperties = {
  maxHeight: 620,
  overflowY: 'auto',
  overflowX: 'hidden',
  padding: '4px 6px 6px 0',
  borderTop: '1px solid #ede9fe',
  marginTop: 12,
}
const permissionCardStyle: CSSProperties = { display: 'grid', gap: 9, padding: 14, borderRadius: 20, color: '#0f172a', minHeight: 0, aspectRatio: '1 / 1', alignContent: 'space-between', overflow: 'hidden' }
const permissionTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }
const permissionIconStyle: CSSProperties = { width: 34, height: 34, borderRadius: 13, display: 'grid', placeItems: 'center', fontWeight: 1000 }
const permissionTitleStyle: CSSProperties = { fontSize: 14, fontWeight: 1000, lineHeight: 1.35, overflowWrap: 'anywhere' }
const permissionCodeStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 750, overflowWrap: 'anywhere' }
const filterBarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 10, padding: 14, borderRadius: 22, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 16 }
const filterLabelStyle: CSSProperties = { display: 'grid', gap: 6, color: '#64748b', fontSize: 11, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase' }
const filterInputStyle: CSSProperties = { width: '100%', border: '1px solid #cbd5e1', borderRadius: 14, padding: '11px 12px', background: '#fff', color: '#0f172a', fontWeight: 800, outline: 'none' }
const filterButtonStyle: CSSProperties = { alignSelf: 'end', border: 0, borderRadius: 15, padding: '12px 14px', background: 'linear-gradient(135deg,#1d4ed8,#0f172a)', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const sessionVisualRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 16 }
const sessionListStyle: CSSProperties = { display: 'grid', gap: 12 }
const sessionCardStyle: CSSProperties = { display: 'grid', gap: 13, padding: 16, borderRadius: 22, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg,#ffffff,#f8fafc)' }
const sessionTopStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '42px minmax(0,1fr) auto', gap: 12, alignItems: 'center' }
const sessionIconStyle: CSSProperties = { width: 42, height: 42, borderRadius: 16, display: 'grid', placeItems: 'center', background: '#eff6ff', color: '#2563eb', fontWeight: 1000 }
const sessionTitleStyle: CSSProperties = { display: 'block', color: '#0f172a', fontSize: 15, fontWeight: 1000 }
const sessionMetaStyle: CSSProperties = { marginTop: 4, color: '#64748b', fontSize: 12, fontWeight: 750 }
const sessionGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }
const infoMiniStyle: CSSProperties = { display: 'grid', gap: 4, padding: 10, borderRadius: 14, background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, fontWeight: 800 }
const activityInsightStyle: CSSProperties = { display: 'grid', gap: 10, padding: 16, borderRadius: 22, border: '1px solid #dbeafe', background: '#f8fbff', marginBottom: 16 }
const activityInsightLabelStyle: CSSProperties = { display: 'block', color: '#64748b', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.1em' }
const activityInsightValueStyle: CSSProperties = { display: 'block', marginTop: 5, color: '#0f172a', fontSize: 28, fontWeight: 1000 }
const activityListStyle: CSSProperties = { display: 'grid', gap: 12 }
const activityCardStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '40px minmax(0,1fr)', gap: 12, padding: 15, borderRadius: 22, border: '1px solid #e2e8f0', background: '#fff' }
const activityDotStyle: CSSProperties = { width: 40, height: 40, borderRadius: 16, display: 'grid', placeItems: 'center', fontWeight: 1000 }
const activityTopStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }
const activityTitleStyle: CSSProperties = { color: '#0f172a', fontSize: 15, fontWeight: 1000 }
const activityTextStyle: CSSProperties = { margin: '7px 0', color: '#475569', fontSize: 13, fontWeight: 750, lineHeight: 1.45 }
const activityDateStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 850 }
const managerGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const managerCardStyle: CSSProperties = { display: 'grid', gap: 8, padding: 18, borderRadius: 22, color: '#0f172a', boxShadow: '0 16px 34px rgba(15,23,42,.04)' }
const dangerPanelStyle: CSSProperties = { ...panelStyle, gridColumn: '1 / -1', border: '1px solid #fecaca', background: 'linear-gradient(135deg,#ffffff,#fff5f5)' }
const dangerContentStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }
const dangerTitleStyle: CSSProperties = { display: 'block', color: '#991b1b', fontSize: 17, fontWeight: 1000 }
const dangerTextStyle: CSSProperties = { margin: '7px 0 0', color: '#7f1d1d', fontSize: 13, fontWeight: 750, maxWidth: 720 }
const dangerFormStyle: CSSProperties = { display: 'flex', gap: 10 }
const dangerButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '13px 16px', background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const emptyStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: 18, borderRadius: 20, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }

const livePanelStyle: CSSProperties = { display: 'grid', gap: 14, padding: 18, borderRadius: 26, boxShadow: '0 18px 42px rgba(15,23,42,.065)', minHeight: 270, height: '100%', alignContent: 'space-between', minWidth: 0 }
const liveOrbWrapStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 13 }
const liveOrbStyle: CSSProperties = { width: 48, height: 48, borderRadius: 999, boxShadow: '0 0 0 7px rgba(34,197,94,.10), 0 18px 32px rgba(15,23,42,.16)' }
const liveEyebrowStyle: CSSProperties = { display: 'block', color: '#64748b', fontSize: 10, fontWeight: 1000, letterSpacing: '.12em', textTransform: 'uppercase' }
const liveTitleStyle: CSSProperties = { display: 'block', marginTop: 5, color: '#0f172a', fontSize: 18, lineHeight: 1.1, fontWeight: 1000, letterSpacing: '-.03em' }
const liveGraphStyle: CSSProperties = { height: 86, display: 'flex', alignItems: 'end', gap: 9, padding: 12, borderRadius: 20, background: '#fff', border: '1px solid #e2e8f0' }
const liveGraphBarStyle: CSSProperties = { flex: 1, borderRadius: '12px 12px 6px 6px', minHeight: 12, boxShadow: 'inset 0 -10px 18px rgba(15,23,42,.08)' }
const liveMetaGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 9 }
const accessSwitchPanelStyle: CSSProperties = { display: 'grid', gap: 14, padding: 18, borderRadius: 26, boxShadow: '0 18px 42px rgba(15,23,42,.065)', minHeight: 270, height: '100%', alignContent: 'space-between', minWidth: 0 }
const switchHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }
const switchVisualStyle: CSSProperties = { display: 'grid', gap: 10, padding: 13, borderRadius: 20, background: '#fff', border: '1px solid #e2e8f0' }
const switchTrackStyle: CSSProperties = { width: 82, height: 42, borderRadius: 999, padding: 4, transition: 'all .2s ease', border: '1px solid rgba(15,23,42,.08)' }
const switchKnobStyle: CSSProperties = { width: 32, height: 32, borderRadius: 999, transition: 'all .2s ease', boxShadow: '0 12px 22px rgba(15,23,42,.18)' }
const switchCopyStyle: CSSProperties = { margin: 0, color: '#475569', fontSize: 12, lineHeight: 1.45, fontWeight: 750 }
const switchActionsStyle: CSSProperties = { display: 'grid' }
const suspendAccessButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '13px 14px', background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const restoreAccessButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '13px 14px', background: 'linear-gradient(135deg,#16a34a,#065f46)', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const permissionSummaryButtonStyle: CSSProperties = { display: 'grid', gap: 10, cursor: 'pointer', listStyle: 'none' }
const expandHintStyle: CSSProperties = { color: '#2563eb', fontSize: 11, fontWeight: 950, letterSpacing: '.04em' }
const permissionDetailsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 9, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(148,163,184,.35)' }
const fullRouteBoxStyle: CSSProperties = { gridColumn: '1 / -1', display: 'grid', gap: 6, padding: 12, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 12, fontWeight: 850, overflowWrap: 'anywhere' }

const emptyIconStyle: CSSProperties = { width: 36, height: 36, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#fff', border: '1px solid #e2e8f0', color: '#2563eb' }


const dossierPageStyle: CSSProperties = { width: '100%', display: 'grid', gap: 20, padding: '2px 0 36px' }
const dossierHeroStyle: CSSProperties = { position: 'relative', overflow: 'hidden', padding: 'clamp(22px,3vw,42px)', borderRadius: 30, color: '#fff', background: 'radial-gradient(circle at 85% 15%,rgba(74,178,255,.28),transparent 30%),linear-gradient(135deg,#061f39 0%,#0b3d68 56%,#0f5d91 100%)', boxShadow: '0 30px 80px rgba(4,31,57,.23)' }
const brandBlockStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, color: '#d8ecfb', fontSize: 11, fontWeight: 950, letterSpacing: '.16em' }
const brandLogoStyle: CSSProperties = { width: 142, maxHeight: 48, objectFit: 'contain', padding: '8px 10px', borderRadius: 12, background: '#fff' }
const identityHeroGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(300px,.7fr)', gap: 28, alignItems: 'center' }
const identityMainStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 24, minWidth: 0 }
const portraitFrameStyle: CSSProperties = { position: 'relative', flex: '0 0 auto', display: 'grid', placeItems: 'center', width: 132, height: 132, borderRadius: '50%', overflow: 'visible', border: '5px solid rgba(255,255,255,.88)', background: 'linear-gradient(145deg,#d7eafb,#fff)', color: '#0b3d68', fontSize: 34, fontWeight: 950, boxShadow: '0 18px 46px rgba(0,0,0,.28)' }
const portraitImageStyle: CSSProperties = { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }
const verifiedDotStyle: CSSProperties = { position: 'absolute', right: 2, bottom: 5, display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: '50%', border: '3px solid #fff', background: '#16a34a', color: '#fff', fontStyle: 'normal', fontSize: 13 }
const dossierHeroTitleStyle: CSSProperties = { margin: '12px 0 5px', fontSize: 'clamp(30px,4vw,54px)', lineHeight: 1.02, letterSpacing: '-.055em' }
const dossierHeroSubtitleStyle: CSSProperties = { margin: 0, color: '#c7dded', fontSize: 16 }
const identityFactsStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }
const passportMetricsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const dossierStackStyle: CSSProperties = { display: 'grid', gap: 18 }
const executiveGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16 }
const executiveCardStyle: CSSProperties = { padding: 22, border: '1px solid #dbe7f0', borderRadius: 22, background: 'linear-gradient(145deg,#fff,#f8fbfe)' }
const cardEyebrowStyle: CSSProperties = { display: 'block', marginBottom: 7, color: '#1670ad', fontSize: 10, fontWeight: 950, letterSpacing: '.14em', textTransform: 'uppercase' }
const cardTitleStyle: CSSProperties = { margin: 0, color: '#12314d', fontSize: 21, letterSpacing: '-.025em' }
const executiveFactsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 18 }
const alertStackStyle: CSSProperties = { display: 'grid', gap: 9, marginTop: 18 }
const alertAmberStyle: CSSProperties = { padding: '11px 13px', border: '1px solid #fde68a', borderRadius: 12, background: '#fffbeb', color: '#92400e', fontSize: 13, fontWeight: 750 }
const alertRedStyle: CSSProperties = { ...alertAmberStyle, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b' }
const alertGreenStyle: CSSProperties = { ...alertAmberStyle, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534' }
const quickGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }
const quickLinkStyle: CSSProperties = { display: 'grid', gap: 5, padding: 18, border: '1px solid #dbe7f0', borderRadius: 18, background: '#fff', color: '#143d67', textDecoration: 'none', boxShadow: '0 10px 28px rgba(15,45,78,.06)' }
const trustGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const trustCardStyle: CSSProperties = { padding: 20, border: '1px solid #d7e5ef', borderRadius: 20, background: 'linear-gradient(145deg,#f8fbfe,#fff)' }
const trustLabelStyle: CSSProperties = { color: '#678097', fontSize: 10, fontWeight: 950, letterSpacing: '.13em' }
const trustValueStyle: CSSProperties = { display: 'block', margin: '8px 0 3px', color: '#0d355a', fontSize: 25 }
const trustDetailStyle: CSSProperties = { color: '#6b8195' }
const twoColStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 18 }
const subPanelStyle: CSSProperties = { padding: 20, border: '1px solid #dce7f1', borderRadius: 22, background: '#fbfdff' }
const securityBoundaryStyle: CSSProperties = { display: 'grid', gap: 5, padding: 17, border: '1px solid #bfdbfe', borderRadius: 16, background: '#eff6ff', color: '#17456f' }
const specializedHeroStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 22, alignItems: 'center', padding: 22, border: '1px solid #dbe7f0', borderRadius: 22, background: 'linear-gradient(135deg,#f8fbff,#edf6fc)' }
const specializedCopyStyle: CSSProperties = { maxWidth: 760, margin: '8px 0 0', color: '#60788e', lineHeight: 1.6 }
const specializedMetricStyle: CSSProperties = { minWidth: 150, padding: 18, borderRadius: 18, background: '#0c3e68', color: '#fff', textAlign: 'center' }
const governanceDetailsStyle: CSSProperties = { border: '1px solid #d9e5ef', borderRadius: 22, overflow: 'hidden', background: '#fff' }
const governanceSummaryStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, padding: 20, cursor: 'pointer', color: '#12314d' }
const openPillStyle: CSSProperties = { padding: '7px 10px', borderRadius: 999, background: '#e8f3fb', color: '#126496', fontSize: 10, fontWeight: 950, letterSpacing: '.1em' }
const embeddedSystemStyle: CSSProperties = { padding: 14, borderTop: '1px solid #e3ebf2', background: '#f7fafc' }
const compactFilterStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, marginBottom: 14 }
const dangerDetailsStyle: CSSProperties = { border: '1px solid #fecaca', borderRadius: 18, overflow: 'hidden', background: '#fffafa' }
const dangerSummaryStyle: CSSProperties = { padding: 18, color: '#991b1b', fontWeight: 900, cursor: 'pointer' }

