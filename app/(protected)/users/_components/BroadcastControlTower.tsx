'use client'

import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

type Tone = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate'
type Priority = 'high' | 'medium' | 'low' | 'info'

type BroadcastRecord = {
  id: string
  title: string
  message: string
  priority: Priority
  state: string
  team: string
  targetCount: number
  deliveredCount: number
  acknowledgedCount: number
  commentCount: number
  followUpCount: number
  closedCount: number
  delayed: boolean
  dueAt: string
  createdAt: string
  updatedAt: string
  raw: Record<string, unknown>
}

type BroadcastApiPayload = {
  ok?: boolean
  data?: unknown
  broadcasts?: unknown
  memos?: unknown
  receipts?: unknown
  items?: unknown
  error?: string
}

const API_PATH = '/api/users/broadcast-control'

const priorityTone: Record<Priority, Tone> = {
  high: 'red',
  medium: 'amber',
  low: 'blue',
  info: 'green',
}

const priorityLabel: Record<Priority, string> = {
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
  info: 'INFO',
}

const palette: Record<Tone, { bg: string; border: string; color: string; solid: string; soft: string }> = {
  blue: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', solid: '#2563eb', soft: '#f8fbff' },
  green: { bg: '#ecfdf5', border: '#bbf7d0', color: '#047857', solid: '#22c55e', soft: '#f0fdf4' },
  red: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', solid: '#ef4444', soft: '#fff5f5' },
  amber: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', solid: '#f59e0b', soft: '#fffaf0' },
  purple: { bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed', solid: '#8b5cf6', soft: '#fbfaff' },
  slate: { bg: '#f8fafc', border: '#e2e8f0', color: '#475569', solid: '#64748b', soft: '#ffffff' },
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function text(value: unknown, fallback = '') {
  const clean = String(value ?? '').trim()
  return clean || fallback
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return 0
}

function dateValue(...values: unknown[]) {
  for (const value of values) {
    const clean = String(value ?? '').trim()
    if (clean) return clean
  }
  return ''
}

function normalizePriority(value: unknown): Priority {
  const clean = String(value ?? '').toLowerCase()
  if (clean.includes('high') || clean.includes('urgent') || clean.includes('critical')) return 'high'
  if (clean.includes('medium') || clean.includes('normal')) return 'medium'
  if (clean.includes('low')) return 'low'
  return 'info'
}

function normalizeState(value: unknown) {
  const clean = String(value ?? '').toLowerCase()
  if (clean.includes('closed') || clean.includes('completed')) return 'closed'
  if (clean.includes('delayed') || clean.includes('late')) return 'delayed'
  if (clean.includes('pending')) return 'pending'
  if (clean.includes('ack')) return 'acknowledged'
  if (clean.includes('draft')) return 'draft'
  return clean || 'open'
}

function readRecord(raw: unknown, index: number): BroadcastRecord {
  const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const title =
    text(row.title) ||
    text(row.subject) ||
    text(row.name) ||
    text(row.memo_title) ||
    `Broadcast ${index + 1}`

  const priority = normalizePriority(row.priority || row.level || row.urgency)
  const state = normalizeState(row.state || row.status || row.broadcast_state || row.follow_up_status)
  const targetCount = numberValue(row.target_count, row.targets, row.recipient_count, row.total_recipients)
  const deliveredCount = numberValue(row.delivered_count, row.delivered, row.received_count)
  const acknowledgedCount = numberValue(row.acknowledged_count, row.acknowledged, row.ack_count)
  const commentCount = numberValue(row.comment_count, row.comments_count, row.open_comments)
  const followUpCount = numberValue(row.follow_up_count, row.followups, row.reminder_count)
  const closedCount = numberValue(row.closed_count, row.closed, row.completed_count)

  return {
    id: text(row.id, `broadcast-${index + 1}`),
    title,
    message: text(row.message || row.body || row.description || row.content, 'No message body provided.'),
    priority,
    state,
    team: text(row.team || row.owner_team || row.department || row.created_by_role, 'Operations'),
    targetCount,
    deliveredCount,
    acknowledgedCount,
    commentCount,
    followUpCount,
    closedCount,
    delayed: Boolean(row.delayed || state === 'delayed' || String(row.sla_status || '').toLowerCase().includes('delay')),
    dueAt: dateValue(row.due_at, row.deadline_at, row.follow_up_at),
    createdAt: dateValue(row.created_at, row.createdAt, row.inserted_at, new Date().toISOString()),
    updatedAt: dateValue(row.updated_at, row.updatedAt, row.modified_at, row.created_at),
    raw: row,
  }
}

function extractRecords(payload: BroadcastApiPayload): BroadcastRecord[] {
  const data = payload?.data && typeof payload.data === 'object' ? (payload.data as Record<string, unknown>) : null
  const candidates = [
    payload?.broadcasts,
    payload?.memos,
    payload?.items,
    data?.['broadcasts'],
    data?.['memos'],
    data?.['items'],
    data?.['records'],
  ]

  const firstArray = candidates.find((item) => Array.isArray(item))
  const baseRecords = asArray(firstArray)
  return baseRecords.map(readRecord)
}

function formatDate(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function percent(value: number, total: number) {
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)))
}

function dueLabel(value: string, delayed: boolean) {
  if (delayed) return 'Delayed · SLA attention'
  if (!value) return 'No due date'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return formatDate(value)
  const diff = d.getTime() - Date.now()
  if (diff < 0) return 'Overdue'
  const hours = Math.floor(diff / 36e5)
  const minutes = Math.floor((diff % 36e5) / 6e4)
  return `Due in ${hours}h ${minutes}m`
}

function sampleTrend(seed: number) {
  const values = [18, 28, 22, 32, 26, 38, 30].map((value, index) => Math.max(6, value + ((seed + index) % 7) * 2))
  return values.map((v, i) => `${i * 14},${44 - v}`).join(' ')
}

export default function BroadcastControlTower() {
  const [records, setRecords] = useState<BroadcastRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

  const loadBroadcasts = useCallback(async () => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(API_PATH, { cache: 'no-store' })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json?.error || `Broadcast sync failed: ${response.status}`)
      setRecords(extractRecords(json))
      setMessage('Broadcast control synced from server.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Broadcast sync failed.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBroadcasts()
  }, [loadBroadcasts])

  const stats = useMemo(() => {
    const total = records.reduce((sum, item) => sum + Math.max(1, item.targetCount || 1), 0)
    const totalBroadcasts = records.length
    const delivered = records.reduce((sum, item) => sum + item.deliveredCount, 0)
    const acknowledged = records.reduce((sum, item) => sum + item.acknowledgedCount, 0)
    const comments = records.reduce((sum, item) => sum + item.commentCount, 0)
    const followUps = records.reduce((sum, item) => sum + item.followUpCount, 0)
    const closed = records.reduce((sum, item) => sum + item.closedCount, 0)
    const delayed = records.filter((item) => item.delayed || item.state === 'delayed').length
    const activeCampaigns = records.filter((item) => !['closed', 'completed'].includes(item.state)).length
    const completionRate = percent(closed || acknowledged, total || totalBroadcasts)
    const responseRate = percent(acknowledged + comments, total || totalBroadcasts)
    const slaCompliance = Math.max(0, Math.min(100, 100 - Math.round((delayed / Math.max(1, totalBroadcasts)) * 100)))
    const health = Math.max(0, Math.min(100, Math.round((slaCompliance + responseRate + completionRate) / 3)))

    return {
      total,
      totalBroadcasts,
      activeCampaigns,
      delivered,
      acknowledged,
      comments,
      followUps,
      closed,
      pending: Math.max(0, total - acknowledged),
      delayed,
      completionRate,
      responseRate,
      slaCompliance,
      health,
      escalations: records.filter((item) => item.priority === 'high' || item.delayed).length,
    }
  }, [records])

  const teams = useMemo(() => Array.from(new Set(records.map((item) => item.team).filter(Boolean))).sort(), [records])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return records.filter((item) => {
      const queryOk = !q || `${item.title} ${item.message} ${item.team} ${item.state} ${item.priority}`.toLowerCase().includes(q)
      const stateOk = stateFilter === 'all' || item.state === stateFilter
      const priorityOk = priorityFilter === 'all' || item.priority === priorityFilter
      const teamOk = teamFilter === 'all' || item.team === teamFilter
      return queryOk && stateOk && priorityOk && teamOk
    })
  }, [records, query, stateFilter, priorityFilter, teamFilter])

  async function createBroadcast(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      title: text(form.get('title'), 'Broadcast message'),
      message: text(form.get('message'), ''),
      priority: text(form.get('priority'), 'medium'),
      team: text(form.get('team'), 'Operations'),
      target_scope: text(form.get('target_scope'), 'all_users'),
      status: 'open',
    }

    setActionBusy(true)
    setMessage('')
    try {
      const response = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json?.error || `Broadcast creation failed: ${response.status}`)
      setModalOpen(false)
      await loadBroadcasts()
      setMessage('Broadcast message created and synced.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Broadcast creation failed.')
    } finally {
      setActionBusy(false)
    }
  }

  return (
    <section style={towerShellStyle}>
      <style>{`
        @keyframes workspacePulseGreen {
          0%, 100% { transform: scale(1); opacity: 1; filter: brightness(1); }
          50% { transform: scale(1.18); opacity: .72; filter: brightness(1.22); }
        }
        @keyframes workspacePulseAmber {
          0%, 100% { transform: scale(1); opacity: 1; filter: brightness(1); }
          50% { transform: scale(1.18); opacity: .7; filter: brightness(1.25); }
        }
        @keyframes workspacePulseRed {
          0%, 100% { transform: scale(1); opacity: 1; filter: brightness(1); }
          50% { transform: scale(1.22); opacity: .66; filter: brightness(1.35); }
        }
        @keyframes workspacePulseBlue {
          0%, 100% { transform: scale(1); opacity: 1; filter: brightness(1); }
          50% { transform: scale(1.14); opacity: .72; filter: brightness(1.2); }
        }
        @keyframes workspacePulsePurple {
          0%, 100% { transform: scale(1); opacity: 1; filter: brightness(1); }
          50% { transform: scale(1.14); opacity: .72; filter: brightness(1.2); }
        }
        @keyframes workspacePulseSlate {
          0%, 100% { transform: scale(1); opacity: 1; filter: brightness(1); }
          50% { transform: scale(1.12); opacity: .72; filter: brightness(1.15); }
        }
      `}</style>

      <section style={workspaceHeroStyle}>
        <div style={workspaceHeroLeftStyle}>
          <div style={workspaceHeroIconStyle}>👥</div>
          <div style={{ minWidth: 0 }}>
            <div style={workspaceEyebrowStyle}>User Workspace Command Center</div>
            <h1 style={workspaceTitleStyle}>Administration, access, broadcasts and workforce signals</h1>
            <p style={workspaceSubtitleStyle}>
              A live operational layer for user governance, message execution, attendance visibility and access-control readiness.
            </p>

            <div style={workspaceChipRowStyle}>
              <span style={workspaceChipGreenStyle}>● Workspace live</span>
              <span style={workspaceChipBlueStyle}>▣ Server synced</span>
              <span style={workspaceChipPurpleStyle}>✦ Users module</span>
              <span style={stats.delayed ? workspaceChipRedStyle : workspaceChipGreenStyle}>
                {stats.delayed ? `⚠ ${stats.delayed} delayed broadcast` : '🛡 SLA stable'}
              </span>
            </div>
          </div>
        </div>

        <div style={workspaceHeroRightStyle}>
          <div style={workspaceSignalCardStyle}>
            <div style={workspaceSignalHeaderStyle}>
              <span style={workspaceSignalMainOrbStyle}>📡</span>
              <div>
                <strong>Workspace signal matrix</strong>
                <small>{loading ? 'Refreshing live state…' : 'Server synced · live governance layer'}</small>
              </div>
              <em>{stats.health}/100</em>
            </div>

            <div style={workspaceSignalBarsStyle}>
              <span style={{ width: `${stats.slaCompliance}%`, background: '#22c55e', height: 9, borderRadius: 999 }} />
              <span style={{ width: `${stats.responseRate}%`, background: '#f59e0b', height: 9, borderRadius: 999 }} />
              <span style={{ width: `${Math.max(6, stats.delayed ? percent(stats.delayed, Math.max(1, stats.totalBroadcasts)) : 4)}%`, background: '#ef4444', height: 9, borderRadius: 999 }} />
            </div>

            <div style={workspaceSignalGridStyle}>
              <WorkspaceSignal
                tone="green"
                icon="●"
                label="Access governance"
                value={stats.slaCompliance >= 90 ? 'Stable' : 'Monitoring'}
                pulse
              />
              <WorkspaceSignal
                tone={stats.delayed ? 'red' : 'green'}
                icon="●"
                label="Broadcast SLA"
                value={stats.delayed ? `${stats.delayed} delayed` : 'Protected'}
                pulse
              />
              <WorkspaceSignal
                tone={stats.pending > 0 ? 'amber' : 'green'}
                icon="●"
                label="Follow-up queue"
                value={stats.pending > 0 ? `${stats.pending} pending` : 'Clear'}
                pulse
              />
              <WorkspaceSignal
                tone={loading ? 'amber' : 'green'}
                icon="●"
                label="Backend sync"
                value={loading ? 'Refreshing' : 'Online'}
                pulse
              />
            </div>
          </div>
        </div>

        <div style={workspaceKpiStripStyle}>
          <WorkspaceHeroKpi icon="👥" label="Targets" value={String(stats.total)} detail="Live recipient scope" tone="blue" />
          <WorkspaceHeroKpi icon="📣" label="Broadcasts" value={String(stats.totalBroadcasts)} detail="Synced messages" tone="purple" />
          <WorkspaceHeroKpi icon="✅" label="Acknowledged" value={String(stats.acknowledged)} detail={`${stats.responseRate}% response`} tone="green" />
          <WorkspaceHeroKpi icon="⏱" label="Pending" value={String(stats.pending)} detail="Needs follow-up" tone="amber" />
          <WorkspaceHeroKpi icon="⚠" label="Delayed" value={String(stats.delayed)} detail="SLA watch" tone={stats.delayed ? 'red' : 'green'} />
          <WorkspaceHeroKpi icon="🛡" label="SLA" value={`${stats.slaCompliance}%`} detail="Compliance score" tone={stats.slaCompliance >= 90 ? 'green' : stats.slaCompliance >= 70 ? 'amber' : 'red'} />
        </div>
      </section>

      <div style={heroRowStyle}>
        <div style={heroIdentityStyle}>
          <div style={towerIconStyle}>📡</div>
          <div>
            <div style={tagLineStyle}>Broadcast Control Tower</div>
            <h2 style={titleStyle}>User messages, receipts and follow-up</h2>
            <p style={subtitleStyle}>
              Manage user communications with precision. Track messages, receipts, acknowledgements, reminders and follow-up execution across OpsOS.
            </p>
            <div style={chipRowStyle}>
              <StatusChip tone="green" label="Live" icon="●" />
              <StatusChip tone="blue" label="Synced" icon="▣" />
              <StatusChip tone="red" label="High Priority" icon="↑" />
              <StatusChip tone="amber" label="Follow-up Active" icon="◷" />
              <StatusChip tone="green" label="SLA Healthy" icon="🛡" />
            </div>

            <div style={heroCommandStripStyle}>
              <div style={heroCommandItemStyle}>
                <span>📨</span>
                <strong>{stats.total}</strong>
                <small>Total targeted receipts</small>
              </div>
              <div style={heroCommandItemStyle}>
                <span>✅</span>
                <strong>{stats.acknowledged}</strong>
                <small>Acknowledged responses</small>
              </div>
              <div style={heroCommandItemStyle}>
                <span>⏱</span>
                <strong>{stats.responseRate}%</strong>
                <small>Response velocity</small>
              </div>
              <div style={heroCommandItemStyle}>
                <span>🛡</span>
                <strong>{stats.slaCompliance}%</strong>
                <small>SLA protection</small>
              </div>
            </div>
          </div>
        </div>

        <div style={heroRightStackStyle}>
          <div style={commandHealthCardStyle}>
            <div style={commandHealthTopStyle}>
              <span style={commandOrbStyle}>📡</span>
              <div>
                <strong>Command Signal</strong>
                <small>{loading ? 'Syncing live data...' : 'Server synced'}</small>
              </div>
              <em>{stats.health}/100</em>
            </div>
            <div style={commandBarsStyle}>
              <span style={{ width: `${stats.completionRate}%`, background: '#22c55e', height: 9, borderRadius: 999 }} />
              <span style={{ width: `${stats.responseRate}%`, background: '#2563eb', height: 9, borderRadius: 999 }} />
              <span style={{ width: `${stats.slaCompliance}%`, background: '#8b5cf6', height: 9, borderRadius: 999 }} />
            </div>
            <div style={commandHealthMetaStyle}>
              <span>Completion {stats.completionRate}%</span>
              <span>Response {stats.responseRate}%</span>
              <span>SLA {stats.slaCompliance}%</span>
            </div>
          </div>

          <div style={heroActionsStyle}>
            <button type="button" onClick={() => setModalOpen(true)} style={orangeButtonStyle}>📣 Broadcast message</button>
            <button type="button" onClick={() => setModalOpen(true)} style={blueButtonStyle}>🚀 Launch campaign</button>
            <button type="button" onClick={() => window.print()} style={lightButtonStyle}>⇩ Export receipts</button>
            <button type="button" onClick={loadBroadcasts} style={lightButtonStyle}>{loading ? '⏳ Syncing...' : '↻ Refresh sync'}</button>
          </div>
        </div>
      </div>

      {message ? <div style={message.includes('failed') ? errorBannerStyle : successBannerStyle}>{message}</div> : null}

      <div style={kpiGridStyle}>
        <KpiCard icon="✈" label="Total Broadcasts" value={String(stats.totalBroadcasts)} detail="Synced campaigns" tone="blue" trendSeed={1} />
        <KpiCard icon="🎛" label="Active Campaigns" value={String(stats.activeCampaigns)} detail="Open execution flows" tone="purple" trendSeed={2} />
        <KpiCard icon="✓" label="Acknowledged" value={String(stats.acknowledged)} detail={`${percent(stats.acknowledged, stats.total)}% of targets`} tone="green" trendSeed={3} />
        <KpiCard icon="◷" label="Pending" value={String(stats.pending)} detail="Awaiting action" tone="amber" trendSeed={4} />
        <KpiCard icon="💬" label="Open Comments" value={String(stats.comments)} detail="Needs response" tone="blue" trendSeed={5} />
        <KpiCard icon="⚠" label="Delayed" value={String(stats.delayed)} detail="SLA attention" tone="red" trendSeed={6} />
        <RingKpi label="Completion Rate" value={stats.completionRate} tone="green" detail="Closed / acknowledged" />
        <RingKpi label="Response Rate" value={stats.responseRate} tone="blue" detail="Replies + acknowledgements" />
        <KpiCard icon="⌁" label="Escalations" value={String(stats.escalations)} detail="High-risk queues" tone="purple" trendSeed={7} />
        <RingKpi label="SLA Compliance" value={stats.slaCompliance} tone={stats.slaCompliance >= 90 ? 'green' : stats.slaCompliance >= 70 ? 'amber' : 'red'} detail="Target ≥ 95%" />
      </div>

      <div style={deepGridStyle}>
        <Panel title="Broadcast Health" subtitle="System communications at a glance">
          <div style={healthLayoutStyle}>
            <Gauge value={stats.health} />
            <div style={healthListStyle}>
              <HealthRow tone="green" label="Healthy" value={Math.max(0, stats.totalBroadcasts - stats.delayed)} percent={percent(Math.max(0, stats.totalBroadcasts - stats.delayed), stats.totalBroadcasts)} />
              <HealthRow tone="amber" label="Warning" value={stats.pending} percent={percent(stats.pending, stats.total)} />
              <HealthRow tone="red" label="Critical" value={stats.delayed} percent={percent(stats.delayed, stats.totalBroadcasts)} />
              <HealthRow tone="slate" label="Unknown" value={records.length ? 0 : 1} percent={records.length ? 0 : 100} />
            </div>
          </div>
        </Panel>

        <Panel title="Priority Distribution" subtitle="By message priority level">
          <PriorityDistribution records={records} />
        </Panel>

        <Panel title="Team Follow-up Load" subtitle="Workload by team">
          <TeamLoad records={records} />
        </Panel>

        <Panel title="Message Execution Activity" subtitle="Live feed of latest actions">
          <Funnel stats={stats} />
        </Panel>

        <Panel title="Quick Insights" subtitle="Live operational recommendations">
          <InsightList stats={stats} records={records} />
        </Panel>
      </div>

      <div style={filterBarStyle}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search broadcasts, situations or templates..." style={searchInputStyle} />
        <select value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} style={selectStyle}>
          <option value="all">All states</option>
          <option value="open">Open broadcasts</option>
          <option value="pending">Pending</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="delayed">Delayed</option>
          <option value="closed">Closed</option>
        </select>
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} style={selectStyle}>
          <option value="all">All priorities</option>
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
          <option value="info">Info</option>
        </select>
        <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} style={selectStyle}>
          <option value="all">All teams</option>
          {teams.map((team) => <option key={team} value={team}>{team}</option>)}
        </select>
        <button type="button" onClick={() => { setQuery(''); setStateFilter('all'); setPriorityFilter('all'); setTeamFilter('all') }} style={lightButtonStyle}>↻ Clear filters</button>
      </div>

      <div style={broadcastListHeaderStyle}>
        <div>
          <h3 style={sectionTitleStyle}>Active & Recent Broadcasts</h3>
          <p style={sectionSubtitleStyle}>Showing {filtered.length} of {records.length} synced broadcast records.</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} style={createDashedButtonStyle}>＋ Create new broadcast</button>
      </div>

      {filtered.length ? (
        <div style={broadcastCardsStyle}>
          {filtered.slice(0, 12).map((record) => (
            <BroadcastCard key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <div style={emptyStateStyle}>
          <div style={emptyIconStyle}>📭</div>
          <strong>No broadcast card matches the current filters.</strong>
          <span>Change filters, refresh sync, or create a new broadcast message.</span>
          <button type="button" onClick={() => setModalOpen(true)} style={createDashedButtonStyle}>＋ Launch a broadcast</button>
        </div>
      )}

      {modalOpen ? (
        <div style={modalOverlayStyle}>
          <form onSubmit={createBroadcast} style={modalStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={tagLineStyle}>Broadcast execution</div>
                <h3 style={modalTitleStyle}>Create synced broadcast message</h3>
                <p style={subtitleStyle}>This writes through the server API. No local storage is used.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} style={closeButtonStyle}>×</button>
            </div>

            <label style={fieldStyle}>
              <span>Broadcast title</span>
              <input name="title" required placeholder="System Maintenance Alert" style={inputStyle} />
            </label>

            <label style={fieldStyle}>
              <span>Message</span>
              <textarea name="message" required placeholder="Write the broadcast message..." style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
            </label>

            <div style={modalGridStyle}>
              <label style={fieldStyle}>
                <span>Priority</span>
                <select name="priority" defaultValue="medium" style={inputStyle}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="info">Info</option>
                </select>
              </label>

              <label style={fieldStyle}>
                <span>Owner team</span>
                <input name="team" defaultValue="Operations" style={inputStyle} />
              </label>

              <label style={fieldStyle}>
                <span>Target scope</span>
                <select name="target_scope" defaultValue="all_users" style={inputStyle}>
                  <option value="all_users">All users</option>
                  <option value="active_users">Active users</option>
                  <option value="managers">Managers</option>
                  <option value="field_ops">Field operations</option>
                </select>
              </label>
            </div>

            <div style={modalActionsStyle}>
              <button type="button" onClick={() => setModalOpen(false)} style={lightButtonStyle}>Cancel</button>
              <button type="submit" disabled={actionBusy} style={blueButtonStyle}>{actionBusy ? 'Sending...' : 'Send broadcast'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}

function WorkspaceSignal({
  tone,
  icon,
  label,
  value,
  pulse,
}: {
  tone: Tone
  icon: string
  label: string
  value: string
  pulse?: boolean
}) {
  const p = palette[tone]
  return (
    <div style={{ ...workspaceSignalItemStyle, borderColor: p.border, background: p.soft }}>
      <span
        style={{
          ...workspaceSignalDotStyle,
          background: p.solid,
          boxShadow: `0 0 0 6px ${p.bg}, 0 0 22px ${p.solid}`,
          animation: pulse ? `workspacePulse${tone.charAt(0).toUpperCase()}${tone.slice(1)} 1.35s ease-in-out infinite` : undefined,
        }}
      >
        {icon}
      </span>
      <div>
        <strong style={{ color: p.color }}>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  )
}

function WorkspaceHeroKpi({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: string
  label: string
  value: string
  detail: string
  tone: Tone
}) {
  const p = palette[tone]
  return (
    <div style={{ ...workspaceHeroKpiStyle, borderColor: p.border, background: `linear-gradient(135deg,#ffffff,${p.soft})` }}>
      <span style={{ ...workspaceHeroKpiIconStyle, background: p.bg, color: p.color }}>{icon}</span>
      <div>
        <small style={workspaceHeroKpiLabelStyle}>{label}</small>
        <strong style={workspaceHeroKpiValueStyle}>{value}</strong>
        <em style={workspaceHeroKpiDetailStyle}>{detail}</em>
      </div>
    </div>
  )
}

function StatusChip({ tone, label, icon }: { tone: Tone; label: string; icon: string }) {
  const p = palette[tone]
  return <span style={{ ...chipStyle, background: p.bg, color: p.color, borderColor: p.border }}>{icon} {label}</span>
}

function KpiCard({ icon, label, value, detail, tone, trendSeed }: { icon: string; label: string; value: string; detail: string; tone: Tone; trendSeed: number }) {
  const p = palette[tone]
  return (
    <div style={kpiCardStyle}>
      <div style={{ ...kpiIconStyle, background: p.bg, color: p.color }}>{icon}</div>
      <div style={kpiLabelStyle}>{label}</div>
      <strong style={kpiValueStyle}>{value}</strong>
      <div style={kpiDetailStyle}>{detail}</div>
      <svg viewBox="0 0 100 50" style={sparkStyle}>
        <polyline fill="none" stroke={p.solid} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={sampleTrend(trendSeed)} />
      </svg>
    </div>
  )
}

function RingKpi({ label, value, tone, detail }: { label: string; value: number; tone: Tone; detail: string }) {
  const p = palette[tone]
  return (
    <div style={ringCardStyle}>
      <div style={{ ...ringStyle, background: `conic-gradient(${p.solid} ${value * 3.6}deg,#e2e8f0 0deg)` }}>
        <div style={ringInnerStyle}>{value}%</div>
      </div>
      <div>
        <div style={kpiLabelStyle}>{label}</div>
        <strong style={ringValueStyle}>{value}%</strong>
        <div style={kpiDetailStyle}>{detail}</div>
      </div>
    </div>
  )
}

function Panel({ title, subtitle, children, wide }: { title: string; subtitle: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section style={wide ? { ...panelStyle, gridColumn: 'span 2' } : panelStyle}>
      <div style={panelHeaderStyle}>
        <div>
          <h3 style={panelTitleStyle}>{title}</h3>
          <p style={panelSubtitleStyle}>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Gauge({ value }: { value: number }) {
  const color = value >= 85 ? '#22c55e' : value >= 65 ? '#f59e0b' : '#ef4444'
  return (
    <div style={gaugeWrapStyle}>
      <div style={{ ...gaugeStyle, background: `conic-gradient(${color} ${value * 3.6}deg,#e2e8f0 0deg)` }}>
        <div style={gaugeInnerStyle}>
          <strong>{value}</strong>
          <span>of 100</span>
        </div>
      </div>
      <span style={excellentStyle}>🛡 {value >= 85 ? 'Excellent' : value >= 65 ? 'Monitor' : 'Critical'}</span>
    </div>
  )
}

function HealthRow({ tone, label, value, percent }: { tone: Tone; label: string; value: number; percent: number }) {
  const p = palette[tone]
  return (
    <div style={healthRowStyle}>
      <span style={{ color: p.color }}>●</span>
      <strong>{label}</strong>
      <span>{value} ({percent}%)</span>
    </div>
  )
}

function PriorityDistribution({ records }: { records: BroadcastRecord[] }) {
  const counts = {
    high: records.filter((item) => item.priority === 'high').length,
    medium: records.filter((item) => item.priority === 'medium').length,
    low: records.filter((item) => item.priority === 'low').length,
    info: records.filter((item) => item.priority === 'info').length,
  }
  const total = Math.max(1, records.length)
  return (
    <div style={priorityLayoutStyle}>
      <div style={donutStyle}>
        <div style={donutInnerStyle}>
          <strong>{records.length}</strong>
          <span>Total</span>
        </div>
      </div>
      <div style={priorityLegendStyle}>
        {(['high', 'medium', 'low', 'info'] as Priority[]).map((priority) => (
          <HealthRow key={priority} tone={priorityTone[priority]} label={priorityLabel[priority]} value={counts[priority]} percent={percent(counts[priority], total)} />
        ))}
      </div>
    </div>
  )
}

function TeamLoad({ records }: { records: BroadcastRecord[] }) {
  const rows = Array.from(new Set(records.map((item) => item.team))).map((team) => {
    const teamRecords = records.filter((item) => item.team === team)
    const load = teamRecords.reduce((sum, item) => sum + item.followUpCount + (item.delayed ? 3 : 0), 0)
    return { team, load }
  }).sort((a, b) => b.load - a.load).slice(0, 5)

  if (!rows.length) return <div style={emptyTinyStyle}>No team workload yet.</div>

  const max = Math.max(...rows.map((row) => row.load), 1)
  return (
    <div style={teamListStyle}>
      {rows.map((row) => {
        const tone: Tone = row.load >= 8 ? 'red' : row.load >= 4 ? 'amber' : 'green'
        const p = palette[tone]
        return (
          <div key={row.team} style={teamRowStyle}>
            <span>👥 {row.team}</span>
            <div style={teamTrackStyle}><div style={{ width: `${percent(row.load, max)}%`, background: p.solid, height: '100%', borderRadius: 999 }} /></div>
            <strong style={{ color: p.color }}>{row.load}</strong>
          </div>
        )
      })}
    </div>
  )
}

function Funnel({ stats }: { stats: ReturnType<typeof BroadcastControlTowerStatsShape> }) {
  const stages = [
    ['✈', 'Sent', stats.total, 100, 'blue'],
    ['✉', 'Delivered', stats.delivered, percent(stats.delivered, stats.total), 'green'],
    ['✓', 'Acknowledged', stats.acknowledged, percent(stats.acknowledged, stats.total), 'blue'],
    ['🔔', 'Follow-up', stats.followUps, percent(stats.followUps, stats.total), 'amber'],
    ['▣', 'Closed', stats.closed, percent(stats.closed, stats.total), 'purple'],
  ] as const

  return (
    <div style={funnelStyle}>
      {stages.map(([icon, label, value, pct, tone], index) => {
        const p = palette[tone]
        return (
          <div key={label} style={funnelStageStyle}>
            <div style={{ ...funnelIconStyle, background: p.bg, color: p.color }}>{icon}</div>
            <strong>{label}</strong>
            <span>{value}</span>
            <small>{pct}%</small>
            <div style={trackStyle}><div style={{ width: `${pct}%`, background: p.solid, height: '100%', borderRadius: 999 }} /></div>
            {index < stages.length - 1 ? <em>→</em> : null}
          </div>
        )
      })}
    </div>
  )
}

function BroadcastControlTowerStatsShape() {
  return {
    total: 0,
    delivered: 0,
    acknowledged: 0,
    followUps: 0,
    closed: 0,
  }
}

function InsightList({ stats, records }: { stats: ReturnType<typeof BroadcastControlTowerStatsShape> & { responseRate: number; delayed: number }; records: BroadcastRecord[] }) {
  const topTeam = records[0]?.team || '—'
  return (
    <div style={insightListStyle}>
      <Insight icon="⏱" label="Peak Response Time" value={stats.responseRate >= 70 ? 'Healthy' : 'Needs push'} />
      <Insight icon="💬" label="Open follow-up risk" value={`${stats.delayed} delayed`} />
      <Insight icon="🏆" label="Most active team" value={topTeam} />
      <Insight icon="📈" label="Best conversion" value={`${stats.responseRate}% response`} />
      <button type="button" style={viewAnalyticsStyle}>View full analytics →</button>
    </div>
  )
}

function Insight({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={insightStyle}>
      <span>{icon}</span>
      <strong>{label}</strong>
      <em>{value}</em>
    </div>
  )
}

function BroadcastCard({ record }: { record: BroadcastRecord }) {
  const tone = priorityTone[record.priority]
  const p = palette[tone]
  const target = Math.max(1, record.targetCount || record.deliveredCount || record.acknowledgedCount || 1)
  const completion = percent(record.acknowledgedCount || record.closedCount, target)

  return (
    <article
      style={{
        ...broadcastCardStyle,
        borderLeftWidth: 4,
        borderLeftStyle: 'solid',
        borderLeftColor: p.solid,
      }}
    >
      <div style={broadcastCardTopStyle}>
        <span style={{ ...smallPillStyle, background: p.bg, color: p.color, borderColor: p.border }}>{priorityLabel[record.priority]}</span>
        <span style={stateStyle}>{record.state}</span>
      </div>
      <h4 style={broadcastTitleStyle}>{record.title}</h4>
      <p style={broadcastTeamStyle}>{record.team}</p>
      <div style={cardStatsStyle}>
        <span>✈ {target}</span>
        <span>✓ {record.acknowledgedCount}</span>
        <span>💬 {record.commentCount}</span>
        <strong>{completion}%</strong>
      </div>
      <div style={trackStyle}><div style={{ width: `${completion}%`, background: p.solid, height: '100%', borderRadius: 999 }} /></div>
      <div style={{ ...dueStyle, color: record.delayed ? '#dc2626' : '#475569' }}>◷ {dueLabel(record.dueAt, record.delayed)}</div>
    </article>
  )
}

const towerShellStyle: CSSProperties = { display: 'grid', gap: 22, padding: 22, borderRadius: 34, border: '1px solid #dbeafe', background: 'radial-gradient(circle at 7% 0%,#eff6ff 0,#ffffff 32%,#f8fbff 100%)', boxShadow: '0 34px 90px rgba(15,23,42,.105)', overflow: 'hidden' }
const heroRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(520px,.8fr)', gap: 22, alignItems: 'stretch' }
const heroIdentityStyle: CSSProperties = { display: 'flex', gap: 18, alignItems: 'flex-start', minWidth: 0, padding: 22, borderRadius: 30, border: '1px solid #dbeafe', background: 'linear-gradient(135deg,#ffffff 0%,#f8fbff 58%,#eff6ff 100%)', boxShadow: '0 22px 60px rgba(37,99,235,.09)' }
const towerIconStyle: CSSProperties = { width: 68, height: 68, borderRadius: 24, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#0f172a,#2563eb)', color: '#fff', border: '1px solid #bfdbfe', fontSize: 28, flexShrink: 0, boxShadow: '0 22px 44px rgba(37,99,235,.24)' }
const tagLineStyle: CSSProperties = { color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.14em', fontWeight: 1000, fontSize: 11 }
const titleStyle: CSSProperties = { margin: '6px 0 0', color: '#0f172a', fontSize: 34, fontWeight: 1000, letterSpacing: '-.055em', lineHeight: 1.02 }
const subtitleStyle: CSSProperties = { margin: '9px 0 0', color: '#64748b', fontSize: 14, fontWeight: 760, lineHeight: 1.5, maxWidth: 880 }
const chipRowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 15 }
const chipStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 1000, boxShadow: '0 10px 22px rgba(15,23,42,.035)' }
const heroActionsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const orangeButtonStyle: CSSProperties = { border: 0, borderRadius: 14, padding: '13px 18px', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', fontWeight: 1000, cursor: 'pointer', boxShadow: '0 18px 34px rgba(249,115,22,.22)' }
const blueButtonStyle: CSSProperties = { border: 0, borderRadius: 14, padding: '13px 18px', background: 'linear-gradient(135deg,#2563eb,#0f172a)', color: '#fff', fontWeight: 1000, cursor: 'pointer', boxShadow: '0 18px 34px rgba(37,99,235,.20)' }
const lightButtonStyle: CSSProperties = { border: '1px solid #dbe3ee', borderRadius: 14, padding: '12px 16px', background: '#fff', color: '#0f172a', fontWeight: 950, cursor: 'pointer' }
const successBannerStyle: CSSProperties = { border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#047857', borderRadius: 16, padding: 12, fontSize: 12, fontWeight: 850 }
const errorBannerStyle: CSSProperties = { border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', borderRadius: 16, padding: 12, fontSize: 12, fontWeight: 850 }
const kpiGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 13 }
const kpiCardStyle: CSSProperties = { position: 'relative', minHeight: 138, borderRadius: 24, border: '1px solid #dbeafe', background: 'linear-gradient(135deg,#ffffff,#fbfdff)', padding: 17, overflow: 'hidden', boxShadow: '0 20px 48px rgba(15,23,42,.065)' }
const kpiIconStyle: CSSProperties = { width: 34, height: 34, borderRadius: 14, display: 'grid', placeItems: 'center', fontWeight: 1000 }
const kpiLabelStyle: CSSProperties = { marginTop: 9, color: '#64748b', fontSize: 11, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '.06em' }
const kpiValueStyle: CSSProperties = { display: 'block', marginTop: 4, color: '#0f172a', fontSize: 23, fontWeight: 1000, letterSpacing: '-.04em' }
const kpiDetailStyle: CSSProperties = { marginTop: 5, color: '#64748b', fontSize: 11, fontWeight: 750 }
const sparkStyle: CSSProperties = { position: 'absolute', right: 10, bottom: 10, width: 60, height: 32 }
const ringCardStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '62px 1fr', gap: 14, alignItems: 'center', minHeight: 138, borderRadius: 24, border: '1px solid #dbeafe', background: 'linear-gradient(135deg,#ffffff,#fbfdff)', padding: 17, boxShadow: '0 20px 48px rgba(15,23,42,.065)' }
const ringStyle: CSSProperties = { width: 62, height: 62, borderRadius: '50%', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 0 1px rgba(15,23,42,.04)' }
const ringInnerStyle: CSSProperties = { width: 43, height: 43, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', color: '#0f172a', fontSize: 12, fontWeight: 1000 }
const ringValueStyle: CSSProperties = { display: 'block', marginTop: 3, color: '#0f172a', fontSize: 21, fontWeight: 1000 }
const deepGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1.15fr 1.15fr 1.15fr 1.75fr 1fr', gap: 14, alignItems: 'stretch' }
const panelStyle: CSSProperties = { borderRadius: 26, border: '1px solid #dbeafe', background: 'linear-gradient(180deg,#ffffff,#fbfdff)', padding: 18, boxShadow: '0 22px 54px rgba(15,23,42,.065)', minWidth: 0 }
const panelHeaderStyle: CSSProperties = { marginBottom: 12 }
const panelTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 15, fontWeight: 1000 }
const panelSubtitleStyle: CSSProperties = { margin: '4px 0 0', color: '#64748b', fontSize: 11, fontWeight: 700 }
const healthLayoutStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '110px 1fr', gap: 14, alignItems: 'center' }
const gaugeWrapStyle: CSSProperties = { display: 'grid', justifyItems: 'center', gap: 8 }
const gaugeStyle: CSSProperties = { width: 90, height: 90, borderRadius: '50%', display: 'grid', placeItems: 'center' }
const gaugeInnerStyle: CSSProperties = { width: 66, height: 66, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', textAlign: 'center', color: '#0f172a' }
const excellentStyle: CSSProperties = { border: '1px solid #bbf7d0', color: '#047857', background: '#ecfdf5', borderRadius: 999, padding: '7px 10px', fontSize: 11, fontWeight: 950 }
const healthListStyle: CSSProperties = { display: 'grid', gap: 8 }
const healthRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '14px minmax(0,1fr) auto', gap: 8, alignItems: 'center', color: '#334155', fontSize: 12, fontWeight: 850 }
const priorityLayoutStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '105px 1fr', gap: 14, alignItems: 'center' }
const donutStyle: CSSProperties = { width: 92, height: 92, borderRadius: '50%', background: 'conic-gradient(#ef4444 0 58deg,#f59e0b 58deg 210deg,#2563eb 210deg 325deg,#94a3b8 325deg)', display: 'grid', placeItems: 'center' }
const donutInnerStyle: CSSProperties = { width: 62, height: 62, borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', textAlign: 'center', color: '#0f172a' }
const priorityLegendStyle: CSSProperties = { display: 'grid', gap: 9 }
const teamListStyle: CSSProperties = { display: 'grid', gap: 10 }
const teamRowStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 90px 28px', gap: 8, alignItems: 'center', color: '#334155', fontSize: 12, fontWeight: 850 }
const teamTrackStyle: CSSProperties = { height: 7, borderRadius: 999, overflow: 'hidden', background: '#e2e8f0' }
const funnelStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 8 }
const funnelStageStyle: CSSProperties = { position: 'relative', display: 'grid', gap: 6, padding: 10, borderRadius: 16, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', minWidth: 0 }
const funnelIconStyle: CSSProperties = { width: 32, height: 32, borderRadius: 13, display: 'grid', placeItems: 'center', fontWeight: 1000 }
const trackStyle: CSSProperties = { height: 7, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }
const insightListStyle: CSSProperties = { display: 'grid', gap: 9 }
const insightStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '26px 1fr auto', gap: 8, alignItems: 'center', padding: 8, borderRadius: 14, background: '#f8fafc', color: '#334155', fontSize: 11, fontWeight: 850 }
const viewAnalyticsStyle: CSSProperties = { border: '1px solid #dbe3ee', borderRadius: 14, background: '#fff', color: '#0f172a', padding: 10, fontWeight: 950, cursor: 'pointer' }
const filterBarStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '2.2fr .9fr .9fr .9fr auto', gap: 12, padding: 12, borderRadius: 24, background: '#fff', border: '1px solid #dbeafe', boxShadow: '0 18px 44px rgba(15,23,42,.045)' }
const searchInputStyle: CSSProperties = { width: '100%', border: '1px solid #dbe3ee', borderRadius: 16, background: '#fff', color: '#0f172a', padding: '14px 16px', fontWeight: 750 }
const selectStyle: CSSProperties = { border: '1px solid #dbe3ee', borderRadius: 16, background: '#fff', color: '#0f172a', padding: '14px 16px', fontWeight: 850 }
const broadcastListHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }
const sectionTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 1000 }
const sectionSubtitleStyle: CSSProperties = { margin: '4px 0 0', color: '#64748b', fontSize: 12, fontWeight: 750 }
const createDashedButtonStyle: CSSProperties = { border: '1px dashed #94a3b8', borderRadius: 18, background: '#fff', color: '#334155', padding: '15px 18px', fontWeight: 950, cursor: 'pointer' }
const broadcastCardsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const broadcastCardStyle: CSSProperties = { borderRadius: 24, border: '1px solid #dbeafe', background: 'linear-gradient(135deg,#ffffff,#fbfdff)', padding: 18, display: 'grid', gap: 10, boxShadow: '0 22px 48px rgba(15,23,42,.065)' }
const broadcastCardTopStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }
const smallPillStyle: CSSProperties = { border: '1px solid', borderRadius: 999, padding: '5px 8px', fontSize: 10, fontWeight: 1000 }
const stateStyle: CSSProperties = { color: '#64748b', fontSize: 11, fontWeight: 850, textTransform: 'capitalize' }
const broadcastTitleStyle: CSSProperties = { margin: 0, color: '#0f172a', fontSize: 14, fontWeight: 1000, lineHeight: 1.25 }
const broadcastTeamStyle: CSSProperties = { margin: 0, color: '#64748b', fontSize: 11, fontWeight: 800 }
const cardStatsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, color: '#334155', fontSize: 11, fontWeight: 850 }
const dueStyle: CSSProperties = { fontSize: 11, fontWeight: 900 }
const emptyStateStyle: CSSProperties = { display: 'grid', placeItems: 'center', gap: 10, minHeight: 150, borderRadius: 28, border: '1px dashed #bfdbfe', background: 'radial-gradient(circle at 50% 0%,#eff6ff,#ffffff 48%)', color: '#64748b', fontWeight: 850, textAlign: 'center' }
const emptyTinyStyle: CSSProperties = { padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
const modalOverlayStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 9999, display: 'grid', placeItems: 'center', background: 'rgba(15,23,42,.42)', backdropFilter: 'blur(12px)', padding: 20 }
const modalStyle: CSSProperties = { width: 'min(760px,100%)', maxHeight: '90vh', overflow: 'auto', display: 'grid', gap: 16, borderRadius: 28, background: '#fff', border: '1px solid #dbeafe', padding: 22, boxShadow: '0 40px 120px rgba(15,23,42,.25)' }
const modalHeaderStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16 }
const modalTitleStyle: CSSProperties = { margin: '6px 0 0', color: '#0f172a', fontSize: 24, fontWeight: 1000, letterSpacing: '-.04em' }
const closeButtonStyle: CSSProperties = { width: 40, height: 40, borderRadius: 999, border: '1px solid #e2e8f0', background: '#fff', fontSize: 22, fontWeight: 1000, cursor: 'pointer' }
const fieldStyle: CSSProperties = { display: 'grid', gap: 8, color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: CSSProperties = { width: '100%', border: '1px solid #cbd5e1', borderRadius: 14, padding: '13px 14px', color: '#0f172a', fontWeight: 750, boxSizing: 'border-box' }
const modalGridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }
const modalActionsStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10 }

const heroRightStackStyle: CSSProperties = { display: 'grid', gridTemplateRows: 'auto auto', gap: 12, minWidth: 0 }
const commandHealthCardStyle: CSSProperties = { borderRadius: 30, border: '1px solid #dbeafe', background: 'linear-gradient(135deg,#ffffff 0%,#eff6ff 70%,#eef2ff 100%)', padding: 18, boxShadow: '0 22px 60px rgba(37,99,235,.10)', display: 'grid', gap: 14 }
const commandHealthTopStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '48px minmax(0,1fr) auto', gap: 12, alignItems: 'center', color: '#0f172a' }
const commandOrbStyle: CSSProperties = { width: 48, height: 48, borderRadius: 18, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#2563eb,#8b5cf6)', color: '#fff', fontSize: 22, boxShadow: '0 18px 34px rgba(37,99,235,.25)' }
const commandBarsStyle: CSSProperties = { display: 'grid', gap: 8, padding: 12, borderRadius: 20, background: '#fff', border: '1px solid #dbeafe' }
const commandHealthMetaStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, color: '#64748b', fontSize: 11, fontWeight: 850 }
const heroCommandStripStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10, marginTop: 16 }
const heroCommandItemStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', gap: 8, alignItems: 'center', padding: 12, borderRadius: 18, background: '#fff', border: '1px solid #dbeafe', boxShadow: '0 12px 28px rgba(15,23,42,.035)' }
const emptyIconStyle: CSSProperties = { width: 54, height: 54, borderRadius: 20, display: 'grid', placeItems: 'center', background: '#eff6ff', color: '#2563eb', fontSize: 24, border: '1px solid #bfdbfe' }

const workspaceHeroStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1.2fr) minmax(420px,.8fr)',
  gap: 18,
  padding: 24,
  borderRadius: 34,
  border: '1px solid #bfdbfe',
  background: 'radial-gradient(circle at 10% 0%,#dbeafe 0,#ffffff 34%,#f8fbff 100%)',
  boxShadow: '0 34px 90px rgba(37,99,235,.12)',
  overflow: 'hidden',
}
const workspaceHeroLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 18,
  minWidth: 0,
}
const workspaceHeroIconStyle: CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: 26,
  display: 'grid',
  placeItems: 'center',
  background: 'linear-gradient(135deg,#0f172a,#2563eb)',
  color: '#fff',
  fontSize: 30,
  boxShadow: '0 24px 48px rgba(37,99,235,.25)',
  flexShrink: 0,
}
const workspaceEyebrowStyle: CSSProperties = {
  color: '#1d4ed8',
  fontSize: 11,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '.16em',
}
const workspaceTitleStyle: CSSProperties = {
  margin: '7px 0 0',
  color: '#0f172a',
  fontSize: 34,
  lineHeight: 1.02,
  fontWeight: 1000,
  letterSpacing: '-.055em',
  maxWidth: 980,
}
const workspaceSubtitleStyle: CSSProperties = {
  margin: '10px 0 0',
  color: '#64748b',
  fontSize: 14,
  fontWeight: 760,
  lineHeight: 1.5,
  maxWidth: 900,
}
const workspaceChipRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 9,
  marginTop: 15,
}
const workspaceChipGreenStyle: CSSProperties = {
  display: 'inline-flex',
  border: '1px solid #bbf7d0',
  background: '#ecfdf5',
  color: '#047857',
  borderRadius: 999,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 1000,
}
const workspaceChipBlueStyle: CSSProperties = {
  ...workspaceChipGreenStyle,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  color: '#1d4ed8',
}
const workspaceChipPurpleStyle: CSSProperties = {
  ...workspaceChipGreenStyle,
  border: '1px solid #ddd6fe',
  background: '#f5f3ff',
  color: '#7c3aed',
}
const workspaceChipRedStyle: CSSProperties = {
  ...workspaceChipGreenStyle,
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#dc2626',
}
const workspaceHeroRightStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  alignContent: 'start',
}
const workspaceSignalCardStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 18,
  borderRadius: 28,
  border: '1px solid #dbeafe',
  background: 'linear-gradient(135deg,#ffffff,#eff6ff)',
  boxShadow: '0 24px 60px rgba(37,99,235,.10)',
}
const workspaceSignalHeaderStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '44px minmax(0,1fr) auto',
  gap: 12,
  alignItems: 'center',
  color: '#0f172a',
}
const workspaceSignalBarsStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 12,
  borderRadius: 18,
  background: '#fff',
  border: '1px solid #dbeafe',
}
const workspaceKpiStripStyle: CSSProperties = {
  gridColumn: '1 / -1',
  display: 'grid',
  gridTemplateColumns: 'repeat(6,minmax(0,1fr))',
  gap: 12,
}
const workspaceHeroKpiStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '42px minmax(0,1fr)',
  gap: 12,
  alignItems: 'center',
  padding: 14,
  borderRadius: 22,
  border: '1px solid #dbeafe',
  boxShadow: '0 16px 38px rgba(15,23,42,.045)',
  minWidth: 0,
}
const workspaceHeroKpiIconStyle: CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 16,
  display: 'grid',
  placeItems: 'center',
  fontSize: 18,
  fontWeight: 1000,
}
const workspaceHeroKpiLabelStyle: CSSProperties = {
  display: 'block',
  color: '#64748b',
  fontSize: 10,
  fontWeight: 1000,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
}
const workspaceHeroKpiValueStyle: CSSProperties = {
  display: 'block',
  marginTop: 3,
  color: '#0f172a',
  fontSize: 22,
  lineHeight: 1,
  fontWeight: 1000,
  letterSpacing: '-.04em',
}
const workspaceHeroKpiDetailStyle: CSSProperties = {
  display: 'block',
  marginTop: 5,
  color: '#64748b',
  fontSize: 11,
  lineHeight: 1.25,
  fontStyle: 'normal',
  fontWeight: 750,
}

const workspaceSignalMainOrbStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 18,
  display: 'grid',
  placeItems: 'center',
  background: 'linear-gradient(135deg,#0f172a,#2563eb)',
  color: '#fff',
  fontSize: 20,
  boxShadow: '0 18px 34px rgba(37,99,235,.25)',
}
const workspaceSignalGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
  gap: 10,
}
const workspaceSignalItemStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '34px minmax(0,1fr)',
  gap: 10,
  alignItems: 'center',
  border: '1px solid',
  borderRadius: 18,
  padding: 11,
  minWidth: 0,
}
const workspaceSignalDotStyle: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: 999,
  color: 'transparent',
  display: 'block',
}
