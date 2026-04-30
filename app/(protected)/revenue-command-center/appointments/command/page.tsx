import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { Badge, BoardCard, EmptyState, Kpi, Panel, formatDate } from '../../_components/GrowthPhase4Primitives'

export default async function AppointmentCommandPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('bd_appointments').select('*').order('scheduled_at', { ascending: true })
  const appointments = data || []
  const now = new Date().toISOString()
  const upcoming = appointments.filter((a: any) => a.scheduled_at && a.scheduled_at >= now)
  const past = appointments.filter((a: any) => a.scheduled_at && a.scheduled_at < now)

  return (
    <AppShell
      title="Appointments Command"
      subtitle="Meeting orchestration layer for prospects, partnerships, campaigns, and institutional growth."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Appointments', href: '/revenue-command-center/appointments' }, { label: 'Command' }]}
      actions={<PageAction href="/revenue-command-center/tasks/new">Create Follow-up Task</PageAction>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Upcoming" value={upcoming.length} sub="future meetings" tone="#16a34a" />
          <Kpi title="Past" value={past.length} sub="needs outcome tracking" tone="#d97706" />
          <Kpi title="Total" value={appointments.length} sub="meeting history" />
        </section>

        <Panel title="Upcoming Meetings" subtitle="Upcoming appointments should always have an owner and next action.">
          {upcoming.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
              {upcoming.map((a: any) => (
                <BoardCard key={a.id} href="/revenue-command-center/appointments" title={a.title || 'Untitled appointment'} subtitle={`${formatDate(a.scheduled_at)} • ${a.related_type || 'general'}`} badge={<Badge tone="#16a34a">{a.status || 'scheduled'}</Badge>} />
              ))}
            </div>
          ) : <EmptyState title="No upcoming appointments" text="Schedule meetings to activate this command layer." />}
        </Panel>

        <Panel title="Past Meetings Requiring Outcome" subtitle="Use this list to prevent meetings from disappearing without conversion action.">
          {past.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>
              {past.slice(0, 12).map((a: any) => (
                <BoardCard key={a.id} href="/revenue-command-center/tasks/new" title={a.title || 'Past appointment'} subtitle={a.outcome || 'Outcome missing — create a follow-up task.'} badge={<Badge tone="#d97706">OUTCOME NEEDED</Badge>} />
              ))}
            </div>
          ) : <EmptyState title="No past meetings pending" text="No old appointments require review." />}
        </Panel>
      </div>
    </AppShell>
  )
}
