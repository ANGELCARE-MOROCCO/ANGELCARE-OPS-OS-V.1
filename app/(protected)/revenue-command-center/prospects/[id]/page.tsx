import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { CockpitHero, EmptyState, MetricCard, Panel, TaskRow, formatDateTime } from '../../_components/ExecutionPrimitives'

export default async function ProspectWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['ceo', 'manager', 'agent'])
  const { id } = await params
  const supabase = await createClient()

  const [{ data: prospect }, { data: tasks }, { data: logs }, { data: users }] = await Promise.all([
    supabase.from('bd_prospects').select('*').eq('id', id).maybeSingle(),
    supabase.from('bd_tasks').select('*').eq('linked_entity_type', 'prospect').eq('linked_entity_id', id).eq('is_archived', false).order('end_at', { ascending: true, nullsFirst: false }),
    supabase.from('bd_activity_logs').select('*').eq('prospect_id', id).order('created_at', { ascending: false }).limit(30),
    supabase.from('app_users').select('id, full_name, username'),
  ])

  if (!prospect) notFound()
  const userMap = new Map((users || []).map((u: any) => [u.id, u.full_name || u.username]))
  const rows = tasks || []
  const open = rows.filter((t: any) => t.status !== 'completed')
  const completed = rows.filter((t: any) => t.status === 'completed')

  return (
    <AppShell
      title={`Prospect — ${prospect.name || prospect.company_name || 'Workspace'}`}
      subtitle="Workspace CRM complet: profil, segmentation, tâches, historique, prochaine action et discipline commerciale."
      breadcrumbs={[{ label: 'Revenue', href: '/revenue-command-center' }, { label: 'Prospects', href: '/revenue-command-center/prospects' }, { label: prospect.name || prospect.company_name || 'Prospect' }]}
      actions={<><PageAction href="/revenue-command-center/prospects" variant="light">Base prospects</PageAction><PageAction href={`/revenue-command-center/tasks/new?linked_entity_type=prospect&linked_entity_id=${prospect.id}&linked_entity_label=${encodeURIComponent(prospect.name || prospect.company_name || 'Prospect')}`}>Créer tâche</PageAction></>}
    >
      <div style={pageStyle}>
        <CockpitHero title={prospect.name || prospect.company_name || 'Prospect'} subtitle={`${prospect.segment || 'segment non défini'} • ${prospect.city || 'ville non définie'} • ${prospect.status || 'statut non défini'}`} />
        <section style={metricsGrid}>
          <MetricCard label="Score" value={prospect.score || 0} sub="priorité stratégique" tone="purple" />
          <MetricCard label="Valeur estimée" value={`${Number(prospect.estimated_value || 0).toLocaleString('fr-FR')} MAD`} sub="forecast" tone="green" />
          <MetricCard label="Tasks ouvertes" value={open.length} sub="actions à faire" tone="amber" />
          <MetricCard label="Tasks terminées" value={completed.length} sub="exécution" tone="blue" />
        </section>
        <section style={gridStyle}>
          <Panel title="Profil & segmentation" subtitle="Informations utiles pour domination marché et qualification corporate.">
            <Info label="Segment" value={prospect.segment || '—'} />
            <Info label="Type" value={prospect.type || prospect.category || '—'} />
            <Info label="Ville" value={prospect.city || '—'} />
            <Info label="Téléphone" value={prospect.phone || '—'} />
            <Info label="Email" value={prospect.email || '—'} />
            <Info label="Next action" value={prospect.next_action || '—'} />
          </Panel>
          <Panel title="Tasks liées" subtitle="Toutes les actions sur ce prospect.">
            <div style={{ display: 'grid', gap: 10 }}>
              {rows.map((task: any) => <TaskRow key={task.id} task={task} assigneeName={userMap.get(task.assigned_to)} />)}
              {!rows.length ? <EmptyState text="Aucune tâche liée à ce prospect. Créez une prochaine action." /> : null}
            </div>
          </Panel>
        </section>
        <Panel title="Historique CRM" subtitle="Logs, actions et signaux disponibles.">
          <div style={{ display: 'grid', gap: 10 }}>
            {(logs || []).map((log: any) => <div key={log.id} style={logCard}><strong>{log.action || log.event_type || 'activity'}</strong><span>{formatDateTime(log.created_at)}</span></div>)}
            {!(logs || []).length ? <EmptyState text="Aucune activité CRM enregistrée pour ce prospect." /> : null}
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

function Info({ label, value }: { label: string; value: string }) { return <div style={infoCard}><span>{label}</span><strong>{value}</strong></div> }

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const metricsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '.85fr 1.15fr', gap: 18, alignItems: 'start' }
const infoCard: React.CSSProperties = { display: 'grid', gap: 5, padding: 13, borderRadius: 15, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 8 }
const logCard: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, padding: 13, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }
