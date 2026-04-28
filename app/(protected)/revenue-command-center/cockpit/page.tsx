import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { CockpitHero, EmptyState, MetricCard, ModuleTile, Panel, TaskRow } from '../_components/ExecutionPrimitives'

export default async function RevenueBackofficeCockpitPage() {
  await requireRole(['ceo', 'manager', 'agent'])
  const supabase = await createClient()

  const [tasksRes, usersRes, prospectsRes, leadsRes, campaignsRes, appointmentsRes] = await Promise.all([
    supabase.from('bd_tasks').select('*').eq('is_archived', false).order('end_at', { ascending: true, nullsFirst: false }).limit(80),
    supabase.from('app_users').select('id, full_name, username, role, status'),
    supabase.from('bd_prospects').select('*').limit(100),
    supabase.from('leads').select('*').limit(100),
    supabase.from('bd_campaigns').select('*').limit(100),
    supabase.from('bd_appointments').select('*').limit(100),
  ])

  const tasks = tasksRes.data || []
  const users = usersRes.data || []
  const prospects = prospectsRes.data || []
  const leads = leadsRes.data || []
  const campaigns = campaignsRes.data || []
  const appointments = appointmentsRes.data || []
  const userMap = new Map(users.map((u: any) => [u.id, u.full_name || u.username]))
  const now = Date.now()
  const dueSoon = tasks.filter((t: any) => t.end_at && new Date(t.end_at).getTime() >= now && new Date(t.end_at).getTime() <= now + 24 * 3600 * 1000 && t.status !== 'completed')
  const overdue = tasks.filter((t: any) => t.end_at && new Date(t.end_at).getTime() < now && t.status !== 'completed')
  const inProgress = tasks.filter((t: any) => t.status === 'in_progress')
  const unassigned = tasks.filter((t: any) => !t.assigned_to)

  return (
    <AppShell
      title="Revenue Backoffice Cockpit"
      subtitle="Master cockpit pour business development, sales execution, prospects, campagnes, rendez-vous et tâches."
      breadcrumbs={[{ label: 'Revenue', href: '/revenue-command-center' }, { label: 'Cockpit' }]}
      actions={<><PageAction href="/revenue-command-center/tasks/new">Créer tâche</PageAction><PageAction href="/revenue-command-center/tasks" variant="light">Task board</PageAction></>}
    >
      <div style={pageStyle}>
        <CockpitHero title="Business Development Operating System" subtitle="Un seul cockpit pour naviguer, assigner, exécuter et contrôler le travail des équipes BD/Sales. Les pages ne sont plus isolées: elles deviennent des instruments de pilotage." />

        <section style={moduleGrid}>
          <ModuleTile href="/revenue-command-center/prospects" icon="🧭" title="Prospect Database" subtitle="Segmentation B2B/B2C, potentiel, owner, score et next action." tone="blue" />
          <ModuleTile href="/revenue-command-center/tasks" icon="✅" title="Task Command" subtitle="Toutes les actions business centralisées et assignables." tone="green" />
          <ModuleTile href="/revenue-command-center/campaigns" icon="📣" title="Campaigns" subtitle="Campagnes B2B/B2C, canaux, exécution et suivi." tone="amber" />
          <ModuleTile href="/revenue-command-center/appointments" icon="📅" title="Appointments" subtitle="Rendez-vous commerciaux, meetings, résultats et relances." tone="purple" />
          <ModuleTile href="/revenue-command-center/partnerships" icon="🤝" title="Partnerships" subtitle="Institutions, écoles, prescripteurs, deals et conventions." tone="blue" />
          <ModuleTile href="/revenue-command-center/market-mapping" icon="🗺️" title="Market Mapping" subtitle="Territoires, segments, villes, domination et plan d’action." tone="slate" />
          <ModuleTile href="/leads" icon="🎯" title="Leads CRM" subtitle="Entrées commerciales et conversion vers prospects/familles." tone="red" />
          <ModuleTile href="/revenue-command-center/strategy-room" icon="🧠" title="Strategy Room" subtitle="Priorités CEO, signaux faibles, plan hebdomadaire." tone="green" />
        </section>

        <section style={metricsGrid}>
          <MetricCard label="Prospects" value={prospects.length} sub="base BD" tone="blue" />
          <MetricCard label="Leads" value={leads.length} sub="pipeline entrant" tone="purple" />
          <MetricCard label="Campagnes" value={campaigns.length} sub="en base" tone="amber" />
          <MetricCard label="Rendez-vous" value={appointments.length} sub="agenda BD" tone="green" />
          <MetricCard label="Overdue tasks" value={overdue.length} sub="danger suivi" tone="red" />
          <MetricCard label="Sans owner" value={unassigned.length} sub="à assigner" tone="slate" />
        </section>

        <section style={cockpitGrid}>
          <Panel title="Mission Control: tâches critiques" subtitle="Ce que les équipes doivent traiter en priorité.">
            <div style={{ display: 'grid', gap: 10 }}>
              {[...overdue, ...dueSoon, ...inProgress].slice(0, 12).map((task: any) => <TaskRow key={task.id} task={task} assigneeName={userMap.get(task.assigned_to)} />)}
              {!tasks.length ? <EmptyState text="Aucune tâche créée. Commencez par créer des tâches opérationnelles pour vos agents." /> : null}
            </div>
          </Panel>

          <Panel title="CEO Action Radar" subtitle="Lecture actionnable, pas juste reporting.">
            <div style={radarGrid}>
              <Radar title="Overdue recovery" value={overdue.length ? `${overdue.length} tâches à rattraper` : 'Aucun retard critique'} tone={overdue.length ? '#dc2626' : '#16a34a'} />
              <Radar title="Ownership discipline" value={unassigned.length ? `${unassigned.length} tâches sans owner` : 'Ownership propre'} tone={unassigned.length ? '#d97706' : '#16a34a'} />
              <Radar title="BD activity" value={tasks.length ? `${tasks.length} actions en système` : 'Créer le plan d’action'} tone={tasks.length ? '#2563eb' : '#7c3aed'} />
              <Radar title="Production readiness" value="Cockpit opérationnel: tasks + prospects + campagnes + appointments" tone="#0f172a" />
            </div>
          </Panel>
        </section>
      </div>
    </AppShell>
  )
}

function Radar({ title, value, tone }: { title: string; value: string; tone: string }) {
  return <div style={{ ...radarStyle, borderColor: `${tone}55`, background: `${tone}10` }}><span>{title}</span><strong>{value}</strong></div>
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const moduleGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }
const metricsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const cockpitGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.25fr .75fr', gap: 18, alignItems: 'start' }
const radarGrid: React.CSSProperties = { display: 'grid', gap: 12 }
const radarStyle: React.CSSProperties = { display: 'grid', gap: 7, padding: 16, borderRadius: 18, border: '1px solid #e2e8f0', color: '#0f172a' }
