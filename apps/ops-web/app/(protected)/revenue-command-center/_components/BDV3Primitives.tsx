import Link from 'next/link'

export const statusTone: Record<string, string> = {
  open: '#2563eb', waiting: '#f59e0b', in_progress: '#7c3aed', completed: '#16a34a', cancelled: '#64748b',
  new: '#2563eb', contacted: '#0ea5e9', qualified: '#7c3aed', proposal: '#f59e0b', won: '#16a34a', lost: '#dc2626',
  planning: '#64748b', active: '#16a34a', paused: '#f59e0b', completed_campaign: '#16a34a',
  identified: '#2563eb', discussion: '#7c3aed', negotiation: '#f59e0b', signed: '#16a34a',
}

export function money(value: any) {
  const n = Number(value || 0)
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n)
}

export function dateTime(value: any) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function isOverdue(value: any) {
  return value && new Date(value).getTime() < Date.now()
}

export function WorkspaceHero({ title, subtitle, actions }: { title: string; subtitle: string; actions?: React.ReactNode }) {
  return (
    <section style={heroStyle}>
      <div>
        <div style={heroBadgeStyle}>ANGELCARE REVENUE BACKOFFICE</div>
        <h1 style={heroTitleStyle}>{title}</h1>
        <p style={heroTextStyle}>{subtitle}</p>
      </div>
      <div style={heroActionsStyle}>{actions}</div>
    </section>
  )
}

export function Kpi({ title, value, sub, tone = '#2563eb' }: { title: string; value: string; sub?: string; tone?: string }) {
  return <div style={{ ...kpiStyle, borderColor: `${tone}55` }}><span>{title}</span><strong style={{ color: tone }}>{value}</strong><small>{sub || 'Live operational signal'}</small></div>
}

export function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div><h2 style={panelTitleStyle}>{title}</h2>{subtitle ? <p style={panelTextStyle}>{subtitle}</p> : null}</div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Badge({ children, tone = '#2563eb' }: { children: React.ReactNode; tone?: string }) {
  return <span style={{ ...badgeStyle, color: tone, background: `${tone}14`, borderColor: `${tone}44` }}>{children}</span>
}

export function Empty({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

export function Field({ name, label, type = 'text', defaultValue, placeholder, required }: { name: string; label: string; type?: string; defaultValue?: any; placeholder?: string; required?: boolean }) {
  return <label style={fieldStyle}><span>{label}</span><input required={required} name={name} type={type} defaultValue={defaultValue || ''} placeholder={placeholder} style={inputStyle} /></label>
}

export function TextArea({ name, label, defaultValue, placeholder }: { name: string; label: string; defaultValue?: any; placeholder?: string }) {
  return <label style={fieldStyle}><span>{label}</span><textarea name={name} defaultValue={defaultValue || ''} placeholder={placeholder} style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} /></label>
}

export function Select({ name, label, options, defaultValue }: { name: string; label: string; options: { value: string; label: string }[]; defaultValue?: string }) {
  return <label style={fieldStyle}><span>{label}</span><select name={name} defaultValue={defaultValue || options[0]?.value} style={inputStyle}>{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
}

export function ActionLink({ href, children, variant = 'dark' }: { href: string; children: React.ReactNode; variant?: 'dark' | 'light' | 'danger' }) {
  const style = variant === 'dark' ? actionDarkStyle : variant === 'danger' ? actionDangerStyle : actionLightStyle
  return <Link href={href} style={style}>{children}</Link>
}

export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} style={rowLinkStyle}>{children}</Link>
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#2563eb,#020617 66%)', boxShadow: '0 32px 80px rgba(15,23,42,.22)' }
const heroBadgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 11px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 40, fontWeight: 950, letterSpacing: -1 }
const heroTextStyle: React.CSSProperties = { margin: '9px 0 0', color: '#dbeafe', fontWeight: 750, maxWidth: 820, lineHeight: 1.6 }
const heroActionsStyle: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start', marginBottom: 18 }
const panelTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const panelTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750, lineHeight: 1.5 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 999, border: '1px solid', fontWeight: 950, fontSize: 12 }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8, color: '#334155', fontWeight: 900, fontSize: 13 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const actionDarkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#0f172a', color: '#fff', textDecoration: 'none', fontWeight: 950 }
const actionLightStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee', textDecoration: 'none', fontWeight: 950 }
const actionDangerStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '12px 15px', borderRadius: 14, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', textDecoration: 'none', fontWeight: 950 }
const rowLinkStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 15, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', textDecoration: 'none' }
