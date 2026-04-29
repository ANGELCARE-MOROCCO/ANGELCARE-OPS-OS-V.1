
import Link from 'next/link'
import { createAcademyRecord, updateAcademyStatus, seedAcademyDemoData } from '../actions'
import { ACADEMY_MODULES, ACADEMY_STATUS_TONES, getAcademyModule, type AcademyField, type AcademyModuleKey } from '../_lib/config'
import { displayName, displayStatus, rowSubtitle, type AcademyRow } from '../_lib/data'

export function AcademyNav({ active }: { active?: AcademyModuleKey }) {
  return (
    <div style={navStyle}>
      {ACADEMY_MODULES.map((m) => (
        <Link key={m.key} href={m.href} style={active === m.key ? navItemActiveStyle : navItemStyle}>
          <span>{m.icon}</span><strong>{m.shortTitle}</strong>
        </Link>
      ))}
    </div>
  )
}

export function AcademyHero({ title, subtitle, badge, children }: { title: string; subtitle: string; badge: string; children?: React.ReactNode }) {
  return (
    <section style={heroStyle}>
      <div style={heroGlowStyle} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={badgeStyle}>{badge}</div>
        <h1 style={heroTitleStyle}>{title}</h1>
        <p style={heroTextStyle}>{subtitle}</p>
      </div>
      <div style={heroPanelStyle}>{children}</div>
    </section>
  )
}

export function KpiGrid({ items }: { items: { label: string; value: string; tone?: string; sub?: string }[] }) {
  return <section style={kpiGridStyle}>{items.map((item) => <div key={item.label} style={kpiStyle(item.tone || '#2563eb')}><span>{item.label}</span><strong>{item.value}</strong><small>{item.sub || 'Academy signal'}</small></div>)}</section>
}

export function ModuleCardGrid() {
  return <section style={moduleGridStyle}>{ACADEMY_MODULES.map((m) => <Link key={m.key} href={m.href} style={moduleCardStyle}><span style={moduleIconStyle}>{m.icon}</span><strong>{m.title}</strong><small>{m.executiveIntent}</small><em>{m.workflow.length} workflow controls</em></Link>)}</section>
}

export function AcademyRecordForm({ moduleKey }: { moduleKey: AcademyModuleKey }) {
  const module = getAcademyModule(moduleKey)
  return (
    <form action={createAcademyRecord} style={formStyle}>
      <input type="hidden" name="moduleKey" value={module.key} />
      <div>
        <h2 style={sectionTitleStyle}>{module.primaryAction}</h2>
        <p style={sectionTextStyle}>Stored operation in <strong>{module.table}</strong>. This creates a real Academy workflow record.</p>
      </div>
      <div style={formGridStyle}>{module.fields.map((field) => <Field key={field.name} field={field} />)}</div>
      <button style={primaryButtonStyle}>Save Academy Operation</button>
    </form>
  )
}

function Field({ field }: { field: AcademyField }) {
  const common = { name: field.name, required: field.required, placeholder: field.placeholder || field.label, style: inputStyle } as any
  return (
    <label style={fieldStyle}>
      <span>{field.label}{field.required ? ' *' : ''}</span>
      {field.type === 'textarea' ? <textarea {...common} rows={4} /> : field.type === 'select' ? <select {...common}><option value="">Select...</option>{field.options?.map((o) => <option key={o} value={o}>{o}</option>)}</select> : <input {...common} type={field.type || 'text'} />}
    </label>
  )
}

export function WorkflowBoard({ moduleKey }: { moduleKey: AcademyModuleKey }) {
  const module = getAcademyModule(moduleKey)
  return <section style={panelStyle}><Header title="Operational Workflow" subtitle="Manager-grade flow used to control this submodule." /><div style={workflowStyle}>{module.workflow.map((step, i) => <div key={step} style={workflowStepStyle}><span>{i+1}</span><strong>{step}</strong><small>{module.riskRules[i % module.riskRules.length]}</small></div>)}</div></section>
}

export function RecordTable({ moduleKey, rows, error }: { moduleKey: AcademyModuleKey; rows: AcademyRow[]; error?: string | null }) {
  const module = getAcademyModule(moduleKey)
  return (
    <section style={panelStyle}>
      <Header title="Stored Records" subtitle={`Latest records from ${module.table}.`} />
      {error && <div style={errorStyle}>Database notice: {error}</div>}
      {rows.length ? <div style={recordListStyle}>{rows.map((row) => <RecordRow key={row.id || JSON.stringify(row)} moduleKey={moduleKey} row={row} />)}</div> : <Empty text="No stored records yet. Use the operation form to create the first record." />}
    </section>
  )
}

function RecordRow({ moduleKey, row }: { moduleKey: AcademyModuleKey; row: AcademyRow }) {
  const status = displayStatus(row)
  const tone = ACADEMY_STATUS_TONES[status] || '#2563eb'
  return <div style={recordRowStyle(tone)}><div><strong>{displayName(row)}</strong><small>{rowSubtitle(row)}</small><small>ID: {row.id}</small></div><div style={statusPillStyle(tone)}>{status}</div>{row.id && <form action={updateAcademyStatus} style={quickStatusStyle}><input type="hidden" name="moduleKey" value={moduleKey}/><input type="hidden" name="id" value={row.id}/><select name="status" style={smallSelectStyle} defaultValue={status}><option value="active">active</option><option value="pending">pending</option><option value="completed">completed</option><option value="blocked">blocked</option><option value="archived">archived</option></select><button style={miniButtonStyle}>Update</button></form>}</div>
}

export function CrossModulePanel({ moduleKey }: { moduleKey: AcademyModuleKey }) {
  const module = getAcademyModule(moduleKey)
  return <aside style={panelStyle}><Header title="Connected Controls" subtitle="Fast movement across the Academy operating chain." /> <div style={relatedStyle}>{module.related.map((key) => { const rel = getAcademyModule(key as AcademyModuleKey); return <Link key={key} href={rel.href} style={relatedCardStyle}><span>{rel.icon}</span><strong>{rel.shortTitle}</strong><small>{rel.primaryAction}</small></Link> })}</div><form action={seedAcademyDemoData} style={{ marginTop: 14 }}><button style={secondaryButtonStyle}>Seed demo validation data</button></form></aside>
}

export function ExecutiveInsights({ rows, moduleKey }: { rows: AcademyRow[]; moduleKey: AcademyModuleKey }) {
  const module = getAcademyModule(moduleKey)
  const open = rows.filter((r) => !['completed','closed','paid','issued'].includes(String(displayStatus(r)))).length
  return <section style={panelStyle}><Header title="Manager Intelligence" subtitle="Operational reading generated from the current records." /><div style={insightGridStyle}><Insight label="Open Control Load" value={`${open} active`} /><Insight label="Traceability" value={rows.length ? 'Evidence started' : 'No evidence'} /><Insight label="Critical Next Move" value={module.workflow[1] || module.primaryAction} /><Insight label="5-Year Readiness" value="Structured & expandable" /></div></section>
}

export function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 16 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div> }
export function Empty({ text }: { text: string }) { return <div style={emptyStyle}>{text}</div> }
function Insight({ label, value }: { label: string; value: string }) { return <div style={insightStyle}><span>{label}</span><strong>{value}</strong></div> }

const navStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 18 }
const navItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 18, background: '#fff', border: '1px solid #dbe3ee', color: '#0f172a', textDecoration: 'none', fontSize: 13, boxShadow: '0 12px 26px rgba(15,23,42,.04)' }
const navItemActiveStyle: React.CSSProperties = { ...navItemStyle, background: '#0f172a', color: '#fff', border: '1px solid #0f172a' }
const heroStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 22, padding: 34, borderRadius: 36, color: '#fff', background: 'radial-gradient(circle at top left,#7c3aed,#0f172a 64%)', boxShadow: '0 35px 90px rgba(2,6,23,.35)' }
const heroGlowStyle: React.CSSProperties = { position: 'absolute', width: 360, height: 360, top: -130, left: -110, borderRadius: 999, background: 'radial-gradient(circle,rgba(255,255,255,.23),transparent 70%)', filter: 'blur(26px)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.14)', fontSize: 12, fontWeight: 950, letterSpacing: 1 }
const heroTitleStyle: React.CSSProperties = { margin: '12px 0 8px', fontSize: 44, lineHeight: 1.02, fontWeight: 1000, letterSpacing: -1 }
const heroTextStyle: React.CSSProperties = { margin: 0, color: 'rgba(255,255,255,.88)', lineHeight: 1.65, fontWeight: 750, maxWidth: 760 }
const heroPanelStyle: React.CSSProperties = { position: 'relative', zIndex: 1, borderRadius: 28, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.18)', padding: 20, backdropFilter: 'blur(10px)' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, margin: '18px 0' }
const kpiStyle = (tone: string): React.CSSProperties => ({ display: 'grid', gap: 7, padding: 18, borderRadius: 22, background: '#fff', border: `1px solid ${tone}44`, borderLeft: `5px solid ${tone}`, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.06)' })
const moduleGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 16 }
const moduleCardStyle: React.CSSProperties = { display: 'grid', gap: 10, minHeight: 170, padding: 18, borderRadius: 26, background: 'linear-gradient(180deg,#ffffff,#f8fafc)', border: '1px solid #dbe3ee', color: '#0f172a', textDecoration: 'none', boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const moduleIconStyle: React.CSSProperties = { width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 16, background: '#eef2ff', fontSize: 22 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const formStyle: React.CSSProperties = { ...panelStyle, display: 'grid', gap: 16 }
const formGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 13 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 7, color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { minWidth: 0, padding: '12px 13px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const primaryButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 16, padding: '14px 18px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const secondaryButtonStyle: React.CSSProperties = { ...primaryButtonStyle, background: '#7c3aed', width: '100%' }
const miniButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 12, padding: '9px 11px', background: '#0f172a', color: '#fff', fontWeight: 900 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.55 }
const workflowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12 }
const workflowStepStyle: React.CSSProperties = { display: 'grid', gap: 7, padding: 14, borderRadius: 18, background: '#f8fafc', border: '1px solid #dbe3ee', color: '#0f172a' }
const recordListStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const recordRowStyle = (tone: string): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'center', padding: 14, borderRadius: 18, background: `${tone}10`, border: `1px solid ${tone}33`, color: '#0f172a' })
const statusPillStyle = (tone: string): React.CSSProperties => ({ padding: '7px 10px', borderRadius: 999, background: `${tone}22`, border: `1px solid ${tone}55`, fontWeight: 950, fontSize: 12 })
const quickStatusStyle: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center' }
const smallSelectStyle: React.CSSProperties = { borderRadius: 12, border: '1px solid #cbd5e1', padding: '8px 9px', background: '#fff', color: '#0f172a', fontWeight: 800 }
const relatedStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const relatedCardStyle: React.CSSProperties = { display: 'grid', gap: 5, textDecoration: 'none', color: '#0f172a', padding: 14, borderRadius: 18, background: '#f8fafc', border: '1px solid #dbe3ee' }
const insightGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }
const insightStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 16, borderRadius: 18, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee', color: '#0f172a' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
const errorStyle: React.CSSProperties = { padding: 14, borderRadius: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontWeight: 850, marginBottom: 12 }
