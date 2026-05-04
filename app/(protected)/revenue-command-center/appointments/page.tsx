import React from 'react'
import AppShell from '@/app/components/erp/AppShell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Badge,
  Field,
  Kpi,
  Panel,
  Select,
  TextArea,
  WorkspaceHero,
  dateTime,
  statusTone,
} from '../_components/BDV3Primitives'

type Appointment = {
  id: string
  title?: string | null
  status?: string | null
  linked_type?: string | null
  linked_id?: string | null
  starts_at?: string | null
  ends_at?: string | null
  location?: string | null
  notes?: string | null
  created_at?: string | null
}

export default async function AppointmentsPage() {
  const supabase = await createClient()

  const { data: appointments } = await supabase
    .from('bd_appointments')
    .select('*')
    .order('starts_at', { ascending: true })

  const rows = (appointments || []) as Appointment[]
  const now = new Date()

  const upcoming = rows.filter((a) => isUpcoming(a, now))
  const overdue = rows.filter((a) => isOverdue(a, now))
  const completed = rows.filter((a) => a.status === 'completed')
  const cancelled = rows.filter((a) => a.status === 'cancelled')
  const today = rows.filter((a) => isToday(a.starts_at))
  const nextAppointment = upcoming[0]

  async function createAppointment(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const title = String(formData.get('title') || '').trim()
    const startsAt = String(formData.get('starts_at') || '').trim()
    const meetingType = String(formData.get('meeting_type') || '').trim()
    const channel = String(formData.get('channel') || '').trim()
    const objective = String(formData.get('objective') || '').trim()
    const expectedOutcome = String(formData.get('expected_outcome') || '').trim()
    const notes = String(formData.get('notes') || '').trim()

    if (!title) throw new Error('Appointment title is required')
    if (!startsAt) throw new Error('Appointment start date/time is required')

    const operationalNotes = [
      meetingType ? `Meeting type: ${meetingType}` : '',
      channel ? `Channel: ${channel}` : '',
      objective ? `Objective: ${objective}` : '',
      expectedOutcome ? `Expected outcome: ${expectedOutcome}` : '',
      notes ? `Notes: ${notes}` : '',
    ].filter(Boolean).join('\n')

    const { error } = await supabase.from('bd_appointments').insert([
      {
        title,
        status: String(formData.get('status') || 'scheduled'),
        linked_type: String(formData.get('linked_type') || '') || null,
        linked_id: String(formData.get('linked_id') || '') || null,
        starts_at: startsAt || null,
        ends_at: String(formData.get('ends_at') || '') || null,
        location: String(formData.get('location') || '').trim(),
        notes: operationalNotes,
      },
    ])

    if (error) throw new Error(error.message)
    redirect('/revenue-command-center/appointments')
  }

  async function updateAppointmentStatus(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const id = String(formData.get('id') || '')
    const status = String(formData.get('status') || 'scheduled')

    if (!id) throw new Error('Appointment ID is missing')

    const { error } = await supabase
      .from('bd_appointments')
      .update({ status })
      .eq('id', id)

    if (error) throw new Error(error.message)
    redirect('/revenue-command-center/appointments')
  }

  async function appendAppointmentOutcome(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const id = String(formData.get('id') || '')
    const previousNotes = String(formData.get('previous_notes') || '')
    const outcome = String(formData.get('outcome') || '').trim()
    const nextStep = String(formData.get('next_step') || '').trim()

    if (!id) throw new Error('Appointment ID is missing')
    if (!outcome && !nextStep) throw new Error('Outcome or next step is required')

    const stamp = new Date().toISOString()
    const addition = [
      `--- Appointment outcome logged at ${stamp} ---`,
      outcome ? `Outcome: ${outcome}` : '',
      nextStep ? `Next step: ${nextStep}` : '',
    ].filter(Boolean).join('\n')

    const { error } = await supabase
      .from('bd_appointments')
      .update({ notes: [previousNotes, addition].filter(Boolean).join('\n\n') })
      .eq('id', id)

    if (error) throw new Error(error.message)
    redirect('/revenue-command-center/appointments')
  }

  return (
    <AppShell
      title="Appointments Desk"
      subtitle="Corporate scheduling hub for client meetings, qualification calls, partner sessions and operational follow-ups."
      breadcrumbs={[
        { label: 'Revenue Command', href: '/revenue-command-center' },
        { label: 'Appointments' },
      ]}
    >
      <div style={pageStyle}>
        <WorkspaceHero
          title="Corporate Appointment Management Zone"
          subtitle="Plan, prepare, execute, and document every business appointment with clear status, linked context, objectives, and next steps."
        />

        <section style={kpiGridStyle}>
          <Kpi title="Total" value={String(rows.length)} sub="appointments" tone="#0f172a" />
          <Kpi title="Today" value={String(today.length)} sub="scheduled today" tone="#2563eb" />
          <Kpi title="Upcoming" value={String(upcoming.length)} sub="future meetings" tone="#16a34a" />
          <Kpi title="Needs Review" value={String(overdue.length)} sub="past not completed" tone="#d97706" />
          <Kpi title="Completed" value={String(completed.length)} sub="closed meetings" tone="#7c3aed" />
          <Kpi title="Cancelled" value={String(cancelled.length)} sub="removed / cancelled" tone="#dc2626" />
        </section>

        <section style={commandGridStyle}>
          <Panel title="Next Appointment Command Card" subtitle="The next meeting that needs preparation and execution focus.">
            {nextAppointment ? (
              <AppointmentFocusCard appointment={nextAppointment} />
            ) : (
              <div style={emptyBoxStyle}>
                <strong>No upcoming appointment</strong>
                <span>Create the next client, prospect, or partner appointment from the scheduling panel.</span>
              </div>
            )}
          </Panel>

          <Panel title="Create Appointment" subtitle="Book a business appointment and store operational context in notes without changing database schema.">
            <form action={createAppointment} style={formStyle}>
              <Field name="title" label="Appointment title" required />
              <Select
                name="status"
                label="Status"
                options={[
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
              <div style={twoColumnStyle}>
                <Select
                  name="meeting_type"
                  label="Meeting type"
                  options={[
                    { value: 'qualification', label: 'Qualification' },
                    { value: 'follow_up', label: 'Follow-up' },
                    { value: 'offer_discussion', label: 'Offer discussion' },
                    { value: 'closing', label: 'Closing' },
                    { value: 'partnership', label: 'Partnership' },
                    { value: 'internal_coordination', label: 'Internal coordination' },
                  ]}
                />
                <Select
                  name="channel"
                  label="Channel"
                  options={[
                    { value: 'phone', label: 'Phone call' },
                    { value: 'whatsapp', label: 'WhatsApp' },
                    { value: 'physical', label: 'Physical meeting' },
                    { value: 'video', label: 'Video call' },
                    { value: 'office', label: 'Office visit' },
                  ]}
                />
              </div>
              <div style={twoColumnStyle}>
                <Select
                  name="linked_type"
                  label="Linked to"
                  options={[
                    { value: '', label: 'None' },
                    { value: 'prospect', label: 'Prospect' },
                    { value: 'lead', label: 'Lead' },
                    { value: 'family', label: 'Family' },
                    { value: 'partnership', label: 'Partnership' },
                  ]}
                />
                <Field name="linked_id" label="Linked record ID" />
              </div>
              <div style={twoColumnStyle}>
                <Field name="starts_at" label="Starts" type="datetime-local" required />
                <Field name="ends_at" label="Ends" type="datetime-local" />
              </div>
              <Field name="location" label="Location / call context" />
              <TextArea name="objective" label="Appointment objective" />
              <TextArea name="expected_outcome" label="Expected outcome" />
              <TextArea name="notes" label="Preparation notes" />
              <button style={primaryButtonStyle}>Create appointment</button>
            </form>
          </Panel>
        </section>

        <section style={boardGridStyle}>
          <AppointmentColumn title="Today" subtitle="What must be handled today" items={today} empty="No appointments today." />
          <AppointmentColumn title="Upcoming" subtitle="Future meetings to prepare" items={upcoming} empty="No upcoming meetings." />
          <AppointmentColumn title="Needs Review" subtitle="Past meetings not marked completed" items={overdue} empty="No overdue review needed." />
        </section>

        <Panel title="Full Appointment Pipeline" subtitle="All appointments with execution controls, outcome logging, and linked context.">
          <div style={listStyle}>
            {rows.length ? rows.map((appointment) => (
              <AppointmentManagementCard
                key={appointment.id}
                appointment={appointment}
                updateAppointmentStatus={updateAppointmentStatus}
                appendAppointmentOutcome={appendAppointmentOutcome}
              />
            )) : (
              <div style={emptyBoxStyle}>
                <strong>No appointments yet</strong>
                <span>Create your first appointment to start managing the schedule.</span>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  )
}

function AppointmentFocusCard({ appointment }: { appointment: Appointment }) {
  return (
    <div style={focusCardStyle}>
      <div style={cardTopStyle}>
        <Badge tone={resolveTone(appointment)}>{resolveStatusLabel(appointment)}</Badge>
        {appointment.linked_type ? <Badge tone="#7c3aed">{appointment.linked_type}</Badge> : <Badge tone="#64748b">unlinked</Badge>}
      </div>
      <h2 style={focusTitleStyle}>{appointment.title || 'Untitled appointment'}</h2>
      <div style={detailGridStyle}>
        <span><strong>Start</strong>{dateTime(appointment.starts_at)}</span>
        <span><strong>End</strong>{dateTime(appointment.ends_at)}</span>
        <span><strong>Location</strong>{appointment.location || 'No location'}</span>
        <span><strong>Linked ID</strong>{appointment.linked_id || 'No linked record'}</span>
      </div>
      {appointment.notes ? <pre style={notesPreviewStyle}>{appointment.notes}</pre> : <p style={mutedTextStyle}>No preparation notes yet.</p>}
    </div>
  )
}

function AppointmentColumn({ title, subtitle, items, empty }: { title: string; subtitle: string; items: Appointment[]; empty: string }) {
  return (
    <Panel title={title} subtitle={subtitle}>
      <div style={miniListStyle}>
        {items.slice(0, 6).map((appointment) => (
          <div key={appointment.id} style={miniCardStyle}>
            <div style={cardTopStyle}>
              <Badge tone={resolveTone(appointment)}>{resolveStatusLabel(appointment)}</Badge>
              <span style={miniDateStyle}>{dateTime(appointment.starts_at)}</span>
            </div>
            <strong>{appointment.title || 'Untitled appointment'}</strong>
            <span>{appointment.location || 'No location'}</span>
          </div>
        ))}
        {!items.length ? <div style={emptyBoxStyle}><strong>{empty}</strong></div> : null}
      </div>
    </Panel>
  )
}

function AppointmentManagementCard({
  appointment,
  updateAppointmentStatus,
  appendAppointmentOutcome,
}: {
  appointment: Appointment
  updateAppointmentStatus: (formData: FormData) => Promise<void>
  appendAppointmentOutcome: (formData: FormData) => Promise<void>
}) {
  const linkedHref = appointment.linked_type === 'prospect' && appointment.linked_id
    ? `/revenue-command-center/prospects/${appointment.linked_id}`
    : null

  return (
    <article style={appointmentCardStyle}>
      <div style={appointmentMainStyle}>
        <div style={cardTopStyle}>
          <Badge tone={resolveTone(appointment)}>{resolveStatusLabel(appointment)}</Badge>
          {appointment.linked_type ? <Badge tone="#2563eb">{appointment.linked_type}</Badge> : <Badge tone="#64748b">unlinked</Badge>}
        </div>
        <h3 style={appointmentTitleStyle}>{appointment.title || 'Untitled appointment'}</h3>
        <div style={metaLineStyle}>{dateTime(appointment.starts_at)} → {dateTime(appointment.ends_at)}</div>
        <div style={metaLineStyle}>{appointment.location || 'No location specified'}</div>
        {appointment.notes ? <pre style={compactNotesStyle}>{appointment.notes}</pre> : null}
        {linkedHref ? <a href={linkedHref} style={linkStyle}>Open linked prospect</a> : null}
      </div>

      <div style={appointmentActionsStyle}>
        <form action={updateAppointmentStatus} style={inlineFormStyle}>
          <input type="hidden" name="id" value={appointment.id} />
          <input type="hidden" name="status" value="completed" />
          <button style={successButtonStyle}>Mark done</button>
        </form>
        <form action={updateAppointmentStatus} style={inlineFormStyle}>
          <input type="hidden" name="id" value={appointment.id} />
          <input type="hidden" name="status" value="cancelled" />
          <button style={dangerButtonStyle}>Cancel</button>
        </form>
        <form action={appendAppointmentOutcome} style={formStyle}>
          <input type="hidden" name="id" value={appointment.id} />
          <input type="hidden" name="previous_notes" value={appointment.notes || ''} />
          <textarea name="outcome" rows={3} placeholder="Meeting outcome" style={inputStyle} />
          <input name="next_step" placeholder="Next step / follow-up" style={inputStyle} />
          <button style={secondaryButtonStyle}>Log outcome</button>
        </form>
      </div>
    </article>
  )
}

function isToday(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  const now = new Date()
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
}

function isUpcoming(appointment: Appointment, now: Date) {
  if (appointment.status === 'completed' || appointment.status === 'cancelled') return false
  if (!appointment.starts_at) return false
  return new Date(appointment.starts_at).getTime() >= now.getTime()
}

function isOverdue(appointment: Appointment, now: Date) {
  if (appointment.status === 'completed' || appointment.status === 'cancelled') return false
  if (!appointment.starts_at) return false
  return new Date(appointment.starts_at).getTime() < now.getTime()
}

function resolveStatusLabel(appointment: Appointment) {
  if (appointment.status === 'completed') return 'completed'
  if (appointment.status === 'cancelled') return 'cancelled'
  if (isOverdue(appointment, new Date())) return 'needs review'
  return appointment.status || 'scheduled'
}

function resolveTone(appointment: Appointment) {
  if (appointment.status && statusTone[appointment.status as keyof typeof statusTone]) {
    return statusTone[appointment.status as keyof typeof statusTone]
  }
  if (appointment.status === 'completed') return '#16a34a'
  if (appointment.status === 'cancelled') return '#dc2626'
  if (isOverdue(appointment, new Date())) return '#d97706'
  return '#2563eb'
}

const pageStyle: React.CSSProperties = { display: 'grid', gap: 20 }
const kpiGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 14 }
const commandGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 460px', gap: 18, alignItems: 'start' }
const boardGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 18, alignItems: 'start' }
const twoColumnStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const formStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const inlineFormStyle: React.CSSProperties = { display: 'grid' }
const listStyle: React.CSSProperties = { display: 'grid', gap: 14 }
const miniListStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const focusCardStyle: React.CSSProperties = { display: 'grid', gap: 16, padding: 22, borderRadius: 24, background: 'linear-gradient(135deg,#020617,#1e3a8a)', color: '#fff', boxShadow: '0 20px 55px rgba(15,23,42,.2)' }
const focusTitleStyle: React.CSSProperties = { margin: 0, fontSize: 30, fontWeight: 950 }
const detailGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }
const cardTopStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }
const notesPreviewStyle: React.CSSProperties = { whiteSpace: 'pre-wrap', margin: 0, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,.1)', color: '#e0f2fe', fontFamily: 'inherit', lineHeight: 1.55 }
const compactNotesStyle: React.CSSProperties = { whiteSpace: 'pre-wrap', margin: '8px 0 0', padding: 12, borderRadius: 14, background: '#f8fafc', color: '#334155', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 170, overflow: 'auto' }
const mutedTextStyle: React.CSSProperties = { color: '#cbd5e1', margin: 0, fontWeight: 700 }
const emptyBoxStyle: React.CSSProperties = { display: 'grid', gap: 6, padding: 18, borderRadius: 18, background: '#f8fafc', color: '#475569', border: '1px dashed #cbd5e1' }
const miniCardStyle: React.CSSProperties = { display: 'grid', gap: 7, padding: 14, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
const miniDateStyle: React.CSSProperties = { fontSize: 12, color: '#64748b', fontWeight: 800 }
const appointmentCardStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18, padding: 18, borderRadius: 22, border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 14px 40px rgba(15,23,42,.06)' }
const appointmentMainStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const appointmentActionsStyle: React.CSSProperties = { display: 'grid', gap: 10, alignSelf: 'start' }
const appointmentTitleStyle: React.CSSProperties = { margin: 0, fontSize: 22, fontWeight: 950, color: '#0f172a' }
const metaLineStyle: React.CSSProperties = { color: '#475569', fontWeight: 750 }
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 13, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', fontWeight: 750 }
const primaryButtonStyle: React.CSSProperties = { border: 'none', borderRadius: 14, background: '#0f172a', color: '#fff', padding: 14, fontWeight: 950, cursor: 'pointer' }
const secondaryButtonStyle: React.CSSProperties = { ...primaryButtonStyle, background: '#2563eb' }
const successButtonStyle: React.CSSProperties = { ...primaryButtonStyle, background: '#16a34a' }
const dangerButtonStyle: React.CSSProperties = { ...primaryButtonStyle, background: '#dc2626' }
const linkStyle: React.CSSProperties = { color: '#2563eb', fontWeight: 900, textDecoration: 'none', marginTop: 6 }
