/*
  AngelCare HR Real Submodule Page
  Manual install: copy this file into the matching app/(protected)/hr/<module>/page.tsx path.
*/

import type { CSSProperties } from 'react'
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'

export const dynamic = 'force-dynamic'

const accent = "#475569"

const stats = [
    ["Rules", "28", "configured"],
    ["Templates", "14", "ready"],
    ["Permissions", "9", "roles"],
    ["Policies", "6", "active"],
]

const heroActions = ["Create Rule", "Open Permissions", "Save Configuration"]

const panels = [
    { icon: "⚙️", title: "Workflow rules", text: "Configure approval paths, SLA, reminders and escalation logic.", actions: ['Edit rules', 'Test flow', 'Publish'] },
    { icon: "🏷️", title: "Templates library", text: "Manage HR templates for memos, documents, reviews and actions.", actions: ['Create template', 'Edit', 'Archive'] },
    { icon: "🔐", title: "Access control", text: "Configure module permissions, staff roles and page visibility.", actions: ['Role matrix', 'Grant', 'Revoke'] },
]

const tableColumns = ["Area", "Scope", "Status", "Action"]

const tableRows = [
    ["Approval rules", "HR/Managers", "Active", "Edit"],
    ["Document templates", "Staff files", "Draft", "Open"],
    ["Permission matrix", "All HR", "Active", "Review"],
]

export default function Page() {
  return (
    <AppShell
      title="HR Sync Control"
      subtitle="HR permissions, departments, policies, templates, workflow rules, default values and operating configuration."
      breadcrumbs={[{ label: 'HR' }, { label: "HR Sync Control" }]}
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
            <div style={styles.badge}>settings / configuration</div>
            <h1 style={styles.title}>HR Sync Control</h1>
            <p style={styles.subtitle}>HR permissions, departments, policies, templates, workflow rules, default values and operating configuration.</p>
          </div>

          <div style={styles.heroActions}>
            {heroActions.map((action) => (
              <button key={action} type="button" style={styles.primaryButton}>
                {action}
              </button>
            ))}
          </div>
        </section>

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

        <section style={styles.panelGrid}>
          {panels.map((panel) => (
            <section key={panel.title} style={styles.panel}>
              <div style={styles.panelIcon}>{panel.icon}</div>
              <h2>{panel.title}</h2>
              <p>{panel.text}</p>
              <div style={styles.panelActions}>
                {panel.actions.map((action) => (
                  <button key={`${panel.title}-${action}`} type="button" style={styles.softButton}>
                    {action}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </section>

        <section style={styles.commandBoard}>
          <div style={styles.boardHeader}>
            <div>
              <h2>Configuration areas</h2>
              <p>Operational rows are ready to connect to Supabase tables, server actions, approvals, and staff assignments.</p>
            </div>
            <Link href="/hr" style={styles.linkButton}>
              Back to HR
            </Link>
          </div>

          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {tableColumns.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                    ))}
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
  primaryButton: {
    border: 0,
    borderRadius: 16,
    padding: '13px 16px',
    background: 'white',
    color: '#020617',
    fontWeight: 900,
    cursor: 'pointer',
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
  softButton: {
    border: '1px solid #cbd5e1',
    borderRadius: 999,
    background: '#f8fafc',
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 800,
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
}
