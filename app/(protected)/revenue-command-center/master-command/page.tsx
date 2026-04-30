import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { CommandTile, Kpi, Panel } from '../_components/DepthPhase6Primitives'

export default async function MasterCommandPage() {
  const supabase = await createClient()
  const [{ data: tasks }, { data: prospects }, { data: campaigns }, { data: appointments }, { data: partnerships }] = await Promise.all([
    supabase.from('bd_tasks').select('id,status'),
    supabase.from('bd_prospects').select('id,is_archived,next_action,next_action_at'),
    supabase.from('bd_campaigns').select('id'),
    supabase.from('bd_appointments').select('id'),
    supabase.from('bd_partnerships').select('id'),
  ])

  const openTasks = (tasks || []).filter((t: any) => t.status !== 'completed').length
  const missingNext = (prospects || []).filter((p: any) => !p.is_archived && !p.next_action && !p.next_action_at).length

  return (
    <AppShell
      title="Revenue Master Command"
      subtitle="One cockpit entry point for the complete AngelCare Revenue OS: execution, intelligence, management, automation, and growth."
      breadcrumbs={[{ label: 'Revenue Command', href: '/revenue-command-center' }, { label: 'Master Command' }]}
      actions={<PageAction href="/revenue-command-center/my-work">My Work</PageAction>}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>MASTER CONTROL LAYER</div>
            <h1 style={heroTitleStyle}>Operate the entire revenue machine from one screen.</h1>
            <p style={heroTextStyle}>This layer eliminates scattered navigation and gives executives, managers, and agents a dense, direct command surface.</p>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14 }}>
          <Kpi title="Open Tasks" value={openTasks} sub="execution load" tone="#2563eb" />
          <Kpi title="Missing Next Action" value={missingNext} sub="pipeline discipline" tone="#dc2626" />
          <Kpi title="Prospects" value={(prospects || []).length} sub="CRM objects" tone="#7c3aed" />
          <Kpi title="Campaigns" value={(campaigns || []).length} sub="growth engines" tone="#16a34a" />
          <Kpi title="Appointments" value={(appointments || []).length} sub="touchpoints" tone="#d97706" />
        </section>

        <Panel title="Command Navigation" subtitle="Direct access to every operational control surface.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
            <CommandTile icon="🎯" title="My Work" subtitle="Personal priority queue and daily execution." href="/revenue-command-center/my-work" />
            <CommandTile icon="📋" title="Task Board" subtitle="Kanban control for all revenue tasks." href="/revenue-command-center/tasks/board" />
            <CommandTile icon="🧭" title="Management" subtitle="Manager workload and reassignment controls." href="/revenue-command-center/management" />
            <CommandTile icon="🔥" title="Overdue Heatmap" subtitle="Late work pressure and intervention queue." href="/revenue-command-center/overdue-heatmap" />
            <CommandTile icon="🔁" title="Automation" subtitle="Run workflow automation and follow-up generation." href="/revenue-command-center/automation" />
            <CommandTile icon="📈" title="Prospect Pipeline" subtitle="Pipeline board with next-action enforcement." href="/revenue-command-center/prospects/pipeline" />
            <CommandTile icon="🚀" title="Growth" subtitle="Campaigns, appointments, partnerships, market mapping." href="/revenue-command-center/growth" />
            <CommandTile icon="🤝" title="Partnerships" subtitle="Institutional and B2B partnership control." href="/revenue-command-center/partnerships/pipeline" />
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

const heroStyle: React.CSSProperties = { padding: 32, borderRadius: 34, color: '#fff', background: 'radial-gradient(circle at top left,#2563eb,#020617 68%)', boxShadow: '0 28px 70px rgba(15,23,42,.22)' }
const eyebrowStyle: React.CSSProperties = { display: 'inline-flex', padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,.12)', color: '#dbeafe', fontWeight: 950, fontSize: 12, marginBottom: 12 }
const heroTitleStyle: React.CSSProperties = { margin: 0, fontSize: 40, fontWeight: 950 }
const heroTextStyle: React.CSSProperties = { margin: '10px 0 0', color: '#dbeafe', fontWeight: 750, maxWidth: 900, lineHeight: 1.6 }
