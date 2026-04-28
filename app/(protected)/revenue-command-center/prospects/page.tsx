import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { Badge, EmptyState, KpiCard, Panel, TableShell, WorkspaceHero, formatCurrency, safeDate } from '../_components/BDWorkspacePrimitives'

export default async function ProspectsDatabasePage({ searchParams }: { searchParams?: Promise<{ segment?: string; status?: string; city?: string }> }) {
  await requireRole(['ceo', 'manager'])
  const filters = await searchParams
  const supabase = await createClient()

  let query = supabase.from('bd_prospects').select('*').order('priority_score', { ascending: false }).order('created_at', { ascending: false })
  if (filters?.segment && filters.segment !== 'all') query = query.eq('segment', filters.segment)
  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters?.city) query = query.ilike('city', `%${filters.city}%`)
  const { data } = await query
  const prospects = data || []

  const forecast = prospects.reduce((s: number, p: any) => s + Number(p.estimated_value || 0), 0)
  const strategic = prospects.filter((p: any) => Number(p.priority_score || 0) >= 80).length

  return (
    <AppShell title="Prospect Database" subtitle="Base prospects stratégique B2C/B2B avec segmentation, priorités et valeur potentielle." breadcrumbs={[{ label: 'Revenue', href: '/revenue-command-center' }, { label: 'Prospects' }]} actions={<PageAction href="/revenue-command-center/business-development" variant="light">BD Workspace</PageAction>}>
      <div style={pageStyle}>
        <WorkspaceHero badge="Prospect Intelligence" title="Prospect Database Management" subtitle="Centralisez les prospects familles, écoles, crèches, cliniques, entreprises et partenaires. Chaque prospect doit avoir segment, statut, potentiel, prochaine action et propriétaire." />
        <section style={kpiGridStyle}>
          <KpiCard label="Prospects filtrés" value={prospects.length} sub="base exploitable" tone="blue" />
          <KpiCard label="Stratégiques" value={strategic} sub="score ≥ 80" tone="purple" />
          <KpiCard label="Forecast" value={formatCurrency(forecast)} sub="valeur estimée" tone="green" />
          <KpiCard label="Sans owner" value={prospects.filter((p: any) => !p.owner_user_id).length} sub="à assigner" tone="red" />
        </section>

        <form style={filterStyle}>
          <strong>Filtres</strong>
          <select name="segment" defaultValue={filters?.segment || 'all'} style={inputStyle}><option value="all">Tous segments</option><option value="b2c">B2C</option><option value="b2b">B2B</option><option value="partner">Partenaires</option></select>
          <select name="status" defaultValue={filters?.status || 'all'} style={inputStyle}><option value="all">Tous statuts</option><option value="new">Nouveau</option><option value="qualified">Qualifié</option><option value="proposal">Proposition</option><option value="won">Gagné</option><option value="lost">Perdu</option></select>
          <input name="city" defaultValue={filters?.city || ''} placeholder="Ville..." style={inputStyle} />
          <button style={buttonStyle}>Filtrer</button>
        </form>

        <Panel title="Base prospects" subtitle="Cliquez un prospect pour entrer dans son workspace CRM complet.">
          {prospects.length ? <TableShell><table style={tableStyle}><thead><tr><th style={th}>Prospect</th><th style={th}>Segment</th><th style={th}>Ville</th><th style={th}>Statut</th><th style={th}>Score</th><th style={th}>Valeur</th><th style={th}>Action</th></tr></thead><tbody>{prospects.map((p: any) => <tr key={p.id}><td style={td}><strong>{p.name}</strong><br/><small>{p.contact_name || '—'}</small></td><td style={td}><Badge tone={p.segment === 'b2b' ? 'purple' : 'green'}>{p.segment || '—'}</Badge></td><td style={td}>{p.city || '—'}</td><td style={td}>{p.status || 'new'}</td><td style={td}>{p.priority_score || 0}</td><td style={td}>{formatCurrency(Number(p.estimated_value || 0))}</td><td style={td}><a href={`/revenue-command-center/prospects/${p.id}`} style={linkStyle}>Ouvrir</a></td></tr>)}</tbody></table></TableShell> : <EmptyState text="Aucun prospect trouvé. Lancez une campagne ou importez une base ciblée." />}
        </Panel>
      </div>
    </AppShell>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const filterStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 190px 190px 190px auto', gap: 12, alignItems: 'center', background: '#fff', border: '1px solid #dbe3ee', borderRadius: 22, padding: 16 }
const inputStyle: React.CSSProperties = { padding: '12px 13px', borderRadius: 12, border: '1px solid #cbd5e1', background: '#f8fafc' }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 13, padding: '13px 18px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const th: React.CSSProperties = { textAlign: 'left', padding: 14, background: '#0f172a', color: '#fff' }
const td: React.CSSProperties = { padding: 14, borderBottom: '1px solid #e2e8f0', color: '#334155' }
const linkStyle: React.CSSProperties = { color: '#1d4ed8', fontWeight: 950, textDecoration: 'none' }
