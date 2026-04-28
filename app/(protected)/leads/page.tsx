import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'

type Lead = Record<string, any>

const STAGES = [
  { key: 'new_lead', label: 'Nouveaux', icon: '✨' },
  { key: 'qualification', label: 'Qualification', icon: '🔎' },
  { key: 'proposal', label: 'Proposition', icon: '📄' },
  { key: 'negotiation', label: 'Négociation', icon: '🤝' },
  { key: 'converted', label: 'Convertis', icon: '✅' },
]

function low(v: unknown) { return String(v || '').toLowerCase() }
function money(v: unknown) { return `${Number(v || 0).toLocaleString('fr-FR')} MAD` }
function isOverdue(v: unknown) {
  if (!v) return false
  const today = new Date().toISOString().slice(0, 10)
  return String(v) < today
}
function leadName(l: Lead) { return l.full_name || l.parent_name || l.name || `Lead #${l.id}` }
function statusTone(l: Lead) {
  const s = low(l.status || l.pipeline_stage)
  if (s.includes('lost') || s.includes('cancel')) return '#ef4444'
  if (s.includes('converted') || s.includes('won')) return '#22c55e'
  if (s.includes('urgent') || s.includes('hot')) return '#f97316'
  if (s.includes('proposal') || s.includes('negotiation')) return '#3b82f6'
  return '#64748b'
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; archive?: string; stage?: string; priority?: string }>
}) {
  await requireRole(['ceo', 'manager', 'ops_admin', 'sales', 'coordinator'])
  const filters = await searchParams
  const q = String(filters?.q || '').trim()
  const archive = filters?.archive === '1'
  const stage = filters?.stage || 'all'
  const priority = filters?.priority || 'all'

  const supabase = await createClient()
  let query = supabase
    .from('leads')
    .select('*')
    .eq('is_archived', archive)
    .order('id', { ascending: false })

  if (stage !== 'all') query = query.eq('pipeline_stage', stage)
  if (priority !== 'all') query = query.eq('priority', priority)

  const { data, error } = await query
  const allLeads = ((data || []) as Lead[]).filter((lead) => {
    if (!q) return true
    const haystack = `${leadName(lead)} ${lead.phone || ''} ${lead.email || ''} ${lead.city || ''} ${lead.service_interest || ''}`.toLowerCase()
    return haystack.includes(q.toLowerCase())
  })

  const activeLeads = allLeads.filter((l) => !['converted', 'lost'].includes(low(l.pipeline_stage || l.status)))
  const hotLeads = allLeads.filter((l) => low(l.priority) === 'high' || Number(l.lead_score || 0) >= 75)
  const overdue = allLeads.filter((l) => isOverdue(l.next_action_date))
  const forecast = allLeads.reduce((sum, l) => sum + Number(l.expected_value || 0) * (Number(l.probability || 0) / 100), 0)
  const converted = allLeads.filter((l) => low(l.pipeline_stage || l.status).includes('converted')).length

  return (
    <AppShell
      title="Leads CRM Command Center"
      subtitle="Pipeline, qualification, follow-up, archive, conversion, forecast et priorités commerciales."
      breadcrumbs={[{ label: 'CRM Leads' }]}
      actions={
        <>
          <PageAction href="/leads/new">Nouveau lead</PageAction>
          <PageAction href={archive ? '/leads' : '/leads?archive=1'} variant="light">
            {archive ? 'Voir actifs' : 'Archive'}
          </PageAction>
        </>
      }
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={heroBadgeStyle}>⚡ Sales Operations Engine</div>
            <h1 style={heroTitleStyle}>{archive ? 'Archive leads' : 'Pipeline commercial actif'}</h1>
            <p style={heroTextStyle}>Vue manager pour prioriser les relances, sécuriser les conversions et contrôler la valeur prévisionnelle.</p>
          </div>
          <div style={heroRightStyle}>
            <div style={forecastLabelStyle}>Forecast pondéré</div>
            <strong>{money(forecast)}</strong>
            <span>{allLeads.length} leads dans la vue</span>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Leads visibles" value={String(allLeads.length)} sub={archive ? 'archivés' : 'actifs'} />
          <Kpi label="Actifs pipeline" value={String(activeLeads.length)} sub="à travailler" />
          <Kpi label="Hot leads" value={String(hotLeads.length)} sub="score/priority haut" />
          <Kpi label="Relances en retard" value={String(overdue.length)} sub="attention manager" danger={overdue.length > 0} />
          <Kpi label="Convertis" value={String(converted)} sub="dans cette vue" />
        </section>

        <form style={filterStyle}>
          <input name="q" defaultValue={q} placeholder="Recherche nom, téléphone, service, ville..." style={searchStyle} />
          <select name="stage" defaultValue={stage} style={inputStyle}>
            <option value="all">Toutes étapes</option>
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            <option value="lost">Perdus</option>
          </select>
          <select name="priority" defaultValue={priority} style={inputStyle}>
            <option value="all">Toutes priorités</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <input type="hidden" name="archive" value={archive ? '1' : '0'} />
          <button style={filterButtonStyle}>Filtrer</button>
        </form>

        {error ? <div style={dangerBoxStyle}>Erreur Supabase: {error.message}</div> : null}

        <section style={pipelineStyle}>
          {STAGES.map((stageItem) => {
            const items = allLeads.filter((l) => low(l.pipeline_stage || l.status || 'new_lead') === stageItem.key)
            return (
              <div key={stageItem.key} style={stageColumnStyle}>
                <div style={stageHeadStyle}><strong>{stageItem.icon} {stageItem.label}</strong><span>{items.length}</span></div>
                <div style={cardsStyle}>
                  {items.slice(0, 5).map((lead) => <LeadCard key={lead.id} lead={lead} />)}
                  {items.length === 0 ? <div style={emptyMiniStyle}>Aucun lead</div> : null}
                </div>
              </div>
            )
          })}
        </section>

        <section style={mainGridStyle}>
          <div style={panelStyle}>
            <Header title="Liste opérationnelle" subtitle="Tous les leads filtrés, avec archive conservée et actions depuis la fiche." />
            <div style={listStyle}>
              {allLeads.map((lead) => (
                <Link key={lead.id} href={`/leads/${lead.id}`} style={rowStyle}>
                  <div style={rowLeftStyle}>
                    <div style={{ ...statusDotStyle, background: statusTone(lead) }} />
                    <div>
                      <strong style={rowTitleStyle}>{leadName(lead)}</strong>
                      <p style={rowTextStyle}>{lead.phone || 'Téléphone —'} • {lead.city || 'Ville —'} • {lead.service_interest || 'Service à qualifier'}</p>
                    </div>
                  </div>
                  <div style={rowRightStyle}>
                    <span>{lead.pipeline_stage || lead.status || 'new_lead'}</span>
                    <small>{lead.next_action_date ? `Next: ${lead.next_action_date}` : 'Aucune relance'}</small>
                  </div>
                </Link>
              ))}
              {allLeads.length === 0 ? <div style={emptyStyle}>Aucun lead trouvé pour ces filtres.</div> : null}
            </div>
          </div>

          <aside style={panelStyle}>
            <Header title="Priorités manager" subtitle="Ce qui mérite une action maintenant." />
            <Priority title="Relances en retard" value={String(overdue.length)} tone="#ef4444" />
            <Priority title="Hot leads" value={String(hotLeads.length)} tone="#f97316" />
            <Priority title="Pipeline actif" value={String(activeLeads.length)} tone="#2563eb" />
            <div style={noteStyle}>
              <strong>Règle CEO</strong>
              <p>Chaque lead doit avoir une prochaine action datée, une étape pipeline, une priorité et une valeur estimée.</p>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Link href={`/leads/${lead.id}`} style={leadCardStyle}>
      <strong>{leadName(lead)}</strong>
      <span>{lead.service_interest || 'Besoin à qualifier'}</span>
      <small>{lead.phone || 'Sans téléphone'} • {lead.city || 'Ville —'}</small>
    </Link>
  )
}
function Kpi({ label, value, sub, danger }: { label: string; value: string; sub: string; danger?: boolean }) {
  return <div style={{ ...kpiStyle, borderColor: danger ? '#fecaca' : '#dbe3ee', background: danger ? '#fff7f7' : '#fff' }}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div>
}
function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 16 }}><h2 style={sectionTitleStyle}>{title}</h2><p style={sectionTextStyle}>{subtitle}</p></div> }
function Priority({ title, value, tone }: { title: string; value: string; tone: string }) { return <div style={{ ...priorityStyle, borderColor: `${tone}55`, background: `${tone}10` }}><span>{title}</span><strong style={{ color: tone }}>{value}</strong></div> }

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', padding: 30, borderRadius: 32, background: 'radial-gradient(circle at top left,#2563eb,#020617 65%)', color: '#fff', boxShadow: '0 30px 90px rgba(15,23,42,.28)' }
const heroBadgeStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 40, fontWeight: 1000, color: '#fff' }
const heroTextStyle: React.CSSProperties = { color: '#dbeafe', fontWeight: 750, maxWidth: 760 }
const heroRightStyle: React.CSSProperties = { minWidth: 260, padding: 20, borderRadius: 24, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.16)', display: 'grid', gap: 6 }
const forecastLabelStyle: React.CSSProperties = { color: '#bfdbfe', fontSize: 12, fontWeight: 950, textTransform: 'uppercase' }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 6, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const filterStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 190px 170px auto', gap: 12, padding: 16, borderRadius: 22, background: '#fff', border: '1px solid #dbe3ee' }
const searchStyle: React.CSSProperties = { padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1' }
const inputStyle: React.CSSProperties = { padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#f8fafc' }
const filterButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, padding: '13px 18px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const pipelineStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }
const stageColumnStyle: React.CSSProperties = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 22, padding: 12, minHeight: 220 }
const stageHeadStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, color: '#0f172a' }
const cardsStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const leadCardStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 12, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', textDecoration: 'none', color: '#0f172a' }
const emptyMiniStyle: React.CSSProperties = { padding: 12, borderRadius: 14, border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800, background: '#fff' }
const mainGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.45fr .55fr', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const sectionTitleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const sectionTextStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const listStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', padding: 15, borderRadius: 18, border: '1px solid #e2e8f0', background: '#fff', textDecoration: 'none' }
const rowLeftStyle: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center' }
const statusDotStyle: React.CSSProperties = { width: 12, height: 12, borderRadius: 999, boxShadow: '0 0 18px currentColor' }
const rowTitleStyle: React.CSSProperties = { color: '#0f172a', fontSize: 15 }
const rowTextStyle: React.CSSProperties = { margin: '5px 0 0', color: '#64748b', fontWeight: 700, fontSize: 13 }
const rowRightStyle: React.CSSProperties = { display: 'grid', gap: 5, textAlign: 'right', color: '#334155', fontWeight: 900 }
const priorityStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: 15, borderRadius: 18, border: '1px solid #dbe3ee', marginBottom: 10, fontWeight: 900 }
const noteStyle: React.CSSProperties = { marginTop: 16, padding: 16, borderRadius: 20, background: '#0f172a', color: '#fff' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
const dangerBoxStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#fff7f7', border: '1px solid #fecaca', color: '#991b1b', fontWeight: 900 }
