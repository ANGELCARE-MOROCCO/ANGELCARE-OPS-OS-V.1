import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

type Lead = Record<string, any>

export default async function UserLeadPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ceo', 'manager', 'sales', 'ops_admin'])
  const { id } = await params
  const supabase = await createClient()
  const { data: user } = await supabase.from('app_users').select('*').eq('id', id).maybeSingle()
  if (!user) notFound()
  const { data } = await supabase.from('leads').select('*').eq('assigned_user_id', id).order('created_at', { ascending: false }).limit(500)
  const leads = (data || []) as Lead[]
  const active = leads.filter((l) => !bool(l.is_archived))
  const overdue = active.filter((l) => isOverdue(l.next_action_date))
  const today = active.filter((l) => isToday(l.next_action_date))
  const hot = active.filter((l) => priority(l) === 'high')
  return (
    <AppShell
      title={`Lead Portfolio — ${user.full_name || user.username}`}
      subtitle="Charge commerciale assignée, priorités de relance et risques individuels."
      breadcrumbs={[{ label: 'Utilisateurs', href: '/users' }, { label: user.full_name || user.username, href: `/users/${id}` }, { label: 'Lead Portfolio' }]}
      actions={<><PageAction href={`/users/${id}`} variant="light">Retour profil</PageAction><PageAction href="/leads/command-center">Command Center</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div><div style={badgeStyle}>👤 User Commercial Load</div><h1 style={heroTitleStyle}>{user.full_name || user.username}</h1><p style={heroTextStyle}>{user.job_title || 'Poste non défini'} • {user.department || 'Département non défini'}</p></div>
          <div style={heroPanelStyle}><strong>{active.length}</strong><span>Leads actifs assignés</span></div>
        </section>
        <section style={kpiGridStyle}>
          <Kpi title="Actifs" value={String(active.length)} sub="à travailler" />
          <Kpi title="Aujourd’hui" value={String(today.length)} sub="relances dues" tone="#2563eb" />
          <Kpi title="En retard" value={String(overdue.length)} sub="risque manager" tone={overdue.length ? '#ef4444' : undefined} />
          <Kpi title="Priorité haute" value={String(hot.length)} sub="hot leads" tone="#f59e0b" />
        </section>
        <section style={panelStyle}>
          <Header title="Portefeuille détaillé" subtitle="Tous les leads assignés à cet utilisateur." />
          <div style={listStyle}>
            {leads.map((lead) => <a key={lead.id} href={`/leads/${lead.id}`} style={leadStyle(priority(lead), bool(lead.is_archived))}><div><strong>{lead.full_name || lead.name || lead.parent_name || lead.title || 'Lead sans nom'}</strong><p>{lead.phone || lead.email || lead.source || 'Contact non renseigné'}</p></div><div style={{ textAlign: 'right' }}><strong>{labelStage(stage(lead))}</strong><p>{lead.next_action_date || 'Aucune relance'}</p></div></a>)}
            {!leads.length ? <Empty text="Aucun lead assigné à cet utilisateur." /> : null}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
function Kpi({ title, value, sub, tone }: { title: string; value: string; sub: string; tone?: string }) { return <div style={{ ...kpiStyle, borderColor: tone || '#dbe3ee' }}><span>{title}</span><strong style={{ color: tone || '#0f172a' }}>{value}</strong><small>{sub}</small></div> }
function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 18 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div> }
function Empty({ text }: { text: string }) { return <div style={emptyStyle}>{text}</div> }
function bool(v: any) { return v === true || v === 'true' }
function stage(l: Lead) { return String(l.stage || l.status || 'new').toLowerCase() }
function priority(l: Lead) { return String(l.priority || 'medium').toLowerCase() }
function isToday(date?: string) { if (!date) return false; return date === new Date().toISOString().slice(0, 10) }
function isOverdue(date?: string) { if (!date) return false; return date < new Date().toISOString().slice(0, 10) }
function labelStage(s: string) { return ({ new: 'Nouveau', qualified: 'Qualifié', proposal: 'Proposition', negotiation: 'Négociation', converted: 'Converti', won: 'Gagné', lost: 'Perdu', cancelled: 'Annulé' } as Record<string, string>)[s] || s }
const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#7c3aed,#020617 62%)', boxShadow: '0 32px 80px rgba(2,6,23,.34)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#ddd6fe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 40, fontWeight: 1000 }
const heroTextStyle: React.CSSProperties = { color: 'rgba(255,255,255,.86)', fontWeight: 800 }
const heroPanelStyle: React.CSSProperties = { minWidth: 230, padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', gap: 6 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const listStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const leadStyle = (p: string, archived: boolean): React.CSSProperties => ({ display: 'flex', justifyContent: 'space-between', gap: 16, padding: 15, borderRadius: 18, textDecoration: 'none', background: archived ? '#f1f5f9' : p === 'high' ? '#fff7ed' : '#f8fafc', border: `1px solid ${p === 'high' ? '#fb923c' : '#e2e8f0'}`, color: '#0f172a', opacity: archived ? .65 : 1 })
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
