import Link from 'next/link'

export function EmptyState({ title = 'Aucune donnée', text = 'Aucun élément disponible pour le moment.' }: { title?: string; text?: string }) {
  return <div style={emptyStyle}><strong>{title}</strong><span>{text}</span></div>
}

export function Panel({ title, subtitle, children, action }: { title?: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      {(title || subtitle || action) ? (
        <div style={panelHeaderStyle}>
          <div>
            {title ? <h2 style={titleStyle}>{title}</h2> : null}
            {subtitle ? <p style={subtitleStyle}>{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function KpiCard({ title, value, sub, tone = '#0f172a' }: { title: string; value: string | number; sub?: string; tone?: string }) {
  return <div style={kpiStyle}><span>{title}</span><strong style={{ color: tone }}>{value}</strong>{sub ? <small>{sub}</small> : null}</div>
}

export function WorkspaceHero({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section style={heroStyle}>
      <div>
        {eyebrow ? <div style={eyebrowStyle}>{eyebrow}</div> : null}
        <h1 style={heroTitleStyle}>{title}</h1>
        {subtitle ? <p style={heroSubtitleStyle}>{subtitle}</p> : null}
      </div>
      {children ? <div>{children}</div> : null}
    </section>
  )
}

export function TaskCard({ task, href }: { task: any; href?: string }) {
  const body = (
    <article style={taskCardStyle}>
      <div style={taskTopStyle}>
        <span style={badgeStyle}>{task?.status || 'open'}</span>
        <span style={badgeLightStyle}>{task?.priority || 'medium'}</span>
      </div>
      <h3 style={taskTitleStyle}>{task?.title || 'Untitled task'}</h3>
      <p style={taskTextStyle}>{task?.description || 'No description provided.'}</p>
      <small style={taskMetaStyle}>{task?.related_type || 'general'} {task?.due_at ? `• due ${new Date(task.due_at).toLocaleDateString('fr-FR')}` : ''}</small>
    </article>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{body}</Link> : body
}

export function formatCurrency(value?: number | string | null) {
  return `${Number(value || 0).toLocaleString('fr-FR')} MAD`
}

const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const panelHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 18 }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const subtitleStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)', color: '#0f172a' }
const emptyStyle: React.CSSProperties = { padding: 20, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', display: 'grid', gap: 6, fontWeight: 800 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 22, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#2563eb,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#dbeafe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 950 }
const heroSubtitleStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', fontWeight: 750, maxWidth: 780, lineHeight: 1.6 }
const taskCardStyle: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 20, padding: 16, background: 'linear-gradient(180deg,#fff,#f8fafc)', display: 'grid', gap: 10, color: '#0f172a' }
const taskTopStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '5px 9px', borderRadius: 999, background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 950 }
const badgeLightStyle: React.CSSProperties = { display: 'inline-flex', padding: '5px 9px', borderRadius: 999, background: '#f1f5f9', color: '#334155', fontSize: 11, fontWeight: 950 }
const taskTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 17, fontWeight: 950 }
const taskTextStyle: React.CSSProperties = { margin: 0, color: '#64748b', lineHeight: 1.55, fontWeight: 700 }
const taskMetaStyle: React.CSSProperties = { color: '#475569', fontWeight: 850 }
