import type { CSSProperties } from 'react'
import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { createHRExecutionRecord, updateHRExecutionStatus } from './actions'

export const dynamic = 'force-dynamic'

type FieldType = 'text' | 'textarea' | 'select' | 'date' | 'time' | 'number' | 'hidden'
type Field = { name: string; label: string; type?: FieldType; placeholder?: string; options?: string[]; required?: boolean; value?: string }
type TableConfig = { table: string; order?: string; columns: string[]; labels: string[]; moduleKey: string }

type HRExecutionPageProps = {
  moduleKey: string
  title: string
  subtitle: string
  badge: string
  accent: string
  primaryActions: string[]
  stats: Array<[string, string, string]>
  panels: Array<{ icon: string; title: string; text: string; actions: string[] }>
  formTitle: string
  formDescription: string
  fields: Field[]
  table: TableConfig
}

async function loadRows(config: TableConfig) {
  try {
    const supabase = await createClient()
    const query = supabase.from(config.table).select('*').limit(25)
    const { data, error } = config.order ? await query.order(config.order, { ascending: false }) : await query
    if (error) return { rows: [], error: error.message }
    return { rows: Array.isArray(data) ? data : [], error: '' }
  } catch (error: any) {
    return { rows: [], error: error?.message || 'Unable to load data.' }
  }
}

function valueOf(row: Record<string, any>, column: string) {
  const value = row[column]
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function FieldInput({ field }: { field: Field }) {
  if (field.type === 'hidden') {
    return <input type="hidden" name={field.name} value={field.value || ''} />
  }

  if (field.type === 'textarea') {
    return (
      <label style={styles.fieldWide}>
        <span>{field.label}</span>
        <textarea name={field.name} placeholder={field.placeholder} required={field.required} style={{ ...styles.input, minHeight: 92 }} />
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <label style={styles.field}>
        <span>{field.label}</span>
        <select name={field.name} required={field.required} style={styles.input} defaultValue={field.value || field.options?.[0] || ''}>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    )
  }

  return (
    <label style={field.type === 'textarea' ? styles.fieldWide : styles.field}>
      <span>{field.label}</span>
      <input
        type={field.type || 'text'}
        name={field.name}
        placeholder={field.placeholder}
        required={field.required}
        defaultValue={field.value || ''}
        style={styles.input}
      />
    </label>
  )
}

export default async function HRExecutionPage(props: HRExecutionPageProps) {
  const { rows, error } = await loadRows(props.table)

  return (
    <AppShell
      title={props.title}
      subtitle={props.subtitle}
      breadcrumbs={[{ label: 'HR' }, { label: props.title }]}
      actions={
        <>
          <PageAction href="/hr">HR Command</PageAction>
          <PageAction href="/hr/settings" variant="light">Settings</PageAction>
        </>
      }
    >
      <main style={styles.page}>
        <section style={{ ...styles.hero, background: `linear-gradient(135deg, #06111f, ${props.accent}, #020617)` }}>
          <div>
            <div style={styles.badge}>{props.badge}</div>
            <h1 style={styles.title}>{props.title}</h1>
            <p style={styles.subtitle}>{props.subtitle}</p>
          </div>
          <div style={styles.heroActions}>
            {props.primaryActions.map((action) => <button key={action} type="button" style={styles.primaryButton}>{action}</button>)}
          </div>
        </section>

        <section style={styles.statGrid}>
          {props.stats.map(([label, value, detail]) => (
            <div key={label} style={styles.statCard}>
              <span style={{ ...styles.statDot, background: props.accent }} />
              <small>{label}</small>
              <strong>{value}</strong>
              <em>{detail}</em>
            </div>
          ))}
        </section>

        <section style={styles.panelGrid}>
          {props.panels.map((panel) => (
            <section key={panel.title} style={styles.panel}>
              <div style={styles.panelIcon}>{panel.icon}</div>
              <h2>{panel.title}</h2>
              <p>{panel.text}</p>
              <div style={styles.panelActions}>
                {panel.actions.map((action) => <button key={`${panel.title}-${action}`} type="button" style={styles.softButton}>{action}</button>)}
              </div>
            </section>
          ))}
        </section>

        <section style={styles.formBoard}>
          <div>
            <h2>{props.formTitle}</h2>
            <p>{props.formDescription}</p>
          </div>
          <form action={createHRExecutionRecord} style={styles.formGrid}>
            <input type="hidden" name="moduleKey" value={props.moduleKey} />
            <input type="hidden" name="path" value={`/hr/${props.moduleKey}`} />
            {props.fields.map((field) => <FieldInput key={field.name} field={field} />)}
            <button type="submit" style={styles.submitButton}>Create / Save</button>
          </form>
        </section>

        <section style={styles.commandBoard}>
          <div style={styles.boardHeader}>
            <div>
              <h2>Live records</h2>
              <p>Loaded from <b>{props.table.table}</b>. Form submissions write to the same operational table.</p>
              {error && <p style={styles.error}>Table warning: {error}. Run the HR migration included in this pack if needed.</p>}
            </div>
            <Link href="/hr" style={styles.linkButton}>Back to HR</Link>
          </div>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {props.table.labels.map((label) => <th key={label}>{label}</th>)}
                  <th>Quick status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={String(row.id || JSON.stringify(row))}>
                    {props.table.columns.map((column) => <td key={`${row.id}-${column}`}>{valueOf(row, column)}</td>)}
                    <td>
                      {row.id ? (
                        <form action={updateHRExecutionStatus} style={styles.inlineForm}>
                          <input type="hidden" name="moduleKey" value={props.moduleKey} />
                          <input type="hidden" name="path" value={`/hr/${props.moduleKey}`} />
                          <input type="hidden" name="id" value={String(row.id)} />
                          <select name="status" defaultValue={String(row.status || 'closed')} style={styles.smallInput}>
                            <option value="pending">pending</option>
                            <option value="open">open</option>
                            <option value="approved">approved</option>
                            <option value="rejected">rejected</option>
                            <option value="closed">closed</option>
                            <option value="active">active</option>
                          </select>
                          <button type="submit" style={styles.smallButton}>Update</button>
                        </form>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={props.table.labels.length + 1}>No records yet. Use the form above to create the first real HR record.</td></tr>
                )}
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
  hero: { color: 'white', borderRadius: 32, padding: 30, display: 'grid', gridTemplateColumns: '1.5fr auto', gap: 24, boxShadow: '0 28px 80px rgba(15,23,42,.24)', border: '1px solid rgba(255,255,255,.16)' },
  badge: { width: 'fit-content', borderRadius: 999, padding: '8px 12px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', fontSize: 12, fontWeight: 900, letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 42, lineHeight: 1.04, margin: '14px 0 8px', fontWeight: 950 },
  subtitle: { maxWidth: 900, fontSize: 16, lineHeight: 1.7, opacity: 0.92 },
  heroActions: { display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'center', minWidth: 230 },
  primaryButton: { border: 0, borderRadius: 16, padding: '13px 16px', background: 'white', color: '#020617', fontWeight: 900, cursor: 'pointer' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 },
  statCard: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 24, padding: 18, boxShadow: '0 14px 40px rgba(15,23,42,.06)', display: 'flex', flexDirection: 'column', gap: 7 },
  statDot: { width: 12, height: 12, borderRadius: 99 },
  panelGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16 },
  panel: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 28, padding: 22, boxShadow: '0 14px 45px rgba(15,23,42,.06)', minHeight: 210 },
  panelIcon: { width: 44, height: 44, borderRadius: 16, background: '#f1f5f9', display: 'grid', placeItems: 'center', fontSize: 24, marginBottom: 12 },
  panelActions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  softButton: { border: '1px solid #cbd5e1', borderRadius: 999, background: '#f8fafc', padding: '8px 10px', fontSize: 12, fontWeight: 800 },
  formBoard: { background: '#0f172a', color: 'white', borderRadius: 30, padding: 24, boxShadow: '0 16px 55px rgba(15,23,42,.12)' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12, marginTop: 16, alignItems: 'end' },
  field: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 900 },
  fieldWide: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 900, gridColumn: 'span 2' },
  input: { border: '1px solid #cbd5e1', borderRadius: 14, padding: '12px 13px', fontSize: 14 },
  submitButton: { border: 0, borderRadius: 14, padding: '13px 16px', background: '#22c55e', color: 'white', fontWeight: 950, cursor: 'pointer' },
  commandBoard: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 30, padding: 24, boxShadow: '0 16px 55px rgba(15,23,42,.07)' },
  boardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 16 },
  linkButton: { textDecoration: 'none', borderRadius: 14, background: '#eff6ff', color: '#1d4ed8', padding: '10px 13px', fontWeight: 900 },
  error: { color: '#b45309', background: '#fef3c7', padding: 10, borderRadius: 12 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' },
  inlineForm: { display: 'flex', gap: 6, alignItems: 'center' },
  smallInput: { border: '1px solid #cbd5e1', borderRadius: 10, padding: '7px 8px' },
  smallButton: { border: 0, borderRadius: 10, padding: '8px 10px', background: '#0f172a', color: 'white', fontWeight: 800 },
}
