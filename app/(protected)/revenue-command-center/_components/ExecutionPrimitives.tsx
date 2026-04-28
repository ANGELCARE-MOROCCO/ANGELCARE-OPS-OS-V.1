import Link from 'next/link'

export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate'

const tones: Record<Tone, { bg: string; border: string; text: string; soft: string }> = {
  blue: { bg: '#1d4ed8', border: '#bfdbfe', text: '#1e3a8a', soft: '#eff6ff' },
  green: { bg: '#16a34a', border: '#bbf7d0', text: '#166534', soft: '#f0fdf4' },
  amber: { bg: '#d97706', border: '#fde68a', text: '#92400e', soft: '#fffbeb' },
  red: { bg: '#dc2626', border: '#fecaca', text: '#991b1b', soft: '#fef2f2' },
  purple: { bg: '#7c3aed', border: '#ddd6fe', text: '#5b21b6', soft: '#f5f3ff' },
  slate: { bg: '#0f172a', border: '#cbd5e1', text: '#0f172a', soft: '#f8fafc' },
}

export function CockpitHero({ title, subtitle, right }: { title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <section style={heroStyle}>
      <div>
        <div style={heroBadge}>ANGELCARE REVENUE BACKOFFICE</div>
        <h1 style={heroTitle}>{title}</h1>
        <p style={heroText}>{subtitle}</p>
      </div>
      {right ? <div>{right}</div> : null}
    </section>
  )
}

export function ModuleTile({ href, title, subtitle, icon, tone = 'blue' }: { href: string; title: string; subtitle: string; icon: string; tone?: Tone }) {
  const t = tones[tone]
  return (
    <Link href={href} style={{ ...tileStyle, borderColor: t.border, background: `linear-gradient(180deg,#fff,${t.soft})` }}>
      <div style={{ ...tileIcon, background: t.soft, color: t.text }}>{icon}</div>
      <div>
        <strong style={tileTitle}>{title}</strong>
        <p style={tileText}>{subtitle}</p>
      </div>
    </Link>
  )
}

export function MetricCard({ label, value, sub, tone = 'blue' }: { label: string; value: string | number; sub?: string; tone?: Tone }) {
  const t = tones[tone]
  return (
    <div style={{ ...metricStyle, borderColor: t.border }}>
      <span style={metricLabel}>{label}</span>
      <strong style={{ ...metricValue, color: t.text }}>{value}</strong>
      {sub ? <small style={metricSub}>{sub}</small> : null}
    </div>
  )
}

export function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section style={panelStyle}>
      <div style={panelHead}>
        <div>
          <h2 style={panelTitle}>{title}</h2>
          {subtitle ? <p style={panelText}>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Tone = status === 'completed' ? 'green' : status === 'in_progress' ? 'blue' : status === 'waiting' ? 'amber' : status === 'cancelled' ? 'red' : 'purple'
  const t = tones[tone]
  return <span style={{ ...badgeStyle, background: t.soft, borderColor: t.border, color: t.text }}>{status.replaceAll('_', ' ')}</span>
}

export function PriorityBadge({ priority }: { priority: string }) {
  const tone: Tone = priority === 'urgent' ? 'red' : priority === 'high' ? 'amber' : priority === 'low' ? 'slate' : 'blue'
  const t = tones[tone]
  return <span style={{ ...badgeStyle, background: t.soft, borderColor: t.border, color: t.text }}>{priority}</span>
}

export function EmptyState({ text }: { text: string }) {
  return <div style={emptyStyle}>{text}</div>
}

export function TaskRow({ task, assigneeName }: { task: any; assigneeName?: string }) {
  const due = task.end_at ? new Date(task.end_at) : null
  const isOverdue = due && due.getTime() < Date.now() && task.status !== 'completed'
  return (
    <Link href={`/revenue-command-center/tasks/${task.id}`} style={{ ...taskRowStyle, borderColor: isOverdue ? '#fecaca' : '#e2e8f0', background: isOverdue ? '#fff7f7' : '#fff' }}>
      <div>
        <strong style={taskTitle}>{task.title}</strong>
        <p style={taskMeta}>{assigneeName || 'Non assigné'} • {task.linked_entity_type || 'general'} {task.linked_entity_label ? `• ${task.linked_entity_label}` : ''}</p>
      </div>
      <div style={taskBadges}>
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
        {isOverdue ? <span style={{ ...badgeStyle, color: '#991b1b', background: '#fef2f2', borderColor: '#fecaca' }}>overdue</span> : null}
      </div>
    </Link>
  )
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function linkedHref(type?: string | null, id?: string | null) {
  if (!type || !id) return null
  if (type === 'lead') return `/leads/${id}`
  if (type === 'prospect') return `/revenue-command-center/prospects/${id}`
  if (type === 'family') return `/families/${id}`
  if (type === 'campaign') return `/revenue-command-center/campaigns`
  if (type === 'appointment') return `/revenue-command-center/appointments`
  if (type === 'mission') return `/missions/${id}`
  if (type === 'contract') return `/contracts/${id}`
  return null
}

const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'center', padding: 32, borderRadius: 34, color: '#fff', background: 'radial-gradient(circle at top left,#2563eb,#020617 68%)', boxShadow: '0 34px 90px rgba(15,23,42,.32)', border: '1px solid rgba(255,255,255,.1)' }
const heroBadge: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontSize: 11, fontWeight: 950, letterSpacing: '.08em', marginBottom: 14 }
const heroTitle: React.CSSProperties = { margin: 0, fontSize: 40, fontWeight: 950, letterSpacing: '-.04em' }
const heroText: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', maxWidth: 820, fontWeight: 750, lineHeight: 1.6 }
const tileStyle: React.CSSProperties = { display: 'flex', gap: 14, alignItems: 'center', padding: 18, borderRadius: 22, border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0f172a', boxShadow: '0 18px 40px rgba(15,23,42,.05)' }
const tileIcon: React.CSSProperties = { width: 48, height: 48, borderRadius: 18, display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 950 }
const tileTitle: React.CSSProperties = { display: 'block', fontSize: 16, fontWeight: 950 }
const tileText: React.CSSProperties = { margin: '5px 0 0', color: '#64748b', lineHeight: 1.45, fontWeight: 700 }
const metricStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const metricLabel: React.CSSProperties = { color: '#64748b', fontSize: 12, fontWeight: 900 }
const metricValue: React.CSSProperties = { fontSize: 28, fontWeight: 950 }
const metricSub: React.CSSProperties = { color: '#64748b', fontWeight: 800 }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 20px 45px rgba(15,23,42,.06)' }
const panelHead: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 18 }
const panelTitle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 22, fontWeight: 950 }
const panelText: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', border: '1px solid', borderRadius: 999, padding: '6px 9px', fontSize: 11, fontWeight: 950, textTransform: 'capitalize' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
const taskRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', padding: 14, border: '1px solid #e2e8f0', borderRadius: 18, textDecoration: 'none', color: '#0f172a' }
const taskTitle: React.CSSProperties = { fontSize: 15, fontWeight: 950 }
const taskMeta: React.CSSProperties = { margin: '5px 0 0', color: '#64748b', fontSize: 12, fontWeight: 700 }
const taskBadges: React.CSSProperties = { display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }
