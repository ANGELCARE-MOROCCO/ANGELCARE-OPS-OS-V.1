import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge, Kpi, Panel, RowLink, WorkspaceHero, money, statusTone } from '../_components/BDV3Primitives'

export default async function ProspectsPage({ searchParams }: { searchParams?: Promise<{ segment?: string; status?: string }> }) {
  const filters = await searchParams
  const supabase = await createClient()
  let q = supabase.from('bd_prospects').select('*').eq('is_archived', false).order('updated_at', { ascending: false })
  if (filters?.segment) q = q.eq('segment', filters.segment)
  if (filters?.status) q = q.eq('status', filters.status)
  const { data } = await q
  const prospects = data || []
  const value = prospects.reduce((s: number, p: any) => s + Number(p.estimated_value || 0), 0)
  return <AppShell title="Prospect Database" subtitle="Corporate prospecting database for B2B and B2C market domination." breadcrumbs={[{ label: 'Business Development', href: '/revenue-command-center/business-development' }, { label: 'Prospects' }]} actions={<PageAction href="/revenue-command-center/prospects/new">New prospect</PageAction>}>
    <div style={{ display: 'grid', gap: 20 }}>
      <WorkspaceHero title="Market Prospecting CRM" subtitle="Build the database, segment the market, assign ownership, track status and convert corporate opportunities into leads, appointments, partnerships and contracts." />
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}><Kpi title="Prospects" value={String(prospects.length)} /><Kpi title="Pipeline value" value={money(value)} tone="#16a34a" /><Kpi title="Qualified" value={String(prospects.filter((p:any)=>p.status==='qualified').length)} tone="#7c3aed" /><Kpi title="Proposal" value={String(prospects.filter((p:any)=>p.status==='proposal').length)} tone="#f59e0b" /></section>
      <Panel title="Prospect filters" subtitle="Quick segmentation."><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{['new','contacted','qualified','proposal','won','lost'].map((s) => <a key={s} href={`/revenue-command-center/prospects?status=${s}`} style={{ padding: '10px 13px', borderRadius: 14, background: '#fff', border: '1px solid #dbe3ee', textDecoration: 'none', color: '#0f172a', fontWeight: 900 }}>{s}</a>)}</div></Panel>
      <Panel title="Prospect workspace" subtitle="Click any prospect for CRM history, tasks, comments and next actions."><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>{prospects.map((p:any) => <RowLink key={p.id} href={`/revenue-command-center/prospects/${p.id}`}><strong>{p.company_name || p.contact_name || 'Unnamed prospect'}</strong><span>{p.city || 'No city'} • {p.segment || 'No segment'} • {money(p.estimated_value)}</span><Badge tone={statusTone[p.status] || '#2563eb'}>{p.status || 'new'}</Badge></RowLink>)}</div></Panel>
    </div>
  </AppShell>
}
