/*
  AngelCare HR Action Center — REAL EXECUTION VERSION
  Install path:
  app/(protected)/hr/actions/page.tsx

  Requires:
  app/(protected)/hr/_execution/actions.ts
*/

import type { CSSProperties } from 'react'
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import {
  createHRAction,
  completeHRAction,
  escalateHRAction,
  archiveHRAction,
} from '../_execution/actions'

export const dynamic = 'force-dynamic'

type HRActionRow = {
  id: string
  title?: string | null
  description?: string | null
  action_type?: string | null
  owner?: string | null
  assigned_to?: string | null
  priority?: string | null
  status?: string | null
  target_route?: string | null
  created_at?: string | null
  updated_at?: string | null
  due_date?: string | null
  metadata?: Record<string, unknown> | null
}

const accent = '#0f766e'

const fallbackRows: HRActionRow[] = [
  {
    id: 'sample-missing-document',
    title: 'Missing document follow-up',
    description: 'Request missing staff document and archive evidence.',
    owner: 'HR Officer',
    priority: 'high',
    status: 'open',
  },
  {
    id: 'sample-attendance-anomaly',
    title: 'Attendance anomaly',
    description: 'Review late arrival or missing pointage signal.',
    owner: 'Ops Lead',
    priority: 'medium',
    status: 'investigating',
  },
  {
    id: 'sample-contract-renewal',
    title: 'Contract renewal',
    description: 'Prepare contract renewal file and approval.',
    owner: 'Admin',
    priority: 'high',
    status: 'pending',
  },
]

async function loadActions() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('hr_execution_action_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return { rows: fallbackRows, error: error.message, live: false }
    }

    return {
      rows: Array.isArray(data) && data.length ? (data as HRActionRow[]) : fallbackRows,
      error: null,
      live: Array.isArray(data),
    }
  } catch (error) {
    return {
      rows: fallbackRows,
      error: error instanceof Error ? error.message : 'Unable to load HR actions',
      live: false,
    }
  }
}

function countBy(rows: HRActionRow[], status: string) {
  return rows.filter((row) => String(row.status || '').toLowerCase() === status).length
}

function countPriority(rows: HRActionRow[], priority: string) {
  return rows.filter((row) => String(row.priority || '').toLowerCase() === priority).length
}

function readable(value?: string | null) {
  return String(value || '—')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function isSample(row: HRActionRow) {
  return String(row.id).startsWith('sample-')
}

export default async function Page() {
  const { rows, error, live } = await loadActions()

  const openCount = rows.filter((row) => !['completed', 'archived', 'closed'].includes(String(row.status || '').toLowerCase())).length
  const criticalCount = countPriority(rows, 'critical') + countPriority(rows, 'high')
  const escalatedCount = countBy(rows, 'escalated')
  const completedCount = countBy(rows, 'completed')

  const stats = [
    ['Open tasks', String(openCount), 'ready for HR processing'],
    ['Critical / High', String(criticalCount), 'priority interventions'],
    ['Escalated', String(escalatedCount), 'management attention'],
    ['Completed', String(completedCount), 'closed actions'],
  ]

  return (
    <AppShell
      title="HR Action Center"
      subtitle="Real HR execution queue with create, complete, escalate and archive server actions."
      breadcrumbs={[{ label: 'HR' }, { label: 'HR Action Center' }]}
      actions={
        <>
          <PageAction href="/hr">HR Command</PageAction>
          <PageAction href="/hr/settings" variant="light">
            Settings
          </PageAction>
        </>
      }
    >
      <main style={styles.page}>
        <section
          style={{
            ...styles.hero,
            background: `linear-gradient(135deg, #06111f, ${accent}, #020617)`,
          }}
        >
          <div>
            <div style={styles.badge}>real execution / server actions</div>
            <h1 style={styles.title}>HR Action Center</h1>
            <p style={styles.subtitle}>
              Create HR actions, assign operational owners, escalate critical issues, complete tasks and archive closed
              work. This page now reads from Supabase and submits through the HR execution server-action layer.
            </p>
          </div>

          <div style={styles.heroActions}>
            <a href="#create-action" style={styles.primaryLink}>
              Create HR Action
            </a>
            <a href="#action-queue" style={styles.primaryLink}>
              Open Queue
            </a>
            <Link href="/hr" style={styles.primaryLink}>
              HR Home
            </Link>
          </div>
        </section>

        {error && (
          <section style={styles.warning}>
            <strong>Fallback mode active</strong>
            <span>{error}</span>
            <small>
              The page remains visible with sample rows, but real actions need the execution migration/table installed.
            </small>
          </section>
        )}

        <section style={styles.statGrid}>
          {stats.map(([label, value, detail]) => (
            <div key={label} style={styles.statCard}>
              <span style={{ ...styles.statDot, background: accent }} />
              <small>{label}</small>
              <strong>{value}</strong>
              <em>{detail}</em>
            </div>
          ))}
        </section>

        <section id="create-action" style={styles.commandBoard}>
          <div style={styles.boardHeader}>
            <div>
              <h2>Create real HR action</h2>
              <p>
                Submits to <b>hr_execution_action_queue</b> through <b>createHRAction</b>, then refreshes the HR action
                page.
              </p>
            </div>
            <span style={live ? styles.liveBadge : styles.fallbackBadge}>{live ? 'LIVE DB' : 'FALLBACK'}</span>
          </div>

          <form action={createHRAction} style={styles.formGrid}>
            <input type="hidden" name="path" value="/hr/actions" />
            <input type="hidden" name="action_type" value="manual_hr_action" />

            <label style={styles.field}>
              <span>Action title</span>
              <input name="title" required placeholder="Example: Missing contract document" style={styles.input} />
            </label>

            <label style={styles.field}>
              <span>Owner</span>
              <input name="owner" placeholder="HR Officer / Manager / Department" style={styles.input} />
            </label>

            <label style={styles.field}>
              <span>Priority</span>
              <select name="priority" defaultValue="medium" style={styles.input}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label style={styles.field}>
              <span>Status</span>
              <select name="status" defaultValue="open" style={styles.input}>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>

            <label style={styles.fieldWide}>
              <span>Description / instruction</span>
              <textarea
                name="description"
                placeholder="Describe what HR must do, who is affected, expected outcome, evidence required..."
                style={{ ...styles.input, minHeight: 110, resize: 'vertical' }}
              />
            </label>

            <label style={styles.field}>
              <span>Due date</span>
              <input name="due_date" type="date" style={styles.input} />
            </label>

            <div style={styles.submitWrap}>
              <button type="submit" style={styles.submitButton}>
                Create real HR action
              </button>
            </div>
          </form>
        </section>

        <section style={styles.panelGrid}>
          <section style={styles.panel}>
            <div style={styles.panelIcon}>⚡</div>
            <h2>Bulk execution console</h2>
            <p>Select staff cases, assign owner, change status, escalate, archive or complete actions.</p>
            <div style={styles.panelActions}>
              <a href="#action-queue" style={styles.softLink}>Review queue</a>
              <a href="#create-action" style={styles.softLink}>New action</a>
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelIcon}>🧭</div>
            <h2>Priority routing</h2>
            <p>Escalate high-impact issues and route actions to HR, management, operations, finance or compliance.</p>
            <div style={styles.panelActions}>
              <a href="#action-queue" style={styles.softLink}>Escalations</a>
              <Link href="/hr/approvals" style={styles.softLink}>Approvals</Link>
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelIcon}>📌</div>
            <h2>Follow-up control</h2>
            <p>Create due dates, reminders, internal notes and proof-of-completion checks for HR tasks.</p>
            <div style={styles.panelActions}>
              <Link href="/hr/documents" style={styles.softLink}>Documents</Link>
              <Link href="/hr/compliance" style={styles.softLink}>Compliance</Link>
            </div>
          </section>
        </section>

        <section id="action-queue" style={styles.commandBoard}>
          <div style={styles.boardHeader}>
            <div>
              <h2>Live action queue</h2>
              <p>
                Rows loaded from Supabase when available. Complete, escalate and archive submit through real server
                actions.
              </p>
            </div>
            <Link href="/hr" style={styles.linkButton}>
              Back to HR
            </Link>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Owner</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Control</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <b>{row.title || 'Untitled HR action'}</b>
                      <small>{row.description || row.action_type || 'No description'}</small>
                    </td>
                    <td>{row.owner || row.assigned_to || 'Unassigned'}</td>
                    <td>
                      <span style={{ ...styles.priorityPill, background: priorityColor(row.priority) }}>
                        {readable(row.priority)}
                      </span>
                    </td>
                    <td>{readable(row.status)}</td>
                    <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <div style={styles.inlineActions}>
                        {isSample(row) ? (
                          <span style={styles.sampleNote}>sample row</span>
                        ) : (
                          <>
                            <form action={completeHRAction}>
                              <input type="hidden" name="id" value={row.id} />
                              <button type="submit" style={styles.tableButton}>
                                Complete
                              </button>
                            </form>
                            <form action={escalateHRAction}>
                              <input type="hidden" name="id" value={row.id} />
                              <button type="submit" style={styles.tableButton}>
                                Escalate
                              </button>
                            </form>
                            <form action={archiveHRAction}>
                              <input type="hidden" name="id" value={row.id} />
                              <button type="submit" style={styles.tableButton}>
                                Archive
                              </button>
                            </form>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </AppShell>
  )
}

function priorityColor(priority?: string | null) {
  const p = String(priority || '').toLowerCase()
  if (p === 'critical') return '#dc2626'
  if (p === 'high') return '#ea580c'
  if (p === 'medium') return '#0f766e'
  return '#64748b'
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 },
  hero: {
    color: 'white',
    borderRadius: 32,
    padding: 30,
    display: 'grid',
    gridTemplateColumns: '1.5fr auto',
    gap: 24,
    boxShadow: '0 28px 80px rgba(15,23,42,.24)',
    border: '1px solid rgba(255,255,255,.16)',
  },
  badge: {
    width: 'fit-content',
    borderRadius: 999,
    padding: '8px 12px',
    background: 'rgba(255,255,255,.12)',
    border: '1px solid rgba(255,255,255,.2)',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { fontSize: 42, lineHeight: 1.04, margin: '14px 0 8px', fontWeight: 950 },
  subtitle: { maxWidth: 900, fontSize: 16, lineHeight: 1.7, opacity: 0.92 },
  heroActions: { display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'center', minWidth: 230 },
  primaryLink: {
    border: 0,
    borderRadius: 16,
    padding: '13px 16px',
    background: 'white',
    color: '#020617',
    fontWeight: 900,
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
  },
  warning: {
    border: '1px solid #f59e0b',
    background: '#fffbeb',
    color: '#92400e',
    borderRadius: 18,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  liveBadge: {
    borderRadius: 999,
    background: '#dcfce7',
    color: '#166534',
    padding: '8px 12px',
    fontWeight: 950,
    fontSize: 12,
  },
  fallbackBadge: {
    borderRadius: 999,
    background: '#fef3c7',
    color: '#92400e',
    padding: '8px 12px',
    fontWeight: 950,
    fontSize: 12,
  },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 },
  statCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 24,
    padding: 18,
    boxShadow: '0 14px 40px rgba(15,23,42,.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  statDot: { width: 12, height: 12, borderRadius: 99 },
  panelGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16 },
  panel: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 28,
    padding: 22,
    boxShadow: '0 14px 45px rgba(15,23,42,.06)',
    minHeight: 210,
  },
  panelIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    background: '#f1f5f9',
    display: 'grid',
    placeItems: 'center',
    fontSize: 24,
    marginBottom: 12,
  },
  panelActions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  softLink: {
    border: '1px solid #cbd5e1',
    borderRadius: 999,
    background: '#f8fafc',
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    color: '#0f172a',
    textDecoration: 'none',
  },
  commandBoard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: 30,
    padding: 24,
    boxShadow: '0 16px 55px rgba(15,23,42,.07)',
  },
  boardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 16,
  },
  linkButton: {
    textDecoration: 'none',
    borderRadius: 14,
    background: '#eff6ff',
    color: '#1d4ed8',
    padding: '10px 13px',
    fontWeight: 900,
  },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 14,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 7, fontSize: 12, fontWeight: 900, color: '#334155' },
  fieldWide: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
    fontSize: 12,
    fontWeight: 900,
    color: '#334155',
    gridColumn: 'span 3',
  },
  input: {
    border: '1px solid #cbd5e1',
    borderRadius: 14,
    padding: '12px 13px',
    fontSize: 14,
    background: 'white',
  },
  submitWrap: { display: 'flex', alignItems: 'end' },
  submitButton: {
    width: '100%',
    border: 0,
    borderRadius: 14,
    padding: '13px 16px',
    background: '#0f766e',
    color: 'white',
    fontWeight: 950,
    cursor: 'pointer',
  },
  inlineActions: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tableButton: {
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    background: '#ffffff',
    padding: '7px 9px',
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
  },
  priorityPill: {
    color: 'white',
    borderRadius: 999,
    padding: '5px 8px',
    fontSize: 11,
    fontWeight: 900,
  },
  sampleNote: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 900,
  },
}