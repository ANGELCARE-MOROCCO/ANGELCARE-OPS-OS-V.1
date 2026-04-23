'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function addLeadEvent(formData: FormData) {
  const supabase = await createClient()

  const lead_id = Number(formData.get('lead_id'))
  const content = String(formData.get('content') || '')
  const created_by = String(formData.get('created_by') || 'AngelCare')
  const event_type = 'comment'

  if (!lead_id || !content) return

  const { error } = await supabase.from('lead_events').insert([
    {
      lead_id,
      event_type,
      content,
      created_by,
    },
  ])

  if (error) throw new Error(error.message)

  revalidatePath(`/leads/${lead_id}`)
}

export async function addLeadTask(formData: FormData) {
  const supabase = await createClient()

  const lead_id = Number(formData.get('lead_id'))
  const task_type = String(formData.get('task_type') || '')
  const notes = String(formData.get('notes') || '')
  const due_date = String(formData.get('due_date') || '')
  const due_time = String(formData.get('due_time') || '')

  if (!lead_id || !task_type) return

  const due_at =
    due_date && due_time
      ? `${due_date}T${due_time}:00`
      : null

  const { error } = await supabase.from('lead_tasks').insert([
    {
      lead_id,
      task_type,
      notes,
      due_at,
      status: 'open',
    },
  ])

  if (error) throw new Error(error.message)

  revalidatePath(`/leads/${lead_id}`)
}

export async function addLeadReminder(formData: FormData) {
  const supabase = await createClient()

  const lead_id = Number(formData.get('lead_id'))
  const reason = String(formData.get('reason') || '')
  const remind_date = String(formData.get('remind_date') || '')
  const remind_time = String(formData.get('remind_time') || '')

  if (!lead_id || !reason || !remind_date || !remind_time) return

  const remind_at = `${remind_date}T${remind_time}:00`

  const { error } = await supabase.from('lead_reminders').insert([
    {
      lead_id,
      reason,
      remind_at,
      status: 'pending',
    },
  ])

  if (error) throw new Error(error.message)

  revalidatePath(`/leads/${lead_id}`)
}
EOF 
cat > "app/leads/[id]/page.tsx" <<'EOF'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { addLeadEvent, addLeadTask, addLeadReminder } from './actions'

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single()
  const { data: events } = await supabase.from('lead_events').select('*').eq('lead_id', id).order('created_at', { ascending: false })
  const { data: tasks } = await supabase.from('lead_tasks').select('*').eq('lead_id', id).order('created_at', { ascending: false })
  const { data: reminders } = await supabase.from('lead_reminders').select('*').eq('lead_id', id).order('created_at', { ascending: false })

  if (!lead) {
    return <main style={{ padding: 32 }}>Lead introuvable</main>
  }

  return (
    <main style={{ padding: 32, fontFamily: 'Arial, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>{lead.parent_name}</h1>
          <p style={{ color: '#64748b' }}>{lead.city} • {lead.phone}</p>
        </div>
        <Link href="/leads" style={secondaryButtonStyle}>← Retour aux leads</Link>
      </div>

      <section style={panelStyle}>
        <h2 style={titleStyle}>Résumé lead</h2>
        <p><strong>Source :</strong> {lead.source || 'Non définie'}</p>
        <p><strong>Urgence :</strong> {lead.urgency || 'Normal'}</p>
        <p><strong>Âges enfants :</strong> {lead.children_ages || 'Non précisé'}</p>
        <p><strong>Créneaux souhaités :</strong> {lead.preferred_schedule || 'Non précisé'}</p>
        <p><strong>Services demandés :</strong> {(lead.service_interests || []).join(', ') || 'Non précisé'}</p>
        <p><strong>Besoins spécifiques :</strong> {lead.special_needs || 'Aucun détail'}</p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 20, marginTop: 20 }}>
        <section style={panelStyle}>
          <h2 style={titleStyle}>Timeline / commentaires</h2>

          <form action={addLeadEvent} style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
            <input type="hidden" name="lead_id" value={lead.id} />
            <input name="created_by" placeholder="Auteur (ex: AngelCare / Il yass)" style={inputStyle} />
            <textarea name="content" placeholder="Ajouter un commentaire CRM..." style={{ ...inputStyle, minHeight: 100 }} required />
            <button type="submit" style={buttonStyle}>Ajouter commentaire</button>
          </form>

          {events && events.length > 0 ? events.map((event) => (
            <div key={event.id} style={itemStyle}>
              <div style={{ fontWeight: 700 }}>{event.event_type}</div>
              <div>{event.content}</div>
              <div style={smallStyle}>{event.created_by || 'AngelCare'} • {new Date(event.created_at).toLocaleString()}</div>
            </div>
          )) : <p style={{ color: '#64748b' }}>Aucun événement pour le moment.</p>}
        </section>

        <section style={panelStyle}>
          <h2 style={titleStyle}>Actions à traiter</h2>

          <form action={addLeadTask} style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
            <input type="hidden" name="lead_id" value={lead.id} />
            <select name="task_type" style={inputStyle} required defaultValue="">
              <option value="" disabled>Choisir une action</option>
              <option value="Établir offre">Établir offre</option>
              <option value="Devis à envoyer">Devis à envoyer</option>
              <option value="Programme / explication produits nécessaire">Programme / explication produits nécessaire</option>
              <option value="Appel de suivi">Appel de suivi</option>
              <option value="WhatsApp de relance">WhatsApp de relance</option>
            </select>
            <textarea name="notes" placeholder="Notes sur cette action..." style={{ ...inputStyle, minHeight: 90 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input name="due_date" type="date" style={inputStyle} />
              <input name="due_time" type="time" style={inputStyle} />
            </div>
            <button type="submit" style={buttonStyle}>Ajouter action</button>
          </form>

          {tasks && tasks.length > 0 ? tasks.map((task) => (
            <div key={task.id} style={itemStyle}>
              <div style={{ fontWeight: 700 }}>{task.task_type}</div>
              <div style={smallStyle}>Statut : {task.status}</div>
              <div style={smallStyle}>Notes : {task.notes || '—'}</div>
              <div style={smallStyle}>Échéance : {task.due_at ? new Date(task.due_at).toLocaleString() : 'Non définie'}</div>
            </div>
          )) : <p style={{ color: '#64748b' }}>Aucune action enregistrée.</p>}
        </section>

        <section style={panelStyle}>
          <h2 style={titleStyle}>Rappels</h2>

          <form action={addLeadReminder} style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
            <input type="hidden" name="lead_id" value={lead.id} />
            <input name="reason" placeholder="Raison du rappel" style={inputStyle} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input name="remind_date" type="date" style={inputStyle} required />
              <input name="remind_time" type="time" style={inputStyle} required />
            </div>
            <button type="submit" style={buttonStyle}>Ajouter rappel</button>
          </form>

          {reminders && reminders.length > 0 ? reminders.map((reminder) => (
            <div key={reminder.id} style={itemStyle}>
              <div style={{ fontWeight: 700 }}>{reminder.reason}</div>
              <div style={smallStyle}>{new Date(reminder.remind_at).toLocaleString()}</div>
              <div style={smallStyle}>Statut : {reminder.status}</div>
            </div>
          )) : <p style={{ color: '#64748b' }}>Aucun rappel.</p>}
        </section>
      </div>
    </main>
  )
}

const panelStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 18,
  padding: 20,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
}

const titleStyle: React.CSSProperties = {
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  boxSizing: 'border-box',
}

const buttonStyle: React.CSSProperties = {
  background: '#0f172a',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '10px 14px',
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
