import Link from 'next/link'
import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { archiveFamily } from '../archive-action'

function text(value: any, fallback = '—') { return value === null || value === undefined || value === '' ? fallback : String(value) }
function date(value: any) { return value ? new Date(value).toLocaleString('fr-FR') : '—' }

export default async function FamilyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const familyId = Number(id)
  const supabase = await createClient()

  const [familyRes, leadsRes, missionsRes, notesRes, contractsRes] = await Promise.all([
    supabase.from('families').select('*').eq('id', familyId).maybeSingle(),
    supabase.from('leads').select('*').eq('family_id', familyId).order('id', { ascending: false }).limit(8),
    supabase.from('missions').select('*').eq('family_id', familyId).order('id', { ascending: false }).limit(10),
    supabase.from('family_notes').select('*').eq('family_id', familyId).order('created_at', { ascending: false }).limit(8),
    supabase.from('contracts').select('*').eq('family_id', familyId).order('id', { ascending: false }).limit(6),
  ])

  const family = familyRes.data as any
  const leads = leadsRes.data || []
  const missions = missionsRes.data || []
  const notes = notesRes.data || []
  const contracts = contractsRes.data || []

  if (!family) {
    return <AppShell title="Famille introuvable" subtitle="Aucune fiche famille disponible."><Link href="/families">Retour familles</Link></AppShell>
  }

  const activeMissions = missions.filter((m: any) => ['planned', 'active', 'confirmed', 'in_progress'].includes((m.status || '').toLowerCase())).length
  const incidents = missions.filter((m: any) => ['incident', 'blocked', 'urgent'].includes((m.status || '').toLowerCase())).length
  const risk = family.risk_level || (incidents > 0 ? 'high' : 'normal')

  return (
    <AppShell
      title={family.family_name || family.parent_name || `Famille #${family.id}`}
      subtitle="Fiche client 360° : besoin familial, historique missions, leads, contrats et lecture manager."
      breadcrumbs={[{ label: 'Families', href: '/families' }, { label: family.family_name || `#${family.id}` }]}
      actions={<><PageAction href="/families" variant="light">Retour</PageAction><PageAction href={`/missions/new?family_id=${family.id}`} variant="light">Créer mission</PageAction></>}
    >
      <div style={pageStyle}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>Family 360 Command File</div>
            <h1 style={heroTitleStyle}>{family.family_name || family.parent_name || `Famille #${family.id}`}</h1>
            <p style={heroTextStyle}>{text(family.city)} • {text(family.zone)} • Parent: {text(family.parent_name)}</p>
            <div style={tagRowStyle}><span>📞 {text(family.phone)}</span><span>🧒 {text(family.children_count ?? 0)} enfant(s)</span><span>⭐ {text(family.family_segment || family.status, 'standard')}</span></div>
          </div>
          <div style={statusPanelStyle(risk)}>
            <strong>{String(risk).toUpperCase()}</strong>
            <span>Niveau de vigilance famille</span>
          </div>
        </section>

        <section style={kpiGridStyle}>
          <Kpi label="Missions" value={missions.length} sub="historique récent" />
          <Kpi label="Actives" value={activeMissions} sub="en cours / planifiées" />
          <Kpi label="Leads" value={leads.length} sub="opportunités liées" />
          <Kpi label="Contrats" value={contracts.length} sub="documents / ventes" />
          <Kpi label="Notes" value={notes.length} sub="suivi relation" />
          <Kpi label="Alertes" value={incidents} sub="statuts sensibles" />
        </section>

        <section style={gridStyle}>
          <div style={panelStyle}>
            <Header title="Profil famille" subtitle="Informations client et contexte de service." />
            <div style={infoGridStyle}>
              <Info label="Parent" value={family.parent_name} />
              <Info label="Téléphone" value={family.phone} />
              <Info label="Téléphone 2" value={family.secondary_phone} />
              <Info label="Adresse" value={family.address} />
              <Info label="Ville" value={family.city} />
              <Info label="Zone" value={family.zone} />
              <Info label="Source" value={family.source} />
              <Info label="Statut" value={family.status} />
            </div>
          </div>

          <aside style={panelStyle}>
            <Header title="Lecture manager" subtitle="Décision rapide pour opération." />
            <Insight label="Priorité" value={family.priority || (risk === 'high' ? 'Haute' : 'Standard')} />
            <Insight label="Action recommandée" value={activeMissions === 0 ? 'Proposer mission / suivi commercial' : 'Suivi qualité service'} />
            <Insight label="Review" value={family.next_review_at ? date(family.next_review_at) : 'Non programmée'} />
            <form action={archiveFamily} style={{ marginTop: 16 }}>
              <input type="hidden" name="family_id" value={family.id} />
              <button style={archiveButtonStyle}>Archiver famille</button>
            </form>
          </aside>
        </section>

        <section style={panelStyle}>
          <Header title="Besoin enfant & préférences service" subtitle="Données utiles pour matching, briefing intervenante et qualité." />
          <div style={briefStyle}>
            <Block title="Âges enfants" value={family.children_ages} />
            <Block title="Créneaux préférés" value={family.preferred_schedule} />
            <Block title="Préférences service" value={family.service_preferences} />
            <Block title="Besoins spécifiques" value={family.special_needs} />
            <Block title="Notes internes" value={family.notes} />
          </div>
        </section>

        <section style={gridStyle}>
          <Related title="Missions liées" items={missions} empty="Aucune mission liée." hrefBase="/missions" labelKey="service_type" />
          <Related title="Leads liés" items={leads} empty="Aucun lead lié." hrefBase="/leads" labelKey="service_interest" />
        </section>

        <section style={gridStyle}>
          <Related title="Contrats" items={contracts} empty="Aucun contrat lié." hrefBase="/contracts" labelKey="contract_type" />
          <div style={panelStyle}>
            <Header title="Notes relationnelles" subtitle="Derniers éléments de contexte." />
            {notes.length ? notes.map((n: any) => <div key={n.id} style={itemStyle}><strong>{text(n.note_type, 'Note')}</strong><p>{text(n.content || n.note)}</p><small>{date(n.created_at)}</small></div>) : <Empty text="Aucune note." />}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function Kpi({ label, value, sub }: { label: string; value: any; sub: string }) { return <div style={kpiStyle}><span>{label}</span><strong>{value}</strong><small>{sub}</small></div> }
function Header({ title, subtitle }: { title: string; subtitle: string }) { return <div style={{ marginBottom: 18 }}><h2 style={titleStyle}>{title}</h2><p style={subStyle}>{subtitle}</p></div> }
function Info({ label, value }: { label: string; value: any }) { return <div style={infoStyle}><span>{label}</span><strong>{text(value)}</strong></div> }
function Insight({ label, value }: { label: string; value: any }) { return <div style={insightStyle}><span>{label}</span><strong>{text(value)}</strong></div> }
function Block({ title, value }: { title: string; value: any }) { return <div style={blockStyle}><strong>{title}</strong><p>{text(value, 'Non renseigné')}</p></div> }
function Empty({ text }: { text: string }) { return <div style={emptyStyle}>{text}</div> }
function Related({ title, items, empty, hrefBase, labelKey }: { title: string; items: any[]; empty: string; hrefBase: string; labelKey: string }) { return <div style={panelStyle}><Header title={title} subtitle="Historique connecté à cette famille." />{items.length ? items.map((i) => <Link key={i.id} href={`${hrefBase}/${i.id}`} style={itemLinkStyle}><strong>#{i.id} • {text(i[labelKey] || i.title || i.status)}</strong><span>{text(i.status)} • {date(i.created_at || i.mission_date)}</span></Link>) : <Empty text={empty} />}</div> }

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const heroStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, padding: 32, borderRadius: 34, color: '#fff', background: 'radial-gradient(circle at top left,#1d4ed8,#020617 68%)', boxShadow: '0 30px 80px rgba(2,6,23,.3)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#bfdbfe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, color: '#fff', fontSize: 40, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '8px 0', color: 'rgba(255,255,255,.85)', fontWeight: 800 }
const tagRowStyle: React.CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', color: '#e2e8f0', fontWeight: 800, fontSize: 13 }
const statusPanelStyle = (risk: any): React.CSSProperties => ({ minWidth: 260, padding: 22, borderRadius: 26, background: String(risk).toLowerCase() === 'high' ? 'rgba(239,68,68,.16)' : 'rgba(34,197,94,.14)', border: '1px solid rgba(255,255,255,.2)', display: 'grid', gap: 6 })
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const kpiStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 18, display: 'grid', gap: 6, color: '#0f172a', boxShadow: '0 18px 38px rgba(15,23,42,.05)' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 18, alignItems: 'start' }
const panelStyle: React.CSSProperties = { background: '#fff', border: '1px solid #dbe3ee', borderRadius: 26, padding: 22, boxShadow: '0 18px 38px rgba(15,23,42,.06)' }
const titleStyle: React.CSSProperties = { margin: 0, color: '#0f172a', fontSize: 23, fontWeight: 950 }
const subStyle: React.CSSProperties = { margin: '7px 0 0', color: '#64748b', fontWeight: 750 }
const infoGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }
const infoStyle: React.CSSProperties = { display: 'grid', gap: 5, padding: 13, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }
const insightStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 15, borderRadius: 18, background: 'linear-gradient(180deg,#f8fafc,#eef2ff)', border: '1px solid #dbe3ee', marginBottom: 10, color: '#0f172a' }
const archiveButtonStyle: React.CSSProperties = { width: '100%', border: 'none', borderRadius: 14, padding: '13px 16px', background: '#991b1b', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const briefStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }
const blockStyle: React.CSSProperties = { padding: 16, borderRadius: 18, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }
const itemStyle: React.CSSProperties = { padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 10, color: '#334155' }
const itemLinkStyle: React.CSSProperties = { ...itemStyle, display: 'grid', gap: 6, textDecoration: 'none' }
const emptyStyle: React.CSSProperties = { padding: 18, borderRadius: 18, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 800 }
