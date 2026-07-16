"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

type Tone = 'green' | 'red' | 'blue' | 'purple' | 'amber' | 'slate'

type PermissionState = {
  can_read: boolean
  can_send: boolean
  can_reply: boolean
  can_archive: boolean
  can_delete: boolean
  can_manage_templates: boolean
  can_view_logs: boolean
  can_manage_mailbox_settings: boolean
}

type MailboxOption = {
  id: string
  name: string
  address: string
  status: string
  owner?: string | null
  provider?: string | null
}

type SessionState = {
  id: string
  status: string
  unlocked_at?: string | null
  expires_at: string
  last_activity_at?: string | null
  revoked_at?: string | null
  revoked_by?: string | null
  revoked_reason?: string | null
} | null

type AssignmentRow = {
  id: string
  user_id: string
  mailbox_id: string
  mailbox?: MailboxOption | null
  role: string
  permissions: PermissionState
  pin_status: string
  status: string
  failed_pin_attempts: number
  locked_until?: string | null
  assigned_by?: string | null
  assigned_at?: string | null
  revoked_by?: string | null
  revoked_at?: string | null
  revoke_reason?: string | null
  notes?: string | null
  session_status: string
  session?: SessionState
  last_unlock_at?: string | null
  last_activity_at?: string | null
  row_state: string
  security_status: string
}

type Summary = {
  assigned_mailboxes_count: number
  active_sessions_count: number
  locked_assignments_count: number
  last_activity_at?: string | null
  security_status: string
}

type AuditEvent = {
  id: string
  actor_user_id?: string | null
  target_user_id?: string | null
  mailbox_id?: string | null
  assignment_id?: string | null
  session_id?: string | null
  event_type: string
  event_result: string
  severity: string
  ip_address?: string | null
  user_agent?: string | null
  metadata_json?: Record<string, any>
  created_at?: string | null
}

const ROLE_PRESETS: Record<string, PermissionState> = {
  viewer: { can_read: true, can_send: false, can_reply: false, can_archive: false, can_delete: false, can_manage_templates: false, can_view_logs: false, can_manage_mailbox_settings: false },
  operator: { can_read: true, can_send: true, can_reply: true, can_archive: true, can_delete: false, can_manage_templates: false, can_view_logs: false, can_manage_mailbox_settings: false },
  sender: { can_read: true, can_send: true, can_reply: true, can_archive: false, can_delete: false, can_manage_templates: true, can_view_logs: false, can_manage_mailbox_settings: false },
  manager: { can_read: true, can_send: true, can_reply: true, can_archive: true, can_delete: false, can_manage_templates: true, can_view_logs: true, can_manage_mailbox_settings: false },
  admin: { can_read: true, can_send: true, can_reply: true, can_archive: true, can_delete: true, can_manage_templates: true, can_view_logs: true, can_manage_mailbox_settings: true },
}

const PERMISSION_FIELDS: Array<keyof PermissionState> = [
  'can_read',
  'can_send',
  'can_reply',
  'can_archive',
  'can_delete',
  'can_manage_templates',
  'can_view_logs',
  'can_manage_mailbox_settings',
]

function clean(value: unknown) {
  return String(value ?? '').trim()
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed)
}

function shortDate(value?: string | null) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(parsed)
}

function toneForStatus(value: string): Tone {
  const text = clean(value).toLowerCase()
  if (text.includes('healthy') || text.includes('active') || text.includes('ready') || text.includes('pin active')) return 'green'
  if (text.includes('revoked') || text.includes('blocked') || text.includes('expired') || text.includes('locked')) return 'red'
  if (text.includes('needs')) return 'amber'
  if (text.includes('session')) return 'blue'
  return 'slate'
}

function toneForPin(value: string): Tone {
  const text = clean(value).toLowerCase()
  if (text === 'active') return 'green'
  if (text === 'locked' || text === 'revoked') return 'red'
  if (text === 'reset_required') return 'amber'
  return 'slate'
}

function toneForRole(value: string): Tone {
  const text = clean(value).toLowerCase()
  if (text === 'admin') return 'red'
  if (text === 'manager') return 'purple'
  if (text === 'sender') return 'blue'
  if (text === 'operator') return 'amber'
  return 'slate'
}

function Badge({ label, tone = 'slate' }: { label: string; tone?: Tone }) {
  const palette = chipPalette[tone]
  return (
    <span style={{ ...chipStyle, border: `1px solid ${palette.border}`, background: palette.soft, color: palette.color }}>
      {label}
    </span>
  )
}

function StatCard({ label, value, detail, tone = 'blue' }: { label: string; value: string; detail?: string; tone?: Tone }) {
  const palette = chipPalette[tone]
  return (
    <div style={{ ...statCardStyle, border: `1px solid ${palette.border}`, background: palette.soft }}>
      <div style={statLabelStyle}>{label}</div>
      <div style={statValueStyle}>{value}</div>
      {detail ? <div style={statDetailStyle}>{detail}</div> : null}
    </div>
  )
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  return (
    <div style={modalOverlayStyle} role="dialog" aria-modal="true" aria-label={title}>
      <div style={{ ...modalCardStyle, width: wide ? 'min(1040px, calc(100vw - 32px))' : 'min(760px, calc(100vw - 32px))' }}>
        <div style={modalHeaderStyle}>
          <div>
            <div style={modalEyebrowStyle}>Email-OS Mailbox Access</div>
            <h3 style={modalTitleStyle}>{title}</h3>
            {subtitle ? <p style={modalSubtitleStyle}>{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} style={modalCloseStyle}>×</button>
        </div>
        <div style={modalBodyStyle}>{children}</div>
        {footer ? <div style={modalFooterStyle}>{footer}</div> : null}
      </div>
    </div>
  )
}

function rolePreset(role: string): PermissionState {
  return ROLE_PRESETS[clean(role).toLowerCase()] || ROLE_PRESETS.viewer
}

function permissionLabel(field: keyof PermissionState) {
  const labels: Record<keyof PermissionState, string> = {
    can_read: 'Read',
    can_send: 'Send',
    can_reply: 'Reply',
    can_archive: 'Archive',
    can_delete: 'Delete',
    can_manage_templates: 'Templates',
    can_view_logs: 'Logs',
    can_manage_mailbox_settings: 'Mailbox settings',
  }
  return labels[field]
}

function permissionSummary(permissions: PermissionState) {
  return PERMISSION_FIELDS.filter((field) => permissions[field]).map((field) => permissionLabel(field)).join(' · ') || 'No permissions'
}

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok && json?.ok !== false, status: res.status, data: json?.data ?? json, error: json?.error || (!res.ok ? `HTTP ${res.status}` : null) }
}

type Props = {
  userId: string
  initialSummary: Summary
  initialAssignments: AssignmentRow[]
  initialMailboxes: MailboxOption[]
  initialAudit: AuditEvent[]
}

export default function EmailOSMailboxAccessSection({
  userId,
  initialSummary,
  initialAssignments,
  initialMailboxes,
  initialAudit,
}: Props) {
  const [summary, setSummary] = useState<Summary>(initialSummary)
  const [assignments, setAssignments] = useState<AssignmentRow[]>(initialAssignments)
  const [mailboxes, setMailboxes] = useState<MailboxOption[]>(initialMailboxes)
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(initialAudit)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeAuditTitle, setActiveAuditTitle] = useState('All audit events')
  const [selectedMailboxAudit, setSelectedMailboxAudit] = useState<string | null>(null)

  const [assignOpen, setAssignOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<null | 'role' | 'permissions'>(null)
  const [pinOpen, setPinOpen] = useState<null | 'set' | 'reset'>(null)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentRow | null>(null)

  const [busy, setBusy] = useState(false)

  const [assignForm, setAssignForm] = useState({
    mailboxId: '',
    role: 'viewer',
    pin: '',
    confirmPin: '',
    notes: '',
    confirm: false,
    permissions: rolePreset('viewer'),
  })

  const [editForm, setEditForm] = useState({
    role: 'viewer',
    permissions: rolePreset('viewer'),
    notes: '',
  })

  const [pinForm, setPinForm] = useState({
    pin: '',
    confirmPin: '',
    reason: '',
    revokeActiveSessions: true,
  })

  const [revokeForm, setRevokeForm] = useState({
    reason: '',
    revokeSessions: true,
  })

  const [logoutReason, setLogoutReason] = useState('')

  const refresh = async () => {
    setLoading(true)
    setError(null)
    const [assignmentsRes, auditRes] = await Promise.all([
      api(`/api/email-os/access/admin/assignments?userId=${encodeURIComponent(userId)}`),
      api(`/api/email-os/access/admin/audit?userId=${encodeURIComponent(userId)}`),
    ])
    setLoading(false)

    if (!assignmentsRes.ok) {
      setError(assignmentsRes.error || 'Failed to refresh mailbox access state.')
      return
    }

    setSummary(assignmentsRes.data?.summary || initialSummary)
    setAssignments(assignmentsRes.data?.assignments || [])
    setMailboxes(assignmentsRes.data?.mailboxes || [])
    if (auditRes.ok) {
      setAuditEvents(auditRes.data || [])
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const activeAssignments = assignments.filter((assignment) => assignment.status !== 'revoked')
  const currentAuditRows = selectedMailboxAudit ? auditEvents.filter((row) => row.mailbox_id === selectedMailboxAudit) : auditEvents

  async function submitAssignment() {
    if (!assignForm.mailboxId) return setError('Mailbox is required.')
    if (!assignForm.role) return setError('Role is required.')
    if (!/^\d{6}$/.test(assignForm.pin)) return setError('PIN must contain exactly 6 digits.')
    if (assignForm.pin !== assignForm.confirmPin) return setError('PIN confirmation must match.')
    if (!assignForm.confirm) return setError('You must confirm the mailbox access impact.')

    setBusy(true)
    setError(null)
    const result = await api('/api/email-os/access/admin/assignments', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        mailboxId: assignForm.mailboxId,
        role: assignForm.role,
        pin: assignForm.pin,
        notes: assignForm.notes,
        canRead: assignForm.permissions.can_read,
        canSend: assignForm.permissions.can_send,
        canReply: assignForm.permissions.can_reply,
        canArchive: assignForm.permissions.can_archive,
        canDelete: assignForm.permissions.can_delete,
        canManageTemplates: assignForm.permissions.can_manage_templates,
        canViewLogs: assignForm.permissions.can_view_logs,
        canManageMailboxSettings: assignForm.permissions.can_manage_mailbox_settings,
      }),
    })
    setBusy(false)
    if (!result.ok) return setError(result.error || 'Assignment failed')
    setAssignOpen(false)
    setAssignForm({
      mailboxId: '',
      role: 'viewer',
      pin: '',
      confirmPin: '',
      notes: '',
      confirm: false,
      permissions: rolePreset('viewer'),
    })
    await refresh()
  }

  async function submitEdit() {
    if (!selectedAssignment) return
    setBusy(true)
    setError(null)
    const result = await api(`/api/email-os/access/admin/assignments/${selectedAssignment.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        role: editForm.role,
        notes: editForm.notes,
        canRead: editForm.permissions.can_read,
        canSend: editForm.permissions.can_send,
        canReply: editForm.permissions.can_reply,
        canArchive: editForm.permissions.can_archive,
        canDelete: editForm.permissions.can_delete,
        canManageTemplates: editForm.permissions.can_manage_templates,
        canViewLogs: editForm.permissions.can_view_logs,
        canManageMailboxSettings: editForm.permissions.can_manage_mailbox_settings,
      }),
    })
    setBusy(false)
    if (!result.ok) return setError(result.error || 'Update failed')
    setEditOpen(null)
    setSelectedAssignment(null)
    await refresh()
  }

  async function submitPin() {
    if (!selectedAssignment) return
    if (!/^\d{6}$/.test(pinForm.pin)) return setError('PIN must contain exactly 6 digits.')
    if (pinForm.pin !== pinForm.confirmPin) return setError('PIN confirmation must match.')

    setBusy(true)
    setError(null)
    const endpoint = pinOpen === 'reset' ? '/api/email-os/access/admin/reset-pin' : '/api/email-os/access/admin/set-pin'
    const result = await api(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: selectedAssignment.id,
        pin: pinForm.pin,
        reason: pinForm.reason,
        revokeActiveSessions: pinForm.revokeActiveSessions,
      }),
    })
    setBusy(false)
    if (!result.ok) return setError(result.error || 'PIN update failed')
    setPinOpen(null)
    setSelectedAssignment(null)
    setPinForm({ pin: '', confirmPin: '', reason: '', revokeActiveSessions: true })
    await refresh()
  }

  async function submitRevoke() {
    if (!selectedAssignment) return
    setBusy(true)
    setError(null)
    const result = await api('/api/email-os/access/admin/revoke', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: selectedAssignment.id,
        reason: revokeForm.reason,
        revokeSessions: revokeForm.revokeSessions,
      }),
    })
    setBusy(false)
    if (!result.ok) return setError(result.error || 'Revoke failed')
    setRevokeOpen(false)
    setSelectedAssignment(null)
    setRevokeForm({ reason: '', revokeSessions: true })
    await refresh()
  }

  async function submitLogout() {
    if (!selectedAssignment) return
    setBusy(true)
    setError(null)
    const result = await api('/api/email-os/access/admin/force-logout', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: selectedAssignment.id,
        reason: logoutReason,
      }),
    })
    setBusy(false)
    if (!result.ok) return setError(result.error || 'Logout failed')
    setLogoutOpen(false)
    setSelectedAssignment(null)
    setLogoutReason('')
    await refresh()
  }

  async function openAudit(mailboxId?: string | null, title = 'All audit events') {
    setActiveAuditTitle(title)
    setSelectedMailboxAudit(mailboxId || null)
    setAuditOpen(true)
    if (!mailboxId) {
      const res = await api(`/api/email-os/access/admin/audit?userId=${encodeURIComponent(userId)}&limit=250`)
      if (res.ok) setAuditEvents(res.data || [])
    } else {
      const res = await api(`/api/email-os/access/admin/audit?userId=${encodeURIComponent(userId)}&mailboxId=${encodeURIComponent(mailboxId)}&limit=250`)
      if (res.ok) setAuditEvents(res.data || [])
    }
  }

  const rowCount = assignments.length
  const securityText = clean(summary.security_status).toLowerCase()
  const securityTone = securityText.includes('ready') || securityText.includes('healthy') || securityText.includes('pin active')
    ? 'green'
    : securityText.includes('needs')
      ? 'amber'
      : securityText.includes('locked') || securityText.includes('revoked')
        ? 'red'
        : 'slate'

  return (
    <section style={panelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <div style={eyebrowStyle}>Governance</div>
          <h2 style={sectionTitleStyle}>Email-OS Mailbox Access</h2>
          <p style={sectionSubtitleStyle}>Govern which Email-OS mailboxes this user can operate, then unlock them with mailbox-specific PINs and session expiry enforcement.</p>
        </div>
        <div style={sectionActionsStyle}>
          <button type="button" onClick={() => setAssignOpen(true)} style={primaryButtonStyle}>Assign mailbox</button>
          <button type="button" onClick={() => void refresh()} style={secondaryButtonStyle}>{loading ? 'Refreshing…' : 'Refresh access state'}</button>
          <button type="button" onClick={() => void openAudit(null, 'All audit events')} style={secondaryButtonStyle}>View all audit events</button>
        </div>
      </div>

      <div style={kpiGridStyle}>
        <StatCard label="Assigned mailboxes" value={String(summary.assigned_mailboxes_count)} detail={`${rowCount} row(s) loaded`} tone="blue" />
        <StatCard label="Active sessions" value={String(summary.active_sessions_count)} detail="Scoped unlocks only" tone={summary.active_sessions_count ? 'green' : 'slate'} />
        <StatCard label="Locked assignments" value={String(summary.locked_assignments_count)} detail="PIN or access blocked" tone={summary.locked_assignments_count ? 'amber' : 'green'} />
        <StatCard label="Last activity" value={shortDate(summary.last_activity_at)} detail={summary.last_activity_at ? formatDate(summary.last_activity_at) : 'No Email-OS activity yet'} tone="purple" />
        <StatCard label="Security status" value={summary.security_status} detail="Mailbox governance posture" tone={securityTone} />
      </div>

      {error ? (
        <div style={errorBannerStyle}>
          <strong>Mailbox access update failed</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {activeAssignments.length ? (
        <div style={tableShellStyle}>
          <div style={tableHeaderGridStyle}>
            <span>Mailbox</span>
            <span>Email Address</span>
            <span>Role</span>
            <span>Permissions</span>
            <span>PIN Status</span>
            <span>Session Status</span>
            <span>Failed Attempts</span>
            <span>Last Unlock</span>
            <span>Last Activity</span>
            <span>Assigned By</span>
            <span>Actions</span>
          </div>
          <div style={tableBodyStyle}>
            {activeAssignments.map((assignment) => {
              const mailbox = assignment.mailbox || mailboxes.find((item) => item.id === assignment.mailbox_id) || null
              const sessionTone = assignment.session_status === 'active' ? 'green' : assignment.session_status === 'expired' ? 'amber' : 'red'
              return (
                <div key={assignment.id} style={tableRowStyle}>
                  <div>
                    <div style={rowPrimaryStyle}>{mailbox?.name || assignment.mailbox_id}</div>
                    <div style={rowSecondaryStyle}>ID {assignment.mailbox_id}</div>
                  </div>
                  <div>
                    <div style={rowPrimaryStyle}>{mailbox?.address || '—'}</div>
                    <div style={rowSecondaryStyle}>{mailbox?.status || 'active'}</div>
                  </div>
                  <div>
                    <Badge label={clean(assignment.role).toUpperCase()} tone={toneForRole(assignment.role)} />
                  </div>
                  <div>
                    <div style={permissionSummaryStyleText}>{permissionSummary(assignment.permissions)}</div>
                    <div style={rowSecondaryStyle}>{assignment.permissions.can_manage_mailbox_settings ? 'Mailbox admin override available' : 'Standard scoped permissions'}</div>
                  </div>
                  <div>
                    <Badge label={assignment.pin_status.replaceAll('_', ' ')} tone={toneForPin(assignment.pin_status)} />
                    <div style={rowSecondaryStyle}>{assignment.row_state}</div>
                  </div>
                  <div>
                    <Badge label={assignment.session_status.replaceAll('_', ' ')} tone={sessionTone} />
                    <div style={rowSecondaryStyle}>{assignment.session?.expires_at ? `Expires ${shortDate(assignment.session.expires_at)}` : 'No unlocked session'}</div>
                  </div>
                  <div>
                    <div style={rowPrimaryStyle}>{String(assignment.failed_pin_attempts || 0)}</div>
                    <div style={rowSecondaryStyle}>{assignment.locked_until ? `Locked until ${shortDate(assignment.locked_until)}` : 'No lockout'}</div>
                  </div>
                  <div>
                    <div style={rowPrimaryStyle}>{shortDate(assignment.last_unlock_at)}</div>
                    <div style={rowSecondaryStyle}>{assignment.session?.unlocked_at ? 'Mailbox session recorded' : 'Never unlocked'}</div>
                  </div>
                  <div>
                    <div style={rowPrimaryStyle}>{shortDate(assignment.last_activity_at)}</div>
                    <div style={rowSecondaryStyle}>{assignment.session?.last_activity_at ? 'Session activity tracked' : 'No session activity yet'}</div>
                  </div>
                  <div>
                    <div style={rowPrimaryStyle}>{assignment.assigned_by || '—'}</div>
                    <div style={rowSecondaryStyle}>{shortDate(assignment.assigned_at)}</div>
                  </div>
                  <div style={actionsGridStyle}>
                    <button type="button" onClick={() => { setSelectedAssignment(assignment); setPinOpen('set'); setPinForm({ pin: '', confirmPin: '', reason: '', revokeActiveSessions: true }) }} style={rowActionButtonStyle}>Configure PIN</button>
                    <button type="button" onClick={() => { setSelectedAssignment(assignment); setPinOpen('reset'); setPinForm({ pin: '', confirmPin: '', reason: '', revokeActiveSessions: true }) }} style={rowActionButtonStyle}>Reset PIN</button>
                    <button type="button" onClick={() => { setSelectedAssignment(assignment); setEditOpen('role'); setEditForm({ role: assignment.role, permissions: { ...assignment.permissions }, notes: assignment.notes || '' }) }} style={rowActionButtonStyle}>Change role</button>
                    <button type="button" onClick={() => { setSelectedAssignment(assignment); setEditOpen('permissions'); setEditForm({ role: assignment.role, permissions: { ...assignment.permissions }, notes: assignment.notes || '' }) }} style={rowActionButtonStyle}>Edit permissions</button>
                    <button type="button" onClick={() => { setSelectedAssignment(assignment); setLogoutOpen(true) }} style={rowActionButtonStyle}>Force logout</button>
                    <button type="button" onClick={() => { setSelectedAssignment(assignment); setRevokeOpen(true); setRevokeForm({ reason: '', revokeSessions: true }) }} style={rowActionButtonDangerStyle}>Revoke access</button>
                    <button type="button" onClick={() => void openAudit(assignment.mailbox_id, `${mailbox?.name || assignment.mailbox_id} audit trail`)} style={rowActionButtonStyle}>Audit trail</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={emptyStateStyle}>
          <strong>No Email-OS mailbox access has been configured for this user.</strong>
          <span>Assign mailbox access to grant controlled operational access.</span>
          <button type="button" onClick={() => setAssignOpen(true)} style={primaryButtonStyle}>Assign mailbox access</button>
        </div>
      )}

      {assignOpen ? (
        <ModalShell
          title="Assign mailbox"
          subtitle="Bind a real production mailbox to this user with scoped permissions and a mailbox-specific PIN."
          onClose={() => setAssignOpen(false)}
          wide
          footer={<div style={modalFooterActionsStyle}><button type="button" onClick={() => setAssignOpen(false)} style={secondaryButtonStyle}>Cancel</button><button type="button" onClick={() => void submitAssignment()} disabled={busy} style={primaryButtonStyle}>{busy ? 'Saving…' : 'Assign mailbox'}</button></div>}
        >
          <div style={formGridStyle}>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Mailbox</span>
              <select value={assignForm.mailboxId} onChange={(e) => setAssignForm((current) => ({ ...current, mailboxId: e.target.value }))} style={inputStyle}>
                <option value="">Select a mailbox</option>
                {mailboxes.map((mailbox) => (
                  <option key={mailbox.id} value={mailbox.id}>{mailbox.name} · {mailbox.address}</option>
                ))}
              </select>
            </label>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Role</span>
              <select
                value={assignForm.role}
                onChange={(e) => setAssignForm((current) => ({ ...current, role: e.target.value, permissions: rolePreset(e.target.value) }))}
                style={inputStyle}
              >
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="sender">Sender</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div style={previewCardStyle}>
              <div style={previewTitleStyle}>Permission preset preview</div>
              <div style={previewTextStyle}>{permissionSummary(assignForm.permissions)}</div>
            </div>
            <div style={permissionsGridStyle}>
              {PERMISSION_FIELDS.map((field) => (
                <label key={field} style={checkboxRowStyle}>
                  <input
                    type="checkbox"
                    checked={assignForm.permissions[field]}
                    onChange={(e) => setAssignForm((current) => ({ ...current, permissions: { ...current.permissions, [field]: e.target.checked } }))}
                  />
                  <span>{permissionLabel(field)}</span>
                </label>
              ))}
            </div>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>6-digit PIN</span>
              <input inputMode="numeric" maxLength={6} value={assignForm.pin} onChange={(e) => setAssignForm((current) => ({ ...current, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Confirm 6-digit PIN</span>
              <input inputMode="numeric" maxLength={6} value={assignForm.confirmPin} onChange={(e) => setAssignForm((current) => ({ ...current, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} style={inputStyle} />
            </label>
            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={fieldLabelStyle}>Notes / reason</span>
              <textarea value={assignForm.notes} onChange={(e) => setAssignForm((current) => ({ ...current, notes: e.target.value }))} rows={4} style={textareaStyle} />
            </label>
            <label style={{ ...checkboxRowStyle, gridColumn: '1 / -1' }}>
              <input type="checkbox" checked={assignForm.confirm} onChange={(e) => setAssignForm((current) => ({ ...current, confirm: e.target.checked }))} />
              <span>I understand this user will be able to unlock and operate this mailbox according to the selected permissions.</span>
            </label>
          </div>
        </ModalShell>
      ) : null}

      {editOpen ? (
        <ModalShell
          title={editOpen === 'role' ? 'Change role' : 'Edit permissions'}
          subtitle="Adjust access scope without exposing mailbox secrets."
          onClose={() => setEditOpen(null)}
          footer={<div style={modalFooterActionsStyle}><button type="button" onClick={() => setEditOpen(null)} style={secondaryButtonStyle}>Cancel</button><button type="button" onClick={() => void submitEdit()} disabled={busy} style={primaryButtonStyle}>{busy ? 'Saving…' : 'Save changes'}</button></div>}
        >
          <div style={formGridStyle}>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Role</span>
              <select value={editForm.role} onChange={(e) => setEditForm((current) => ({ ...current, role: e.target.value }))} style={inputStyle}>
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="sender">Sender</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div style={previewCardStyle}>
              <div style={previewTitleStyle}>Preset preview</div>
              <div style={previewTextStyle}>{permissionSummary(rolePreset(editForm.role))}</div>
            </div>
            <div style={permissionsGridStyle}>
              {PERMISSION_FIELDS.map((field) => (
                <label key={field} style={checkboxRowStyle}>
                  <input
                    type="checkbox"
                    checked={editForm.permissions[field]}
                    onChange={(e) => setEditForm((current) => ({ ...current, permissions: { ...current.permissions, [field]: e.target.checked } }))}
                  />
                  <span>{permissionLabel(field)}</span>
                </label>
              ))}
            </div>
            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={fieldLabelStyle}>Notes</span>
              <textarea value={editForm.notes} onChange={(e) => setEditForm((current) => ({ ...current, notes: e.target.value }))} rows={4} style={textareaStyle} />
            </label>
          </div>
        </ModalShell>
      ) : null}

      {pinOpen ? (
        <ModalShell
          title={pinOpen === 'reset' ? 'Reset PIN' : 'Configure PIN'}
          subtitle="Store a hashed 6-digit PIN and optionally revoke any active mailbox sessions."
          onClose={() => setPinOpen(null)}
          footer={<div style={modalFooterActionsStyle}><button type="button" onClick={() => setPinOpen(null)} style={secondaryButtonStyle}>Cancel</button><button type="button" onClick={() => void submitPin()} disabled={busy} style={primaryButtonStyle}>{busy ? 'Saving…' : pinOpen === 'reset' ? 'Reset PIN' : 'Save PIN'}</button></div>}
        >
          <div style={formGridStyle}>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>New 6-digit PIN</span>
              <input inputMode="numeric" maxLength={6} value={pinForm.pin} onChange={(e) => setPinForm((current) => ({ ...current, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} style={inputStyle} />
            </label>
            <label style={fieldStyle}>
              <span style={fieldLabelStyle}>Confirm 6-digit PIN</span>
              <input inputMode="numeric" maxLength={6} value={pinForm.confirmPin} onChange={(e) => setPinForm((current) => ({ ...current, confirmPin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} style={inputStyle} />
            </label>
            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={fieldLabelStyle}>Reason / notes</span>
              <textarea value={pinForm.reason} onChange={(e) => setPinForm((current) => ({ ...current, reason: e.target.value }))} rows={4} style={textareaStyle} />
            </label>
            <label style={{ ...checkboxRowStyle, gridColumn: '1 / -1' }}>
              <input type="checkbox" checked={pinForm.revokeActiveSessions} onChange={(e) => setPinForm((current) => ({ ...current, revokeActiveSessions: e.target.checked }))} />
              <span>Revoke active sessions immediately after PIN save</span>
            </label>
          </div>
        </ModalShell>
      ) : null}

      {revokeOpen && selectedAssignment ? (
        <ModalShell
          title="Revoke access"
          subtitle={`This will revoke the assignment for ${selectedAssignment.mailbox?.name || selectedAssignment.mailbox_id} immediately.`}
          onClose={() => setRevokeOpen(false)}
          footer={<div style={modalFooterActionsStyle}><button type="button" onClick={() => setRevokeOpen(false)} style={secondaryButtonStyle}>Cancel</button><button type="button" onClick={() => void submitRevoke()} disabled={busy} style={destructiveButtonStyle}>{busy ? 'Revoking…' : 'Revoke access'}</button></div>}
        >
          <div style={formGridStyle}>
            <div style={destructiveNoticeStyle}>
              <strong>Confirmation required</strong>
              <span>Assignment status becomes revoked and the user loses access immediately.</span>
            </div>
            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={fieldLabelStyle}>Revocation reason</span>
              <textarea value={revokeForm.reason} onChange={(e) => setRevokeForm((current) => ({ ...current, reason: e.target.value }))} rows={4} style={textareaStyle} />
            </label>
            <label style={{ ...checkboxRowStyle, gridColumn: '1 / -1' }}>
              <input type="checkbox" checked={revokeForm.revokeSessions} onChange={(e) => setRevokeForm((current) => ({ ...current, revokeSessions: e.target.checked }))} />
              <span>Revoke all active sessions for this mailbox</span>
            </label>
          </div>
        </ModalShell>
      ) : null}

      {logoutOpen && selectedAssignment ? (
        <ModalShell
          title="Force logout"
          subtitle={`End the current session for ${selectedAssignment.mailbox?.name || selectedAssignment.mailbox_id} without removing the assignment.`}
          onClose={() => setLogoutOpen(false)}
          footer={<div style={modalFooterActionsStyle}><button type="button" onClick={() => setLogoutOpen(false)} style={secondaryButtonStyle}>Cancel</button><button type="button" onClick={() => void submitLogout()} disabled={busy} style={destructiveButtonStyle}>{busy ? 'Logging out…' : 'Force logout'}</button></div>}
        >
          <div style={formGridStyle}>
            <div style={noticeCardStyle}>
              <strong>Confirmation required</strong>
              <span>Active mailbox access session becomes revoked. The assignment remains active and the user must re-enter the PIN next time.</span>
            </div>
            <label style={{ ...fieldStyle, gridColumn: '1 / -1' }}>
              <span style={fieldLabelStyle}>Reason</span>
              <textarea value={logoutReason} onChange={(e) => setLogoutReason(e.target.value)} rows={4} style={textareaStyle} />
            </label>
          </div>
        </ModalShell>
      ) : null}

      {auditOpen ? (
        <ModalShell
          title={activeAuditTitle}
          subtitle={selectedMailboxAudit ? `Mailbox-scoped audit trail for ${selectedMailboxAudit}` : 'User-level Email-OS audit history'}
          onClose={() => setAuditOpen(false)}
          wide
        >
          <div style={auditGridStyle}>
            {currentAuditRows.length ? currentAuditRows.map((event) => (
              <div key={event.id} style={auditRowStyle}>
                <div style={auditTopStyle}>
                  <div>
                    <div style={auditEventStyle}>{event.event_type}</div>
                    <div style={auditMetaStyle}>{formatDate(event.created_at)}</div>
                  </div>
                  <Badge label={event.event_result} tone={toneForStatus(event.event_result)} />
                </div>
                <div style={auditBodyStyle}>
                  <span>Actor: {clean(event.actor_user_id) || '—'}</span>
                  <span>Target: {clean(event.target_user_id) || '—'}</span>
                  <span>IP: {clean(event.ip_address) || '—'}</span>
                  <span>User agent: {clean(event.user_agent) || '—'}</span>
                </div>
                <pre style={auditJsonStyle}>{JSON.stringify(event.metadata_json || {}, null, 2)}</pre>
              </div>
            )) : <div style={emptyAuditStyle}>No audit events available.</div>}
          </div>
        </ModalShell>
      ) : null}
    </section>
  )
}

const panelStyle: CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 28, padding: 26, boxShadow: '0 22px 48px rgba(15,23,42,.065)' }
const sectionHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }
const eyebrowStyle: CSSProperties = { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', fontWeight: 950, fontSize: 12, marginBottom: 9 }
const sectionTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 25, fontWeight: 1000, letterSpacing: '-.035em' }
const sectionSubtitleStyle: CSSProperties = { margin: '6px 0 0', color: '#64748b', fontSize: 13, fontWeight: 750, lineHeight: 1.45 }
const sectionActionsStyle: CSSProperties = { display: 'grid', gap: 10, justifyItems: 'end' }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12, marginBottom: 18 }
const statCardStyle: CSSProperties = { display: 'grid', gap: 6, alignItems: 'start', borderRadius: 22, padding: 16, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const statLabelStyle: CSSProperties = { color: '#64748b', fontSize: 10, fontWeight: 950, letterSpacing: '.1em', textTransform: 'uppercase' }
const statValueStyle: CSSProperties = { color: '#0f172a', fontSize: 24, lineHeight: 1, fontWeight: 1000, letterSpacing: '-.04em' }
const statDetailStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 750, lineHeight: 1.45 }
const chipPalette: Record<Tone, { bg: string; soft: string; solid: string; color: string; border: string }> = {
  green: { bg: '#ecfdf5', soft: '#f0fdf4', solid: '#22c55e', color: '#047857', border: '#bbf7d0' },
  red: { bg: '#fef2f2', soft: '#fff5f5', solid: '#ef4444', color: '#b91c1c', border: '#fecaca' },
  blue: { bg: '#eff6ff', soft: '#f8fbff', solid: '#2563eb', color: '#1d4ed8', border: '#bfdbfe' },
  purple: { bg: '#f5f3ff', soft: '#fbfaff', solid: '#7c3aed', color: '#6d28d9', border: '#ddd6fe' },
  amber: { bg: '#fffbeb', soft: '#fffaf0', solid: '#f59e0b', color: '#b45309', border: '#fde68a' },
  slate: { bg: '#f8fafc', soft: '#ffffff', solid: '#64748b', color: '#475569', border: '#e2e8f0' },
}
const chipStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '7px 11px', fontSize: 11, fontWeight: 950, letterSpacing: '.04em', whiteSpace: 'nowrap' }
const tableShellStyle: CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 24, overflow: 'hidden', background: '#fff' }
const tableHeaderGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(160px,1.1fr) minmax(170px,1fr) 110px minmax(190px,1.25fr) 130px 130px 110px 120px 120px 120px minmax(280px,1.2fr)', gap: 12, padding: '14px 16px', background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 950, letterSpacing: '.08em', textTransform: 'uppercase' }
const tableBodyStyle: CSSProperties = { display: 'grid', gap: 0 }
const tableRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(160px,1.1fr) minmax(170px,1fr) 110px minmax(190px,1.25fr) 130px 130px 110px 120px 120px 120px minmax(280px,1.2fr)', gap: 12, padding: '16px', borderTop: '1px solid #e2e8f0', alignItems: 'start', background: 'linear-gradient(180deg,#fff,#fbfdff)' }
const rowPrimaryStyle: CSSProperties = { color: '#0f172a', fontSize: 14, fontWeight: 950, lineHeight: 1.35, overflowWrap: 'anywhere' }
const rowSecondaryStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 750, marginTop: 4, lineHeight: 1.4, overflowWrap: 'anywhere' }
const permissionSummaryStyleText: CSSProperties = { color: '#0f172a', fontSize: 13, fontWeight: 850, lineHeight: 1.45 }
const actionsGridStyle: CSSProperties = { display: 'grid', gap: 8 }
const rowActionButtonStyle: CSSProperties = { border: '1px solid #dbe3ee', borderRadius: 14, padding: '9px 11px', background: '#fff', color: '#0f172a', fontSize: 12, fontWeight: 900, textAlign: 'left', cursor: 'pointer' }
const rowActionButtonDangerStyle: CSSProperties = { ...rowActionButtonStyle, border: '1px solid #fecaca', background: '#fff5f5', color: '#b91c1c' }
const errorBannerStyle: CSSProperties = { display: 'grid', gap: 4, padding: 16, borderRadius: 22, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', marginBottom: 18 }
const emptyStateStyle: CSSProperties = { display: 'grid', gap: 8, justifyItems: 'start', padding: 18, borderRadius: 22, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 850 }
const primaryButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 16px', background: 'linear-gradient(135deg,#0f172a,#2563eb)', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const secondaryButtonStyle: CSSProperties = { border: '1px solid #cbd5e1', borderRadius: 16, padding: '12px 16px', background: '#fff', color: '#0f172a', fontWeight: 1000, cursor: 'pointer' }
const destructiveButtonStyle: CSSProperties = { border: 0, borderRadius: 16, padding: '12px 16px', background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', color: '#fff', fontWeight: 1000, cursor: 'pointer' }
const modalOverlayStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(10px)', padding: 20, display: 'grid', placeItems: 'center' }
const modalCardStyle: CSSProperties = { background: '#fff', borderRadius: 30, boxShadow: '0 32px 80px rgba(15,23,42,.28)', overflow: 'hidden', border: '1px solid #dbe3ee' }
const modalHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', padding: 24, borderBottom: '1px solid #e2e8f0' }
const modalEyebrowStyle: CSSProperties = { display: 'inline-flex', marginBottom: 8, color: '#3730a3', fontSize: 11, fontWeight: 950, letterSpacing: '.12em', textTransform: 'uppercase' }
const modalTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 1000, letterSpacing: '-.03em' }
const modalSubtitleStyle: CSSProperties = { margin: '6px 0 0', color: '#64748b', fontSize: 13, fontWeight: 750, lineHeight: 1.45 }
const modalCloseStyle: CSSProperties = { border: 0, borderRadius: 14, width: 42, height: 42, background: '#f8fafc', color: '#0f172a', fontSize: 24, lineHeight: 1, cursor: 'pointer' }
const modalBodyStyle: CSSProperties = { padding: 24 }
const modalFooterStyle: CSSProperties = { padding: 24, borderTop: '1px solid #e2e8f0', background: '#f8fafc' }
const modalFooterActionsStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }
const formGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }
const fieldStyle: CSSProperties = { display: 'grid', gap: 7 }
const fieldLabelStyle: CSSProperties = { color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: CSSProperties = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1', color: '#0f172a', boxSizing: 'border-box', background: '#fff', fontWeight: 800 }
const textareaStyle: CSSProperties = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1', color: '#0f172a', boxSizing: 'border-box', background: '#fff', fontWeight: 750, minHeight: 112, resize: 'vertical' }
const previewCardStyle: CSSProperties = { borderRadius: 18, padding: 16, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }
const previewTitleStyle: CSSProperties = { fontSize: 12, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }
const previewTextStyle: CSSProperties = { fontSize: 13, fontWeight: 850, lineHeight: 1.45 }
const permissionsGridStyle: CSSProperties = { gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const checkboxRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 850 }
const destructiveNoticeStyle: CSSProperties = { gridColumn: '1 / -1', display: 'grid', gap: 4, padding: 16, borderRadius: 18, background: '#fff5f5', border: '1px solid #fecaca', color: '#991b1b' }
const noticeCardStyle: CSSProperties = { gridColumn: '1 / -1', display: 'grid', gap: 4, padding: 16, borderRadius: 18, background: '#f8fbff', border: '1px solid #dbeafe', color: '#334155' }
const auditGridStyle: CSSProperties = { display: 'grid', gap: 12, maxHeight: '70vh', overflow: 'auto', paddingRight: 4 }
const auditRowStyle: CSSProperties = { display: 'grid', gap: 10, padding: 16, borderRadius: 20, border: '1px solid #e2e8f0', background: 'linear-gradient(180deg,#fff,#f8fafc)' }
const auditTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }
const auditEventStyle: CSSProperties = { color: '#0f172a', fontSize: 14, fontWeight: 950 }
const auditMetaStyle: CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 750, marginTop: 4 }
const auditBodyStyle: CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', color: '#475569', fontSize: 12, fontWeight: 750 }
const auditJsonStyle: CSSProperties = { margin: 0, padding: 14, borderRadius: 16, background: '#0f172a', color: '#e2e8f0', fontSize: 11, lineHeight: 1.6, overflow: 'auto' }
const emptyAuditStyle: CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#475569', fontWeight: 850 }
