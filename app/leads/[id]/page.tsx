import Link from 'next/link'
import { createClient } from '../../../lib/supabase/server'
import { convertLeadToMission } from '../convert-action'
import { archiveLead } from '../archive-action'

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return <main style={{ padding: 32 }}>Erreur : {error.message}</main>
  }

  if (!lead) {
    return (
      <main style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>
        <h1>Lead introuvable</h1>
        <p>Vérifie l’ID ou retourne à la liste.</p>
        <Link href="/leads" style={secondaryButtonStyle}>← Retour aux leads</Link>
      </main>
    )
  }

  const { data: events } = await supabase
    .from('lead_events')
    .select('*')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false })

  const { data: tasks } = await supabase
    .from('lead_tasks')
    .select('*')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false })

  const { data: reminders } = await supabase
    .from('lead_reminders')
    .select('*')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false })

  return (
    <main style={{ padding: 32, fontFamily: 'Arial, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>{lead.parent_name || 'Sans nom'}</h1>
          <p style={{ color: '#64748b', marginTop: 8 }}>
            Lead #{lead.id} • {lead.city || 'Ville non définie'} • {lead.phone || 'Sans téléphone'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/leads" style={secondaryButtonStyle}>← Retour</Link>
          <Link href={`/leads/edit/${lead.id}`} style={secondaryButtonStyle}>Modifier</Link>
        </div>
      </div>
<form action={archiveLead}>
  <input type="hidden" name="lead_id" value={lead.id} />
  <button type="submit" style={archiveButtonStyle}>
    Archiver
  </button>
</form>
      <section style={summaryCardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <p><strong>Source :</strong> {lead.source || 'Non définie'}</p>
            <p><strong>Urgence :</strong> <span style={badgeStyle(lead.urgency || 'normal')}>{lead.urgency || 'normal'}</span></p>
            <p><strong>Statut :</strong> <span style={badgeStyle(lead.status || 'new')}>{lead.status || 'new'}</span></p>
            <p><strong>Enfants :</strong> {lead.children_count || 0}</p>
            <p><strong>Âges enfants :</strong> {lead.children_ages || 'Non précisé'}</p>
          </div>

          <div style={{ minWidth: 320, flex: 1 }}>
            <p><strong>Services demandés :</strong></p>
            <div style={{ color: '#475569' }}>
              {lead.service_interests?.length
                ? lead.service_interests.join(', ')
                : lead.service_needed || 'Non précisé'}
            </div>

            <p style={{ marginTop: 16 }}><strong>Besoins spécifiques :</strong></p>
            <div style={{ color: '#475569' }}>{lead.special_needs || 'Aucun détail'}</div>
          </div>
        </div>

        <form action={convertLeadToMission} style={{ marginTop: 20 }}>
          <input type="hidden" name="lead_id" value={lead.id} />
          <button type="submit" style={convertButtonStyle}>
            🚀 Convertir en mission
          </button>
        </form>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 20, marginTop: 20 }}>
        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Timeline</h2>
          {events && events.length > 0 ? (
            events.map((event) => (
              <div key={event.id} style={itemStyle}>
                <div style={{ fontWeight: 700 }}>{event.event_type || 'event'}</div>
                <div>{event.content}</div>
                <div style={smallStyle}>
                  {event.created_by || 'AngelCare'} • {new Date(event.created_at).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <p style={smallStyle}>Aucun événement.</p>
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Actions</h2>
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} style={itemStyle}>
                <div style={{ fontWeight: 700 }}>{task.task_type}</div>
                <div style={smallStyle}>Statut : {task.status || 'open'}</div>
                <div style={smallStyle}>Notes : {task.notes || '—'}</div>
                <div style={smallStyle}>
                  Échéance : {task.due_at ? new Date(task.due_at).toLocaleString() : 'Non définie'}
                </div>
              </div>
            ))
          ) : (
            <p style={smallStyle}>Aucune action.</p>
          )}
        </section>

        <section style={panelStyle}>
          <h2 style={panelTitleStyle}>Rappels</h2>
          {reminders && reminders.length > 0 ? (
            reminders.map((reminder) => (
              <div key={reminder.id} style={itemStyle}>
                <div style={{ fontWeight: 700 }}>{reminder.reason}</div>
                <div style={smallStyle}>{new Date(reminder.remind_at).toLocaleString()}</div>
                <div style={smallStyle}>Statut : {reminder.status || 'pending'}</div>
              </div>
            ))
          ) : (
            <p style={smallStyle}>Aucun rappel.</p>
          )}
        </section>
      </div>
    </main>
  )
}

const summaryCardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 20,
  padding: 24,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
}

const panelStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 18,
  padding: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
}

const panelTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
}

const itemStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#fcfdff',
  marginBottom: 10,
}

const smallStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  marginTop: 6,
}

const convertButtonStyle: React.CSSProperties = {
  background: '#16a34a',
  color: 'white',
  border: 'none',
  padding: '12px 16px',
  borderRadius: 10,
  fontWeight: 700,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  background: 'white',
  color: '#0f172a',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 700,
  textDecoration: 'none',
}

function badgeStyle(status: string): React.CSSProperties {
  const colors: Record<string, { bg: string; text: string }> = {
    new: { bg: '#fef3c7', text: '#92400e' },
    contacted: { bg: '#dbeafe', text: '#1d4ed8' },
    qualified: { bg: '#dcfce7', text: '#166534' },
    matching: { bg: '#ede9fe', text: '#6d28d9' },
    converted: { bg: '#dcfce7', text: '#166534' },
    urgent: { bg: '#fee2e2', text: '#991b1b' },
    normal: { bg: '#e2e8f0', text: '#334155' },
  }

  const color = colors[status] || { bg: '#e2e8f0', text: '#334155' }

  return {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: 999,
    background: color.bg,
    color: color.text,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'capitalize',
  }
}
const archiveButtonStyle: React.CSSProperties = {
  background: '#fff7ed',
  color: '#9a3412',
  padding: '12px 16px',
  borderRadius: 12,
  fontWeight: 800,
  border: '1px solid #fdba74',
  cursor: 'pointer',
}