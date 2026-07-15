import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

type Lead = Record<string, any>

type User = { id: string; full_name: string | null; username: string | null; role: string | null }

const HOT_STAGES = ['new', 'qualified', 'proposal', 'negotiation']
const DONE_STAGES = ['converted', 'won']
const LOST_STAGES = ['lost', 'cancelled']

export default async function LeadsCommandCenterPage() {
  await requireRole(['ceo', 'manager', 'sales', 'ops_admin'])
  const supabase = await createClient()

  const { data: leadsRaw } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  const { data: usersRaw } = await supabase
    .from('app_users')
    .select('id, full_name, username, role')
    .order('full_name', { ascending: true })

  const leads = (leadsRaw || []) as Lead[]
  const users = (usersRaw || []) as User[]
  const active = leads.filter((l) => !bool(l.is_archived))
  const archived = leads.filter((l) => bool(l.is_archived))
  const overdue = active.filter((l) => isOverdue(l.next_action_date))
  const todayFollowups = active.filter((l) => isToday(l.next_action_date))
  const hot = active.filter((l) => HOT_STAGES.includes(stage(l)) || priority(l) === 'high')
  const converted = active.filter((l) => DONE_STAGES.includes(stage(l)))
  const lost = active.filter((l) => LOST_STAGES.includes(stage(l)))
  const pipelineValue = active.reduce((sum, l) => sum + value(l.estimated_value), 0)
  const forecastValue = active.reduce((sum, l) => sum + weightedValue(l), 0)

  const byStage = groupCount(active, (l) => stage(l))
  const byOwner = users.map((u) => ({
    user: u,
    leads: active.filter((l) => l.assigned_user_id === u.id),
  })).filter((row) => row.leads.length > 0)

  return (
    <AppShell
      title="Leads Command Center"
      subtitle="Vue manager des priorités commerciales, relances, pipeline et risques d’exécution."
      breadcrumbs={[{ label: 'Leads', href: '/leads' }, { label: 'Command Center' }]}
      actions={
        <>
          <PageAction href="/leads" variant="light">Retour leads</PageAction>
          <PageAction href="/leads/new">Nouveau lead</PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={badgeStyle}>⚡ Revenue Entry Point</div>
            <h1 style={heroTitleStyle}>Lead Operations Cockpit</h1>
            <p style={heroTextStyle}>Prioriser, relancer, convertir et empêcher les opportunités chaudes de dormir.</p>
          </div>
          <div style={heroPanelStyle}>
            <strong>{formatMoney(forecastValue)}</strong>
            <span>Forecast pondéré</span>
            <small>Pipeline brut: {formatMoney(pipelineValue)}</small>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi title="Leads actifs" value={String(active.length)} sub="hors archive" />
          <Kpi title="Relances aujourd’hui" value={String(todayFollowups.length)} sub="à traiter maintenant" tone={todayFollowups.length ? '#2563eb' : undefined} />
          <Kpi title="En retard" value={String(overdue.length)} sub="risque perte" tone={overdue.length ? '#ef4444' : undefined} />
          <Kpi title="Hot leads" value={String(hot.length)} sub="haute priorité" tone={hot.length ? '#f59e0b' : undefined} />
          <Kpi title="Convertis" value={String(converted.length)} sub="sur base active" tone="#22c55e" />
          <Kpi title="Archivés" value={String(archived.length)} sub="non actifs" />
        </section>

        <section style={gridStyle}>
          <div style={panelStyle}>
            <Header title="Priorités du jour" subtitle="Leads à contacter ou à escalader immédiatement." />
            <div style={listStyle}>
              {[...overdue, ...todayFollowups].slice(0, 12).map((lead) => <LeadRow key={lead.id} lead={lead} users={users} />)}
              {!overdue.length && !todayFollowups.length ? <Empty text="Aucune relance urgente pour aujourd’hui." /> : null}
            </div>
          </div>

          <aside style={sidePanelStyle}>
            <Header title="Diagnostic manager" subtitle="Lecture rapide du moteur commercial." />
            <Insight label="Danger principal" value={overdue.length ? `${overdue.length} relances en retard` : 'Aucun retard critique'} />
            <Insight label="Qualité pipeline" value={hot.length > converted.length ? 'Potentiel fort à travailler' : 'Stable'} />
            <Insight label="Action recommandée" value={overdue.length ? 'Traiter les retards avant nouveaux leads' : 'Accélérer les hot leads'} />
            <div style={darkNoteStyle}>
              <strong>CEO Note</strong>
              <p>Cette page ne remplace pas la liste Leads: elle sert à diriger l’exécution quotidienne.</p>
            </div>
          </aside>
        </section>

        <section style={panelStyle}>
          <Header title="Pipeline par étape" subtitle="Répartition opérationnelle du portefeuille actif." />
          <div style={stageGridStyle}>
            {Object.entries(byStage).map(([key, count]) => (
              <div key={key} style={stageCardStyle}>
                <span>{labelStage(key)}</span>
                <strong>{count}</strong>
              </div>
            ))}
            {!Object.keys(byStage).length ? <Empty text="Aucun lead actif disponible." /> : null}
          </div>
        </section>

        <section style={panelStyle}>
          <Header title="Charge par utilisateur" subtitle="Leads assignés et volume de suivi par membre d’équipe." />
          <div style={tableWrapStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Utilisateur</th>
                  <th style={thStyle}>Leads</th>
                  <th style={thStyle}>Hot</th>
                  <th style={thStyle}>En retard</th>
                  <th style={thStyle}>Valeur estimée</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {byOwner.map(({ user, leads }) => (
                  <tr key={user.id}>
                    <td style={tdStyle}><strong>{user.full_name || user.username}</strong></td>
                    <td style={tdStyle}>{leads.length}</td>
                    <td style={tdStyle}>{leads.filter((l) => priority(l) === 'high' || HOT_STAGES.includes(stage(l))).length}</td>
                    <td style={tdStyle}>{leads.filter((l) => isOverdue(l.next_action_date)).length}</td>
                    <td style={tdStyle}>{formatMoney(leads.reduce((s, l) => s + value(l.estimated_value), 0))}</td>
                    <td style={tdStyle}><a href={`/users/${user.id}/lead-portfolio`} style={linkStyle}>Voir portefeuille</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function LeadRow({ lead, users }: { lead: Lead; users: User[] }) {
  const owner = users.find((u) => u.id === lead.assigned_user_id)
  return (
    <a href={`/leads/${lead.id}`} style={leadRowStyle(priority(lead))}>
      <div>
        <strong>{lead.full_name || lead.name || lead.parent_name || lead.title || 'Lead sans nom'}</strong>
        <p>{lead.phone || lead.email || lead.source || 'Contact non renseigné'}</p>
      </div>
      <div style={rowMetaStyle}>
        <span>{labelStage(stage(lead))}</span>
        <small>{owner?.full_name || owner?.username || 'Non assigné'}</small>
        <small>{lead.next_action_date ? `Relance: ${lead.next_action_date}` : 'Pas de relance'}</small>
      </div>
    </a>
  )
}

function Kpi({ title, value, sub, tone }: { title: string; value: string; sub: string; tone?: string }) {
  return <div style={{ ...kpiStyle, borderColor: tone || '#dbe3ee' }}><span>{title}</span><strong style={{ color: tone || '#0f172a' }}>{value}</strong><small>{sub}</small></div>
}
function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 18 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div> }
function Insight({ label, value }: { label: string; value: string }) { return <div style={insightStyle}><span>{label}</span><strong>{value}</strong></div> }
function Empty({ text }: { text: string }) { return <div style={emptyStyle}>{text}</div> }
function bool(v: any) { return v === true || v === 'true' }
function stage(l: Lead) { return String(l.stage || l.status || 'new').toLowerCase() }
function priority(l: Lead) { return String(l.priority || 'medium').toLowerCase() }
function value(v: any) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0 }
function weightedValue(l: Lead) { const s = stage(l); const w = s === 'converted' || s === 'won' ? 1 : s === 'proposal' ? .65 : s === 'qualified' ? .45 : s === 'new' ? .2 : .1; return value(l.estimated_value) * w }
function isToday(date?: string) { if (!date) return false; return date === new Date().toISOString().slice(0, 10) }
function isOverdue(date?: string) { if (!date) return false; return date < new Date().toISOString().slice(0, 10) }
function groupCount(items: Lead[], fn: (l: Lead) => string) { return items.reduce<Record<string, number>>((acc, item) => { const k = fn(item); acc[k] = (acc[k] || 0) + 1; return acc }, {}) }
function labelStage(s: string) { return ({ new: 'Nouveau', qualified: 'Qualifié', proposal: 'Proposition', negotiation: 'Négociation', converted: 'Converti', won: 'Gagné', lost: 'Perdu', cancelled: 'Annulé' } as Record<string, string>)[s] || s }
function formatMoney(n: number) { return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(n || 0) }

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, padding: 30, borderRadius: 32, color: '#fff', background: 'radial-gradient(circle at top left,#2563eb,#020617 62%)', boxShadow: '0 32px 80px rgba(2,6,23,.34)' }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 40, fontWeight: 1000, letterSpacing: -0.8 }
const heroTextStyle: React.CSSProperties = { margin: '8px 0 0', color: 'rgba(255,255,255,.86)', fontWeight: 800 }
const heroPanelStyle: React.CSSProperties = { minWidth: 280, padding: 22, borderRadius: 26, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', gap: 6 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 7, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.35fr .65fr', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sidePanelStyle: React.CSSProperties = { ...panelStyle, position: 'sticky', top: 90 }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const listStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const leadRowStyle = (p: string): React.CSSProperties => ({ display: 'flex', justifyContent: 'space-between', gap: 16, padding: 15, borderRadius: 18, textDecoration: 'none', background: p === 'high' ? '#fff7ed' : '#f8fafc', border: `1px solid ${p === 'high' ? '#fb923c' : '#e2e8f0'}`, color: '#0f172a' })
const rowMetaStyle: React.CSSProperties = { display: 'grid', gap: 4, textAlign: 'right', color: '#475569', fontWeight: 800 }
const stageGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }
const stageCardStyle: React.CSSProperties = { display: 'grid', gap: 8, padding: 18, borderRadius: 18, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee', color: '#0f172a' }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 18, border: '1px solid #e2e8f0' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', background: '#fff' }
const thStyle: React.CSSProperties = { textAlign: 'left', padding: 14, background: '#0f172a', color: '#fff' }
const tdStyle: React.CSSProperties = { padding: 14, borderBottom: '1px solid #e2e8f0', color: '#334155' }
const insightStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 15, borderRadius: 18, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee', marginBottom: 10, color: '#0f172a' }
const darkNoteStyle: React.CSSProperties = { marginTop: 16, padding: 16, borderRadius: 20, background: '#0f172a', color: '#fff' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
const linkStyle: React.CSSProperties = { color: '#1d4ed8', fontWeight: 950, textDecoration: 'none' }
