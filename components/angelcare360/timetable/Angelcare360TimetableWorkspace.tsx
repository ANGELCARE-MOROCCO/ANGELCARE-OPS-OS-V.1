'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import type { Angelcare360SchoolCalendarEventListRecord, Angelcare360TimetableSlotListRecord } from '@/types/angelcare360/attendance'

type Angelcare360TimetableWorkspaceProps = {
  schoolId: string
  academicYearId: string
  slots: Angelcare360TimetableSlotListRecord[]
  events: Angelcare360SchoolCalendarEventListRecord[]
  canCreate: boolean
  canUpdate: boolean
}

function emptySlot() {
  return {
    academicYearId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    staffId: '',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '09:00',
    room: '',
    slotType: 'regular',
    status: 'active',
  }
}

function emptyEvent() {
  return {
    academicYearId: '',
    eventCode: '',
    title: '',
    description: '',
    eventType: 'activité',
    startsOn: '',
    endsOn: '',
    allDay: true,
    audience: 'all',
    status: 'planned',
  }
}

export default function Angelcare360TimetableWorkspace({
  schoolId,
  academicYearId,
  slots,
  events,
  canCreate,
  canUpdate,
}: Angelcare360TimetableWorkspaceProps) {
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [slotForm, setSlotForm] = useState(emptySlot)
  const [eventForm, setEventForm] = useState(emptyEvent)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const slotCountLabel = useMemo(() => `${slots.length} créneau(x)`, [slots.length])

  const mutate = (entity: 'slot' | 'calendar-event', operation: 'create' | 'update', payload: Record<string, unknown>) => {
    startTransition(async () => {
      setFeedback(null)
      try {
        const response = await fetch('/api/angelcare360/timetable', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            entity,
            operation,
            payload: {
              schoolId,
              academicYearId,
              ...payload,
            },
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'L’action emploi du temps a échoué.')
        }
        setFeedback(result.warning || 'Action emploi du temps exécutée avec succès.')
        globalThis.setTimeout(() => globalThis.location?.reload(), 220)
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div style={shellStyle}>
      <section style={heroStyle}>
        <div>
          <div style={eyebrowStyle}>Emploi du temps</div>
          <h2 style={titleStyle}>Planning, conflits et calendrier scolaire</h2>
          <p style={subtitleStyle}>Gestion opérationnelle des créneaux par classe, enseignant et période scolaire.</p>
        </div>
        <div style={heroMetaStyle}>{slotCountLabel}</div>
      </section>

      {feedback ? <div style={feedbackStyle}>{feedback}</div> : null}
      {isPending ? <div style={pendingStyle}>Traitement de la demande en cours…</div> : null}

      <div style={gridStyle}>
        <form
          style={formStyle}
          onSubmit={(event) => {
            event.preventDefault()
            if (!canCreate && !editingSlotId) {
              setFeedback('La création des créneaux est verrouillée pour votre rôle.')
              return
            }
            mutate('slot', editingSlotId ? 'update' : 'create', {
              id: editingSlotId,
              ...slotForm,
              schoolId,
              academicYearId,
              sectionId: slotForm.sectionId || null,
              staffId: slotForm.staffId || null,
              room: slotForm.room || null,
              slotType: slotForm.slotType || 'regular',
              status: slotForm.status,
            })
          }}
        >
          <div style={formTitleStyle}>{editingSlotId ? 'Modifier un créneau' : 'Créer un créneau'}</div>
          <input required placeholder="ID classe" value={slotForm.classId} onChange={(event) => setSlotForm((current) => ({ ...current, classId: event.target.value }))} disabled={!canCreate && !editingSlotId} style={inputStyle} />
          <input placeholder="ID section" value={slotForm.sectionId} onChange={(event) => setSlotForm((current) => ({ ...current, sectionId: event.target.value }))} disabled={!canCreate && !editingSlotId} style={inputStyle} />
          <input required placeholder="ID matière" value={slotForm.subjectId} onChange={(event) => setSlotForm((current) => ({ ...current, subjectId: event.target.value }))} disabled={!canCreate && !editingSlotId} style={inputStyle} />
          <input placeholder="ID enseignant" value={slotForm.staffId} onChange={(event) => setSlotForm((current) => ({ ...current, staffId: event.target.value }))} disabled={!canCreate && !editingSlotId} style={inputStyle} />
          <label style={labelStyle}>
            Jour de semaine
            <input type="number" min={1} max={7} value={slotForm.dayOfWeek} onChange={(event) => setSlotForm((current) => ({ ...current, dayOfWeek: Number(event.target.value) }))} disabled={!canCreate && !editingSlotId} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Début
            <input type="time" value={slotForm.startTime} onChange={(event) => setSlotForm((current) => ({ ...current, startTime: event.target.value }))} disabled={!canCreate && !editingSlotId} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Fin
            <input type="time" value={slotForm.endTime} onChange={(event) => setSlotForm((current) => ({ ...current, endTime: event.target.value }))} disabled={!canCreate && !editingSlotId} style={inputStyle} />
          </label>
          <input placeholder="Salle" value={slotForm.room} onChange={(event) => setSlotForm((current) => ({ ...current, room: event.target.value }))} disabled={!canCreate && !editingSlotId} style={inputStyle} />
          <button type="submit" disabled={!canCreate && !editingSlotId} style={!canCreate && !editingSlotId ? disabledButtonStyle : primaryButtonStyle}>
            {editingSlotId ? 'Mettre à jour' : 'Créer'}
          </button>
          {editingSlotId ? (
            <button
              type="button"
              onClick={() => {
                setEditingSlotId(null)
                setSlotForm(emptySlot())
              }}
              style={secondaryButtonStyle}
            >
              Annuler
            </button>
          ) : null}
        </form>

        <form
          style={formStyle}
          onSubmit={(event) => {
            event.preventDefault()
            if (!canCreate && !editingEventId) {
              setFeedback('La création des évènements est verrouillée pour votre rôle.')
              return
            }
            mutate('calendar-event', editingEventId ? 'update' : 'create', {
              id: editingEventId,
              ...eventForm,
              schoolId,
              academicYearId,
              description: eventForm.description || null,
            })
          }}
        >
          <div style={formTitleStyle}>{editingEventId ? 'Modifier un évènement' : 'Créer un évènement'}</div>
          <input required placeholder="Code évènement" value={eventForm.eventCode} onChange={(event) => setEventForm((current) => ({ ...current, eventCode: event.target.value }))} disabled={!canCreate && !editingEventId} style={inputStyle} />
          <input required placeholder="Titre" value={eventForm.title} onChange={(event) => setEventForm((current) => ({ ...current, title: event.target.value }))} disabled={!canCreate && !editingEventId} style={inputStyle} />
          <input required type="date" value={eventForm.startsOn} onChange={(event) => setEventForm((current) => ({ ...current, startsOn: event.target.value }))} disabled={!canCreate && !editingEventId} style={inputStyle} />
          <input required type="date" value={eventForm.endsOn} onChange={(event) => setEventForm((current) => ({ ...current, endsOn: event.target.value }))} disabled={!canCreate && !editingEventId} style={inputStyle} />
          <textarea placeholder="Description" value={eventForm.description} onChange={(event) => setEventForm((current) => ({ ...current, description: event.target.value }))} disabled={!canCreate && !editingEventId} style={textareaStyle} />
          <input placeholder="Type d’évènement" value={eventForm.eventType} onChange={(event) => setEventForm((current) => ({ ...current, eventType: event.target.value }))} disabled={!canCreate && !editingEventId} style={inputStyle} />
          <button type="submit" disabled={!canCreate && !editingEventId} style={!canCreate && !editingEventId ? disabledButtonStyle : primaryButtonStyle}>
            {editingEventId ? 'Mettre à jour' : 'Créer'}
          </button>
          {editingEventId ? (
            <button
              type="button"
              onClick={() => {
                setEditingEventId(null)
                setEventForm(emptyEvent())
              }}
              style={secondaryButtonStyle}
            >
              Annuler
            </button>
          ) : null}
        </form>
      </div>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Créneaux actifs</div>
            <h3 style={panelTitleStyle}>Planning opérationnel</h3>
          </div>
          <div style={panelMetaStyle}>{slots.length} créneau(x)</div>
        </div>
        {slots.length === 0 ? (
          <div style={emptyStyle}>Aucun créneau n’est encore défini.</div>
        ) : (
          <div style={listGridStyle}>
            {slots.map((slot) => (
              <article key={slot.id} style={slotCardStyle}>
                <div style={slotHeaderStyle}>
                  <div>
                    <div style={slotLabelStyle}>{slot.class_name || 'Classe'}</div>
                    <div style={slotTitleStyle}>
                      {slot.day_of_week} · {slot.start_time} - {slot.end_time}
                    </div>
                  </div>
                  <div style={slotStatusStyle}>{slot.status}</div>
                </div>
                <div style={slotMetaStyle}>
                  {slot.subject_name || 'Matière'}{slot.staff_full_name ? ` · ${slot.staff_full_name}` : ''}
                </div>
                <div style={slotMetaStyle}>{slot.section_name || 'Section non précisée'}{slot.room ? ` · Salle ${slot.room}` : ''}</div>
                <div style={slotMetaStyle}>Conflits: {slot.conflict_count || 0}</div>
                <div style={slotActionsStyle}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlotId(slot.id)
                      setSlotForm({
                        academicYearId,
                        classId: slot.class_id,
                        sectionId: slot.section_id || '',
                        subjectId: slot.subject_id,
                        staffId: slot.staff_id || '',
                        dayOfWeek: slot.day_of_week,
                        startTime: slot.start_time.slice(0, 5),
                        endTime: slot.end_time.slice(0, 5),
                        room: slot.room || '',
                        slotType: slot.slot_type || 'regular',
                        status: slot.status,
                      })
                    }}
                    disabled={!canUpdate}
                    style={!canUpdate ? disabledButtonStyle : secondaryButtonStyle}
                  >
                    Modifier
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <div style={panelEyebrowStyle}>Calendrier scolaire</div>
            <h3 style={panelTitleStyle}>Évènements planifiés</h3>
          </div>
          <div style={panelMetaStyle}>{events.length} évènement(s)</div>
        </div>
        {events.length === 0 ? (
          <div style={emptyStyle}>Aucun évènement scolaire n’est encore planifié.</div>
        ) : (
          <div style={listGridStyle}>
            {events.map((event) => (
              <article key={event.id} style={eventCardStyle}>
                <div style={slotHeaderStyle}>
                  <div>
                    <div style={slotLabelStyle}>{event.event_code}</div>
                    <div style={slotTitleStyle}>{event.title}</div>
                  </div>
                  <div style={slotStatusStyle}>{event.status}</div>
                </div>
                <div style={slotMetaStyle}>{event.event_type} · {event.starts_on} → {event.ends_on}</div>
                <div style={slotMetaStyle}>{event.description || 'Aucune description'}</div>
                <div style={slotActionsStyle}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEventId(event.id)
                      setEventForm({
                        academicYearId,
                        eventCode: event.event_code,
                        title: event.title,
                        description: event.description || '',
                        eventType: event.event_type,
                        startsOn: event.starts_on,
                        endsOn: event.ends_on,
                        allDay: event.all_day,
                        audience: event.audience,
                        status: event.status,
                      })
                    }}
                    disabled={!canUpdate}
                    style={!canUpdate ? disabledButtonStyle : secondaryButtonStyle}
                  >
                    Modifier
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const shellStyle: React.CSSProperties = {
  display: 'grid',
  gap: 16,
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  padding: 18,
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 14px 40px rgba(15,23,42,.05)',
}

const eyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const titleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 24,
  fontWeight: 950,
}

const subtitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#475569',
  lineHeight: 1.65,
  fontWeight: 600,
}

const heroMetaStyle: React.CSSProperties = {
  color: '#475569',
  fontWeight: 800,
}

const feedbackStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #bae6fd',
  background: '#f0f9ff',
  color: '#075985',
  padding: '12px 14px',
  fontWeight: 700,
}

const pendingStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px solid #dbe4ef',
  background: '#f8fafc',
  color: '#475569',
  padding: '12px 14px',
  fontWeight: 700,
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16,
}

const formStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  padding: 16,
  background: '#f8fafc',
}

const formTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontWeight: 900,
}

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  color: '#0f172a',
  fontWeight: 800,
  fontSize: 13,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 90,
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  padding: '10px 12px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
  resize: 'vertical',
}

const primaryButtonStyle: React.CSSProperties = {
  border: '1px solid #0f172a',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 850,
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#fff',
  color: '#0f172a',
  textDecoration: 'none',
  fontWeight: 850,
  cursor: 'pointer',
}

const disabledButtonStyle: React.CSSProperties = {
  border: '1px dashed #cbd5e1',
  borderRadius: 14,
  padding: '10px 14px',
  background: '#f8fafc',
  color: '#94a3b8',
  fontWeight: 850,
  cursor: 'not-allowed',
}

const panelStyle: React.CSSProperties = {
  borderRadius: 24,
  border: '1px solid #dbe4ef',
  background: '#fff',
  boxShadow: '0 16px 44px rgba(15,23,42,.05)',
  padding: 18,
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'start',
  marginBottom: 16,
}

const panelEyebrowStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: 12,
  fontWeight: 900,
}

const panelTitleStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#0f172a',
  fontSize: 20,
  fontWeight: 950,
}

const panelMetaStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 700,
}

const emptyStyle: React.CSSProperties = {
  borderRadius: 18,
  border: '1px dashed #cbd5e1',
  background: '#f8fafc',
  padding: 16,
  color: '#475569',
  fontWeight: 700,
}

const listGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
}

const slotCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
}

const eventCardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  borderRadius: 20,
  border: '1px solid #dbe4ef',
  background: '#fff',
  padding: 16,
}

const slotHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'start',
}

const slotLabelStyle: React.CSSProperties = {
  color: '#2563eb',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  fontSize: 12,
  fontWeight: 900,
}

const slotTitleStyle: React.CSSProperties = {
  color: '#0f172a',
  fontSize: 18,
  fontWeight: 900,
  marginTop: 6,
}

const slotStatusStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1d4ed8',
  fontSize: 12,
  fontWeight: 900,
}

const slotMetaStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: 13,
  fontWeight: 600,
}

const slotActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}
