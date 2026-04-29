import Link from 'next/link'

export function WorkspaceHero({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <section style={heroStyle}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {eyebrow ? <div style={eyebrowStyle}>{eyebrow}</div> : null}
        <h1 style={heroTitleStyle}>{title}</h1>
        <p style={heroTextStyle}>{subtitle}</p>
      </div>
      {right ? <div style={{ position: 'relative', zIndex: 1 }}>{right}</div> : null}
      <div style={glowStyle} />
    </section>
  )
}

export function KpiCard({ label, value, sub, tone = 'blue' }: { label: string; value: React.ReactNode; sub?: string; tone?: 'blue'|'green'|'red'|'amber'|'purple'|'slate' }) {
  const color = toneColor(tone)
  return <div style={{ ...kpiStyle, borderColor: `${color}55`, boxShadow: `0 18px 42px ${color}18` }}><span style={kpiLabelStyle}>{label}</span><strong style={kpiValueStyle}>{value}</strong>{sub ? <small style={{ color }}>{sub}</small> : null}</div>
}

export function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section style={panelStyle}><div style={panelHeadStyle}><div><h2 style={sectionTitleStyle}>{title}</h2>{subtitle ? <p style={sectionTextStyle}>{subtitle}</p> : null}</div>{action}</div>{children}</section>
}

export function Badge({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue'|'green'|'red'|'amber'|'purple'|'slate' }) {
  const color = toneColor(tone)
  return <span style={{ ...badgeStyle, background: `${color}18`, color, borderColor: `${color}55` }}>{children}</span>
}

export function EmptyState({ text }: { text: string }) { return <div style={emptyStyle}>{text}</div> }

export function ActionLink({ href, children, tone = 'dark' }: { href: string; children: React.ReactNode; tone?: 'dark'|'light'|'green'|'red' }) {
  return <Link href={href} style={{ ...actionLinkStyle, ...actionTone(tone) }}>{children}</Link>
}

export function TaskCard({ task, assigneeName }: { task: any; assigneeName?: string }) {
  const danger = task.end_at && new Date(task.end_at).getTime() < Date.now() && task.status !== 'completed'
  return <Link href={`/revenue-command-center/tasks/${task.id}`} style={{ ...taskStyle, borderColor: danger ? '#ef4444' : '#dbe3ee' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{task.title}</strong><Badge tone={danger ? 'red' : task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'amber' : 'blue'}>{danger ? 'OVERDUE' : task.priority || 'medium'}</Badge></div>
    <p style={{ margin: '8px 0', color: '#64748b', fontWeight: 750 }}>{task.description || 'Aucune description.'}</p>
    <div style={miniMetaStyle}><span>👤 {assigneeName || 'Sans owner'}</span><span>⏱ {task.end_at ? safeDate(task.end_at) : 'Sans deadline'}</span></div>
  </Link>
}

export function ProspectCard({ prospect }: { prospect: any }) {
  return <Link href={`/revenue-command-center/prospects/${prospect.id}`} style={taskStyle}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{prospect.name || prospect.company_name || 'Prospect'}</strong><Badge tone={prospect.segment === 'b2b' ? 'purple' : 'green'}>{prospect.segment || 'segment'}</Badge></div>
    <p style={{ margin: '8px 0', color: '#64748b', fontWeight: 750 }}>{prospect.city || 'Ville non définie'} • {prospect.stage || prospect.status || 'nouveau'}</p>
    <div style={miniMetaStyle}><span>💰 {formatCurrency(prospect.estimated_value || 0)}</span><span>🎯 Score {prospect.score || 0}</span></div>
  </Link>
}

export function formatCurrency(value: any) { return `${Number(value || 0).toLocaleString('fr-FR')} MAD` }
export function safeDate(value?: string | null) { if (!value) return '—'; try { return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) } catch { return '—' } }
export function toneColor(tone: string) { return tone === 'green' ? '#16a34a' : tone === 'red' ? '#dc2626' : tone === 'amber' ? '#d97706' : tone === 'purple' ? '#7c3aed' : tone === 'slate' ? '#475569' : '#2563eb' }
function actionTone(tone: string) { if (tone === 'light') return { background: '#fff', color: '#0f172a', border: '1px solid #dbe3ee' }; if (tone === 'green') return { background: '#16a34a', color: '#fff' }; if (tone === 'red') return { background: '#dc2626', color: '#fff' }; return { background: '#0f172a', color: '#fff' } }

const heroStyle: React.CSSProperties = { position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: 32, borderRadius: 34, background: 'linear-gradient(135deg,#172554,#020617 68%)', color: '#fff', boxShadow: '0 32px 80px rgba(15,23,42,.28)' }
const glowStyle: React.CSSProperties = { position: 'absolute', width: 360, height: 360, right: -100, top: -150, background: 'radial-gradient(circle,rgba(59,130,246,.35),transparent 62%)', filter: 'blur(18px)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontWeight: 950, fontSize: 12, letterSpacing: '.08em', marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 38, fontWeight: 1000, letterSpacing: -0.7 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', fontWeight: 800, lineHeight: 1.6, maxWidth: 780 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7 }
const kpiLabelStyle: React.CSSProperties = { color: '#64748b', fontWeight: 900, fontSize: 12 }
const kpiValueStyle: React.CSSProperties = { color: '#0f172a', fontSize: 28, fontWeight: 1000 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 40px rgba(15,23,42,.06)' }
const panelHeadStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start', marginBottom: 18 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 1000 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 800 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', border: '1px solid', padding: '5px 9px', borderRadius: 999, fontSize: 11, fontWeight: 950 }
const emptyStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 850 }
const actionLinkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, padding: '11px 14px', textDecoration: 'none', fontWeight: 950 }
const taskStyle: React.CSSProperties = { display: 'grid', gap: 6, textDecoration: 'none', background: '#fff', border: '1px solid #dbe3ee', borderRadius: 18, padding: 14, color: '#0f172a' }
const miniMetaStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, color: '#64748b', fontSize: 12, fontWeight: 850 }
