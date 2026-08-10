'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Angelcare360SchoolCalendarEventListRecord, Angelcare360TimetableSlotListRecord } from '@/types/angelcare360/attendance'
import { AcademicZoneAOverlay } from '@/components/angelcare360/zone-a-academic/AcademicZoneACommandDrawer'
import styles from '@/components/angelcare360/zone-a-academic/AcademicZoneAChrome.module.css'

type Option = { value: string; label: string; parentId?: string | null }
type AssignmentOption = {
  id: string
  staffId: string
  staffLabel: string
  classId: string
  classLabel: string
  sectionId: string | null
  sectionLabel: string | null
  subjectId: string
  subjectLabel: string
  status: string
}

type Props = {
  schoolId: string
  academicYearId: string
  slots: Angelcare360TimetableSlotListRecord[]
  events: Angelcare360SchoolCalendarEventListRecord[]
  classOptions: Option[]
  sectionOptions: Option[]
  subjectOptions: Option[]
  staffOptions: Option[]
  assignmentOptions: AssignmentOption[]
  canCreate: boolean
  canUpdate: boolean
}

type Drawer = 'slot' | 'event' | 'conflict' | null
type Lens = 'today' | 'day' | 'week' | 'class' | 'teacher' | 'subject' | 'availability' | 'conflicts'

function emptySlot() {
  return { academicYearId: '', classId: '', sectionId: '', subjectId: '', staffId: '', dayOfWeek: 1, startTime: '08:00', endTime: '09:00', room: '', slotType: 'regular', status: 'active' }
}
function emptyEvent() {
  return { academicYearId: '', eventCode: '', title: '', description: '', eventType: 'activité', startsOn: '', endsOn: '', allDay: true, audience: 'all', status: 'planned' }
}
const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const shortDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const LENS_KEY = 'angelcare360.zone-a.timetable-lens'
const DAY_KEY = 'angelcare360.zone-a.timetable-day'
const START_MINUTES = 7 * 60
const END_MINUTES = 18 * 60
const ACTIVE_START = 8 * 60
const ACTIVE_END = 17 * 60
const GRID_MINUTES = END_MINUTES - START_MINUTES

function dayLabel(day: number | string | null | undefined) {
  const dayNumber = Number(day)
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > days.length) return 'Jour non défini'
  return days[dayNumber - 1]
}

function parseTime(value: string | null | undefined) {
  const [hours, minutes] = String(value || '00:00').split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return hours * 60 + minutes
}

function formatMinutes(minutes: number) {
  const bounded = Math.max(0, Math.round(minutes))
  return `${String(Math.floor(bounded / 60)).padStart(2, '0')}:${String(bounded % 60).padStart(2, '0')}`
}

function slotPosition(slot: Angelcare360TimetableSlotListRecord) {
  const start = Math.max(START_MINUTES, Math.min(END_MINUTES, parseTime(slot.start_time)))
  const end = Math.max(start + 20, Math.min(END_MINUTES, parseTime(slot.end_time)))
  return {
    top: `${((start - START_MINUTES) / GRID_MINUTES) * 100}%`,
    height: `${Math.max(4.25, ((end - start) / GRID_MINUTES) * 100)}%`,
  }
}

function freeWindows(slots: Angelcare360TimetableSlotListRecord[], day: number) {
  const ranges = slots
    .filter((slot) => slot.day_of_week === day && !['cancelled', 'inactive'].includes(String(slot.status).toLowerCase()))
    .map((slot) => [Math.max(ACTIVE_START, parseTime(slot.start_time)), Math.min(ACTIVE_END, parseTime(slot.end_time))] as const)
    .filter(([start, end]) => end > start)
    .sort((a, b) => a[0] - b[0])

  const merged: Array<[number, number]> = []
  for (const range of ranges) {
    const last = merged[merged.length - 1]
    if (!last || range[0] > last[1]) merged.push([range[0], range[1]])
    else last[1] = Math.max(last[1], range[1])
  }

  const free: Array<[number, number]> = []
  let cursor = ACTIVE_START
  for (const [start, end] of merged) {
    if (start > cursor) free.push([cursor, start])
    cursor = Math.max(cursor, end)
  }
  if (cursor < ACTIVE_END) free.push([cursor, ACTIVE_END])
  return free.filter(([start, end]) => end - start >= 30)
}

export default function Angelcare360TimetableWorkspace({ schoolId, academicYearId, slots, events, classOptions, sectionOptions, subjectOptions, staffOptions, assignmentOptions, canCreate, canUpdate }: Props) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [slotForm, setSlotForm] = useState(emptySlot)
  const [eventForm, setEventForm] = useState(emptyEvent)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [selectedConflict, setSelectedConflict] = useState<Angelcare360TimetableSlotListRecord | null>(null)
  const [drawer, setDrawer] = useState<Drawer>(null)
  const [lens, setLens] = useState<Lens>('week')
  const [dayFocus, setDayFocus] = useState(1)
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [staffFilter, setStaffFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')

  useEffect(() => {
    const storedLens = globalThis.localStorage?.getItem(LENS_KEY) as Lens | null
    if (storedLens && ['today', 'day', 'week', 'class', 'teacher', 'subject', 'availability', 'conflicts'].includes(storedLens)) setLens(storedLens)
    const storedDay = Number(globalThis.localStorage?.getItem(DAY_KEY) || '')
    if (storedDay >= 1 && storedDay <= 7) setDayFocus(storedDay)
    else {
      const jsDay = new Date().getDay()
      setDayFocus(jsDay === 0 ? 7 : jsDay)
    }
  }, [])

  const chooseLens = (next: Lens) => {
    setLens(next)
    globalThis.localStorage?.setItem(LENS_KEY, next)
    if (next === 'today') {
      const jsDay = new Date().getDay()
      const today = jsDay === 0 ? 7 : jsDay
      setDayFocus(today)
      globalThis.localStorage?.setItem(DAY_KEY, String(today))
    }
  }
  const chooseDay = (day: number) => {
    setDayFocus(day)
    globalThis.localStorage?.setItem(DAY_KEY, String(day))
  }

  const conflictCount = useMemo(() => slots.reduce((sum, slot) => sum + (slot.conflict_count || 0), 0), [slots])
  const assignedCount = useMemo(() => slots.filter((slot) => slot.staff_id && slot.subject_id).length, [slots])
  const readiness = slots.length ? Math.max(0, Math.round(((slots.length - Math.min(conflictCount, slots.length)) / slots.length) * 100)) : 0

  const visibleSections = useMemo(() => sectionOptions.filter((option) => !option.parentId || !slotForm.classId || option.parentId === slotForm.classId), [sectionOptions, slotForm.classId])
  const eligibleAssignments = useMemo(() => assignmentOptions.filter((assignment) => {
    if (assignment.status && !['active', 'planned', 'confirmed'].includes(assignment.status)) return false
    if (slotForm.classId && assignment.classId !== slotForm.classId) return false
    if (slotForm.sectionId && assignment.sectionId && assignment.sectionId !== slotForm.sectionId) return false
    if (slotForm.subjectId && assignment.subjectId !== slotForm.subjectId) return false
    return true
  }), [assignmentOptions, slotForm.classId, slotForm.sectionId, slotForm.subjectId])
  const eligibleStaff = useMemo(() => {
    const assigned = new Map(eligibleAssignments.map((assignment) => [assignment.staffId, { value: assignment.staffId, label: assignment.staffLabel }]))
    return assigned.size ? [...assigned.values()] : staffOptions
  }, [eligibleAssignments, staffOptions])
  const structureReady = classOptions.length > 0 && subjectOptions.length > 0

  const filteredSlots = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr')
    return slots.filter((slot) => {
      if ((lens === 'today' || lens === 'day') && slot.day_of_week !== dayFocus) return false
      if (lens === 'conflicts' && !(slot.conflict_count || 0)) return false
      if ((lens === 'class' || classFilter) && classFilter && slot.class_id !== classFilter) return false
      if ((lens === 'teacher' || staffFilter) && staffFilter && slot.staff_id !== staffFilter) return false
      if ((lens === 'subject' || subjectFilter) && subjectFilter && slot.subject_id !== subjectFilter) return false
      if (normalized) {
        const haystack = [slot.subject_name, slot.subject_code, slot.class_name, slot.class_code, slot.staff_full_name, slot.room, slot.section_name].filter(Boolean).join(' ').toLocaleLowerCase('fr')
        if (!haystack.includes(normalized)) return false
      }
      return true
    })
  }, [slots, lens, dayFocus, classFilter, staffFilter, subjectFilter, query])

  const loadByDay = useMemo(() => days.map((_, index) => filteredSlots.filter((slot) => slot.day_of_week === index + 1).length), [filteredSlots])
  const maxDayLoad = Math.max(1, ...loadByDay)
  const todayDay = (() => { const current = new Date().getDay(); return current === 0 ? 7 : current })()
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
  const nowTop = ((Math.max(START_MINUTES, Math.min(END_MINUTES, nowMinutes)) - START_MINUTES) / GRID_MINUTES) * 100

  const mutate = (entity: 'slot' | 'calendar-event', operation: 'create' | 'update', payload: Record<string, unknown>) => {
    startTransition(async () => {
      setFeedback(null)
      try {
        const response = await fetch('/api/angelcare360/timetable', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ entity, operation, payload: { schoolId, academicYearId, ...payload } }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok) throw new Error(result?.error || 'L’action emploi du temps a échoué.')
        setFeedback(result.warning || 'Action emploi du temps exécutée avec succès.')
        setDrawer(null)
        router.refresh()
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
      }
    })
  }

  const openNewSlot = () => {
    setEditingSlotId(null)
    setSlotForm({ ...emptySlot(), academicYearId, dayOfWeek: dayFocus })
    setDrawer('slot')
  }
  const openNewEvent = () => {
    setEditingEventId(null)
    setEventForm({ ...emptyEvent(), academicYearId })
    setDrawer('event')
  }
  const openSlot = (slot: Angelcare360TimetableSlotListRecord) => {
    setEditingSlotId(slot.id)
    setSlotForm({ academicYearId, classId: slot.class_id, sectionId: slot.section_id || '', subjectId: slot.subject_id, staffId: slot.staff_id || '', dayOfWeek: slot.day_of_week, startTime: slot.start_time.slice(0, 5), endTime: slot.end_time.slice(0, 5), room: slot.room || '', slotType: slot.slot_type || 'regular', status: slot.status })
    setDrawer('slot')
  }

  return (
    <div className={styles.timetableStudio}>
      <section className={styles.timetableHero}>
        <div>
          <span>Timetable Airspace Control · R3</span>
          <h2>Une semaine académique lisible comme un espace opérationnel</h2>
          <p>Planning, densité, disponibilités, conflits et commandes de séance restent réunis sans rechargement navigateur.</p>
        </div>
        <div className={styles.timetableKpi}>{slots.length} créneau(x) · {readiness}% prêt</div>
      </section>

      {feedback ? <div className={styles.feedback} role="status">{feedback}</div> : null}
      {isPending ? <div className={styles.pending} role="status">Traitement de la demande en cours…</div> : null}

      <section className={styles.airspaceInsightGrid} aria-label="Indicateurs planning">
        <div className={styles.airspaceInsight}><span>Créneaux</span><strong>{slots.length}</strong><small>Planning chargé pour l’année active.</small></div>
        <div className={styles.airspaceInsight}><span>Affectations complètes</span><strong>{assignedCount}/{slots.length}</strong><small>Matière et enseignant rattachés.</small></div>
        <div className={styles.airspaceInsight}><span>Conflits à analyser</span><strong>{conflictCount}</strong><small>Somme des signaux de collision détectés.</small></div>
      </section>

      <section className={styles.airspaceControls}>
        <div className={styles.airspaceLenses} role="tablist" aria-label="Lentilles emploi du temps">
          {([
            ['today', 'Aujourd’hui'], ['day', 'Jour'], ['week', 'Semaine'], ['class', 'Classe'], ['teacher', 'Enseignant'], ['subject', 'Matière'], ['availability', 'Disponibilités'], ['conflicts', 'Conflits'],
          ] as Array<[Lens, string]>).map(([key, label]) => <button key={key} type="button" role="tab" aria-selected={lens === key} data-active={lens === key} onClick={() => chooseLens(key)}>{label}</button>)}
        </div>
        <div className={styles.airspaceSearch}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher classe, matière, enseignant…" aria-label="Rechercher dans le planning" />
          {(lens === 'today' || lens === 'day') ? <select value={dayFocus} onChange={(event) => chooseDay(Number(event.target.value))} aria-label="Jour"><option value={1}>Lundi</option><option value={2}>Mardi</option><option value={3}>Mercredi</option><option value={4}>Jeudi</option><option value={5}>Vendredi</option><option value={6}>Samedi</option><option value={7}>Dimanche</option></select> : null}
          {lens === 'class' ? <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} aria-label="Classe"><option value="">Toutes les classes</option>{classOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : null}
          {lens === 'teacher' ? <select value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)} aria-label="Enseignant"><option value="">Tous les enseignants</option>{staffOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : null}
          {lens === 'subject' ? <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} aria-label="Matière"><option value="">Toutes les matières</option>{subjectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : null}
        </div>
      </section>

      <section className={styles.studioActionBar}>
        <small>{filteredSlots.length} créneau(x) visible(s) · {events.length} évènement(s) calendrier</small>
        <div>
          <Link href="/angelcare-360-command-center/emploi-du-temps/classes" className={styles.textAction}>Dossiers classes</Link>
          <Link href="/angelcare-360-command-center/emploi-du-temps/enseignants" className={styles.textAction}>Charge enseignants</Link>
          <button type="button" className={styles.lightAction} onClick={openNewEvent} disabled={!canCreate}>Planifier un évènement</button>
          <button type="button" className={styles.primaryAction} onClick={openNewSlot} disabled={!canCreate}>Ajouter un créneau</button>
        </div>
      </section>

      {lens === 'availability' ? (
        <section className={styles.airspacePanel}>
          <header className={styles.airspacePanelHeader}><div><span>Disponibilités</span><h3>Fenêtres libres détectées</h3></div><strong>{filteredSlots.length}</strong></header>
          <div className={styles.availabilityBoard}>
            {days.map((day, index) => {
              const free = freeWindows(filteredSlots, index + 1)
              return <section key={day}><header><span>{shortDays[index]}</span><strong>{free.length}</strong></header>{free.length ? free.map(([start, end]) => <article key={`${start}-${end}`}>{formatMinutes(start)}–{formatMinutes(end)}</article>) : <article>Aucune fenêtre ≥ 30 min</article>}</section>
            })}
          </div>
        </section>
      ) : (
        <section className={styles.airspacePanel}>
          <header className={styles.airspacePanelHeader}>
            <div><span>Timetable Airspace</span><h3>{lens === 'conflicts' ? 'Conflits visibles dans la semaine' : lens === 'today' ? `Aujourd’hui · ${dayLabel(dayFocus)}` : lens === 'day' ? dayLabel(dayFocus) : 'Semaine académique'}</h3></div>
            <strong>{filteredSlots.length}</strong>
          </header>
          {filteredSlots.length === 0 ? <div className={styles.airspaceEmpty}>Aucun créneau ne correspond à cette lentille. La structure existante est conservée et aucun planning fictif n’est généré.</div> : (
            <>
              <div className={styles.airspaceViewport} tabIndex={0} aria-label="Grille hebdomadaire de l’emploi du temps">
                <div className={styles.weeklyAirspace}>
                  <div className={styles.weeklyAirspaceHeader}>
                    <div><span>Heure</span><strong>Airspace</strong></div>
                    {days.map((day, index) => <div key={day}><span>{String(index + 1).padStart(2, '0')}</span><strong>{shortDays[index]}</strong></div>)}
                  </div>
                  <div className={styles.airspaceTimeAxis}>
                    {Array.from({ length: 12 }, (_, index) => START_MINUTES + index * 60).map((minute) => <span key={minute} className={styles.airspaceTimeLabel} style={{ top: `${((minute - START_MINUTES) / GRID_MINUTES) * 100}%` }}>{formatMinutes(minute)}</span>)}
                  </div>
                  {days.map((day, index) => {
                    const dayNumber = index + 1
                    const daySlots = filteredSlots.filter((slot) => slot.day_of_week === dayNumber)
                    return <div key={day} className={styles.airspaceDayColumn} data-current={dayNumber === todayDay}>
                      {dayNumber === todayDay && nowMinutes >= START_MINUTES && nowMinutes <= END_MINUTES ? <i className={styles.airspaceNowLine} style={{ top: `${nowTop}%` }} aria-hidden="true" /> : null}
                      {daySlots.map((slot) => <button key={slot.id} type="button" className={styles.airspaceSlotBlock} data-conflict={(slot.conflict_count || 0) > 0} data-type={slot.slot_type || 'regular'} style={slotPosition(slot)} onClick={() => (slot.conflict_count || 0) > 0 ? (setSelectedConflict(slot), setDrawer('conflict')) : openSlot(slot)} aria-label={`${slot.subject_name || 'Matière'}, ${slot.class_name || 'classe'}, ${slot.start_time.slice(0, 5)} à ${slot.end_time.slice(0, 5)}`}>
                        <strong>{slot.subject_name || slot.subject_code || 'Matière'}</strong>
                        <span>{slot.class_code || slot.class_name || 'Classe'} · {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}</span>
                        <small>{slot.staff_full_name || 'Enseignant non affecté'}{slot.room ? ` · ${slot.room}` : ''}</small>
                      </button>)}
                    </div>
                  })}
                </div>
              </div>
              <div className={styles.airspaceNavigator} aria-label="Charge hebdomadaire">
                {days.map((day, index) => <div key={day}><span>{shortDays[index]} · {loadByDay[index]}</span><i><em style={{ width: `${(loadByDay[index] / maxDayLoad) * 100}%` }} /></i></div>)}
              </div>
            </>
          )}
        </section>
      )}

      <section className={styles.airspacePanel}>
        <header className={styles.airspacePanelHeader}>
          <div><span>Calendrier scolaire</span><h3>Évènements & architecture temporelle</h3></div>
          <strong>{events.length}</strong>
        </header>
        {events.length === 0 ? <div className={styles.airspaceEmpty}>Aucun évènement scolaire planifié.</div> : (
          <div className={styles.airspaceList}>
            {events.slice(0, 12).map((event) => (
              <article key={event.id} className={styles.airspaceCard}>
                <div className={styles.airspaceCardHeader}><span>{event.event_code}</span><b>{event.status}</b></div>
                <h3>{event.title}</h3>
                <p>{event.starts_on} → {event.ends_on} · {event.event_type}</p>
                <p>{event.description || 'Aucune description'}</p>
                <div className={styles.airspaceCardFooter}>
                  <span>{event.audience}</span>
                  <button type="button" onClick={() => {
                    setEditingEventId(event.id)
                    setEventForm({ academicYearId, eventCode: event.event_code, title: event.title, description: event.description || '', eventType: event.event_type, startsOn: event.starts_on, endsOn: event.ends_on, allDay: event.all_day, audience: event.audience, status: event.status })
                    setDrawer('event')
                  }} disabled={!canUpdate}>Ouvrir l’évènement</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <AcademicZoneAOverlay
        open={drawer === 'slot'}
        onClose={() => setDrawer(null)}
        title={editingSlotId ? 'Session Move/Planning Drawer — modifier le créneau' : 'Session Command Drawer — nouveau créneau'}
        eyebrow="Timetable Airspace"
        description="Classe, matière, enseignant, horaire et salle restent réunis dans une seule surface de commandement."
        size="chamber"
      >
        <form className={styles.zoneForm} onSubmit={(event) => {
          event.preventDefault()
          if (!canCreate && !editingSlotId) return setFeedback('La création des créneaux est verrouillée pour votre rôle.')
          mutate('slot', editingSlotId ? 'update' : 'create', { id: editingSlotId, ...slotForm, schoolId, academicYearId, sectionId: slotForm.sectionId || null, staffId: slotForm.staffId || null, room: slotForm.room || null, slotType: slotForm.slotType || 'regular', status: slotForm.status })
        }}>
          <div className={styles.formCommandSummary}><strong>{editingSlotId ? 'Révision contrôlée' : 'Création contrôlée'}</strong><span>Choisissez la classe, la matière et l’enseignant dans les référentiels existants. Aucun identifiant technique n’est demandé à l’utilisateur.</span></div>
          {!structureReady ? <div className={styles.structureGate}><strong>Structure académique incomplète</strong><span>Créez d’abord les classes et matières dans Administration. La Zone A ne fabrique aucune structure parallèle.</span><div><Link href="/angelcare-360-command-center/administration?plane=classes-capacity">Ouvrir Classes</Link><Link href="/angelcare-360-command-center/administration?plane=subjects">Ouvrir Matières</Link></div></div> : null}
          <div className={styles.formGrid}>
            <Field label="Classe"><select required value={slotForm.classId} onChange={(e) => setSlotForm((c) => ({ ...c, classId: e.target.value, sectionId: '', staffId: '' }))} disabled={!structureReady || (!canCreate && !editingSlotId)}><option value="">Choisir une classe…</option>{classOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
            <Field label="Section"><select value={slotForm.sectionId} onChange={(e) => setSlotForm((c) => ({ ...c, sectionId: e.target.value, staffId: '' }))} disabled={!slotForm.classId || (!canCreate && !editingSlotId)}><option value="">Aucune / classe entière</option>{visibleSections.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
            <Field label="Matière"><select required value={slotForm.subjectId} onChange={(e) => setSlotForm((c) => ({ ...c, subjectId: e.target.value, staffId: '' }))} disabled={!structureReady || (!canCreate && !editingSlotId)}><option value="">Choisir une matière…</option>{subjectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
            <Field label="Enseignant"><select value={slotForm.staffId} onChange={(e) => setSlotForm((c) => ({ ...c, staffId: e.target.value }))} disabled={!slotForm.classId || !slotForm.subjectId || (!canCreate && !editingSlotId)}><option value="">Non affecté</option>{eligibleStaff.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>{eligibleAssignments.length ? `${eligibleAssignments.length} affectation(s) compatible(s)` : 'Aucune affectation compatible détectée — vérifiez Area 5.'}</small></Field>
            <Field label="Jour"><select value={slotForm.dayOfWeek} onChange={(e) => setSlotForm((c) => ({ ...c, dayOfWeek: Number(e.target.value) }))}>{days.map((day, index) => <option key={day} value={index + 1}>{day}</option>)}</select></Field>
            <Field label="Salle"><input value={slotForm.room} onChange={(e) => setSlotForm((c) => ({ ...c, room: e.target.value }))} /></Field>
            <Field label="Début"><input type="time" value={slotForm.startTime} onChange={(e) => setSlotForm((c) => ({ ...c, startTime: e.target.value }))} /></Field>
            <Field label="Fin"><input type="time" value={slotForm.endTime} onChange={(e) => setSlotForm((c) => ({ ...c, endTime: e.target.value }))} /></Field>
            <Field label="Type de créneau"><select value={slotForm.slotType} onChange={(e) => setSlotForm((c) => ({ ...c, slotType: e.target.value }))}><option value="regular">Cours régulier</option><option value="support">Soutien</option><option value="makeup">Rattrapage</option><option value="activity">Activité</option><option value="exam">Évaluation</option></select></Field>
            <Field label="Statut"><select value={slotForm.status} onChange={(e) => setSlotForm((c) => ({ ...c, status: e.target.value }))}><option value="active">Actif</option><option value="planned">Planifié</option><option value="inactive">Inactif</option><option value="cancelled">Annulé</option></select></Field>
          </div>
          <div className={styles.formFooter}><button type="button" onClick={() => setDrawer(null)}>Annuler</button><button type="submit" disabled={isPending || !structureReady || (!canCreate && !editingSlotId)}>{isPending ? 'Enregistrement…' : editingSlotId ? 'Mettre à jour le créneau' : 'Créer le créneau'}</button></div>
        </form>
      </AcademicZoneAOverlay>

      <AcademicZoneAOverlay
        open={drawer === 'conflict'}
        onClose={() => setDrawer(null)}
        title="Timetable Conflict Chamber"
        eyebrow="Conflict solver"
        description="Comprendre la collision, son impact et ses chemins de résolution avant toute modification."
        size="chamber"
      >
        {selectedConflict ? <div className={styles.conflictDrawerContent}>
          <div className={styles.formCommandSummary}><strong>{selectedConflict.subject_name || selectedConflict.subject_code || 'Créneau'}</strong><span>{selectedConflict.class_code || selectedConflict.class_name || 'Classe'} · {dayLabel(selectedConflict.day_of_week)} · {selectedConflict.start_time.slice(0,5)}–{selectedConflict.end_time.slice(0,5)}</span></div>
          <div className={styles.conflictFacts}>
            <div><span>Conflits détectés</span><strong>{selectedConflict.conflict_count || 0}</strong></div>
            <div><span>Enseignant</span><strong>{selectedConflict.staff_full_name || 'Non affecté'}</strong></div>
            <div><span>Salle</span><strong>{selectedConflict.room || 'Non renseignée'}</strong></div>
            <div><span>Statut</span><strong>{selectedConflict.status}</strong></div>
          </div>
          <p className={styles.conflictDoctrine}>La Zone A ne déplace aucun créneau silencieusement. La résolution reste une décision explicite, liée à l’affectation et à l’historique du planning.</p>
          <div className={styles.formFooter}>
            {canUpdate ? <button type="button" onClick={() => openSlot(selectedConflict)}>Modifier ce créneau</button> : null}
            <Link href={`/angelcare-360-command-center/emploi-du-temps/classes/${selectedConflict.class_id}`}>Ouvrir la classe</Link>
            {selectedConflict.staff_id ? <Link href={`/angelcare-360-command-center/emploi-du-temps/enseignants/${selectedConflict.staff_id}`}>Ouvrir l’enseignant</Link> : null}
          </div>
        </div> : null}
      </AcademicZoneAOverlay>

      <AcademicZoneAOverlay
        open={drawer === 'event'}
        onClose={() => setDrawer(null)}
        title={editingEventId ? 'Calendar Command Drawer — modifier l’évènement' : 'Calendar Command Drawer — nouvel évènement'}
        eyebrow="Architecture temporelle"
        description="Planifier l’évènement scolaire tout en conservant sa période, son audience et son état."
        size="drawer"
      >
        <form className={styles.zoneForm} onSubmit={(event) => {
          event.preventDefault()
          if (!canCreate && !editingEventId) return setFeedback('La création des évènements est verrouillée pour votre rôle.')
          mutate('calendar-event', editingEventId ? 'update' : 'create', { id: editingEventId, ...eventForm, schoolId, academicYearId, description: eventForm.description || null })
        }}>
          <div className={styles.formGrid}>
            <Field label="Code"><input required value={eventForm.eventCode} onChange={(e) => setEventForm((c) => ({ ...c, eventCode: e.target.value }))} /></Field>
            <Field label="Titre"><input required value={eventForm.title} onChange={(e) => setEventForm((c) => ({ ...c, title: e.target.value }))} /></Field>
            <Field label="Début"><input required type="date" value={eventForm.startsOn} onChange={(e) => setEventForm((c) => ({ ...c, startsOn: e.target.value }))} /></Field>
            <Field label="Fin"><input required type="date" value={eventForm.endsOn} onChange={(e) => setEventForm((c) => ({ ...c, endsOn: e.target.value }))} /></Field>
            <Field label="Type"><select value={eventForm.eventType} onChange={(e) => setEventForm((c) => ({ ...c, eventType: e.target.value }))}><option value="activité">Activité</option><option value="exam">Évaluation</option><option value="holiday">Congé</option><option value="closure">Fermeture</option><option value="meeting">Réunion</option><option value="event">Évènement</option></select></Field>
            <Field label="Audience"><select value={eventForm.audience} onChange={(e) => setEventForm((c) => ({ ...c, audience: e.target.value }))}><option value="all">Tout l’établissement</option><option value="students">Élèves</option><option value="staff">Équipe</option><option value="families">Familles</option></select></Field>
            <Field label="Statut"><select value={eventForm.status} onChange={(e) => setEventForm((c) => ({ ...c, status: e.target.value }))}><option value="planned">Planifié</option><option value="confirmed">Confirmé</option><option value="completed">Terminé</option><option value="cancelled">Annulé</option></select></Field>
          </div>
          <Field label="Description"><textarea rows={5} value={eventForm.description} onChange={(e) => setEventForm((c) => ({ ...c, description: e.target.value }))} /></Field>
          <div className={styles.formFooter}><button type="button" onClick={() => setDrawer(null)}>Annuler</button><button type="submit" disabled={isPending || (!canCreate && !editingEventId)}>{isPending ? 'Enregistrement…' : editingEventId ? 'Mettre à jour l’évènement' : 'Créer l’évènement'}</button></div>
        </form>
      </AcademicZoneAOverlay>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className={styles.formField}><span>{label}</span>{children}</label>
}
