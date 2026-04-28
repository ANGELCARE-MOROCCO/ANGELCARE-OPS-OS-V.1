import AppShell, { PageAction } from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { createTaskAction } from '../actions'
import { CockpitHero, Panel } from '../../_components/ExecutionPrimitives'

export default async function NewRevenueTaskPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  await requireRole(['ceo', 'manager', 'agent'])
  const params = (await searchParams) || {}
  const supabase = await createClient()
  const { data: users } = await supabase.from('app_users').select('id, full_name, username, role, status').eq('status', 'active').order('full_name')

  return (
    <AppShell
      title="Nouvelle tâche revenue"
      subtitle="Créer une action assignée, datée et liée à un lead, prospect, famille, campagne ou partenariat."
      breadcrumbs={[{ label: 'Revenue', href: '/revenue-command-center' }, { label: 'Tasks', href: '/revenue-command-center/tasks' }, { label: 'New' }]}
      actions={<PageAction href="/revenue-command-center/tasks" variant="light">Retour tasks</PageAction>}
    >
      <div style={pageStyle}>
        <CockpitHero title="Task Creation Control" subtitle="Chaque action doit avoir un propriétaire, un timing, un contexte et une trace. C’est le cœur de l’exécution business development." />

        <Panel title="Créer une tâche" subtitle="Toutes les tâches sont centralisées dans le cockpit revenue et visibles dans le profil staff assigné.">
          <form action={createTaskAction} style={formStyle}>
            <label style={fieldStyle}>Titre<input name="title" required placeholder="Ex: Relancer école privée Rabat" style={inputStyle} /></label>
            <label style={fieldStyle}>Description<textarea name="description" rows={5} placeholder="Objectif, contexte, script, résultat attendu..." style={inputStyle} /></label>

            <div style={gridStyle}>
              <label style={fieldStyle}>Statut<select name="status" defaultValue="open" style={inputStyle}><option value="open">Open</option><option value="waiting">Waiting</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
              <label style={fieldStyle}>Priorité<select name="priority" defaultValue="medium" style={inputStyle}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
              <label style={fieldStyle}>Assigné à<select name="assigned_to" defaultValue="" style={inputStyle}><option value="">Aucun / non assigné</option>{(users || []).map((u: any) => <option key={u.id} value={u.id}>{u.full_name || u.username} — {u.role}</option>)}</select></label>
            </div>

            <div style={gridStyle}>
              <label style={fieldStyle}>Début date<input name="start_date" type="date" style={inputStyle} /></label>
              <label style={fieldStyle}>Début heure<input name="start_time" type="time" style={inputStyle} /></label>
              <label style={fieldStyle}>Fin date<input name="end_date" type="date" style={inputStyle} /></label>
              <label style={fieldStyle}>Fin heure<input name="end_time" type="time" style={inputStyle} /></label>
            </div>

            <div style={gridStyle}>
              <label style={fieldStyle}>Type lié<select name="linked_entity_type" defaultValue={params.linked_entity_type || ''} style={inputStyle}><option value="">Aucun</option><option value="lead">Lead</option><option value="prospect">Prospect</option><option value="family">Family</option><option value="campaign">Campaign</option><option value="appointment">Appointment</option><option value="partnership">Partnership</option><option value="mission">Mission</option><option value="contract">Contract</option><option value="other">Other</option></select></label>
              <label style={fieldStyle}>ID lié<input name="linked_entity_id" defaultValue={params.linked_entity_id || ''} placeholder="uuid / id" style={inputStyle} /></label>
              <label style={fieldStyle}>Label lié<input name="linked_entity_label" defaultValue={params.linked_entity_label || ''} placeholder="Nom prospect / lead / famille" style={inputStyle} /></label>
            </div>

            <label style={checkStyle}><input type="checkbox" name="notify_assignee" defaultChecked /> Flag visuel / notification dashboard pour l’assigné</label>
            <button style={buttonStyle}>Créer la tâche</button>
          </form>
        </Panel>
      </div>
    </AppShell>
  )
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const formStyle: React.CSSProperties = { display: 'grid', gap: 16 }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 8, color: '#334155', fontWeight: 900 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const checkStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', color: '#334155', fontWeight: 850 }
const buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 16, padding: '15px 18px', background: '#0f172a', color: '#fff', fontWeight: 950, cursor: 'pointer' }
