import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ANGELCARE360_TIMETABLE_NAVIGATION } from '@/data/angelcare360/timetable-navigation'
import Angelcare360TimetablePageShell from '@/components/angelcare360/timetable/Angelcare360TimetablePageShell'
import AcademicZoneAQuickCommand from '@/components/angelcare360/zone-a-academic/AcademicZoneAQuickCommand'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360TimetableSlots } from '@/lib/angelcare360/server/timetable'
import { listAngelcare360Staff } from '@/lib/angelcare360/server/queries'
import { listAngelcare360TeacherAssignments } from '@/lib/angelcare360/server/administration'
import type { Angelcare360TimetableSlotListRecord } from '@/types/angelcare360/attendance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360TeacherLoadDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  const { id } = await params
  const [allSlots, staff, assignments] = await Promise.all([
    listAngelcare360TimetableSlots({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360Staff(context.school.id),
    listAngelcare360TeacherAssignments(context.school.id, context.academicYear?.id || null),
  ])
  const teacher = staff.find((item) => String(item.id) === id && String(item.staff_type || '').toLowerCase() === 'teacher')
  if (!teacher) notFound()

  const slots: Angelcare360TimetableSlotListRecord[] = allSlots.filter((slot) => slot.staff_id === id)
  const teacherAssignments = assignments.filter((assignment) => String(assignment.staff_id || '') === id)
  const conflicts = slots.reduce((sum, slot) => sum + (slot.conflict_count || 0), 0)
  const classes = new Set(slots.map((slot) => slot.class_id)).size
  const subjects = new Set(slots.map((slot) => slot.subject_id)).size
  const teacherName = String(teacher.full_name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.staff_code || 'Dossier enseignant')

  return (
    <Angelcare360TimetablePageShell
      title={teacherName}
      subtitle="Charge académique, classes, matières, affectations et répartition temporelle de l’enseignant."
      badge="Teacher Load Command"
      statusLabel={slots.length ? `${slots.length} créneau(x)` : 'Aucune séance planifiée'}
      navigationItems={ANGELCARE360_TIMETABLE_NAVIGATION}
      primaryAction={<div style={commandFooterStyle}><AcademicZoneAQuickCommand label="Commandes enseignant" title="Teacher Load Quick Command" eyebrow="Enseignant · charge" description="Ouvrir les vues académiques utiles à partir de la charge réelle de cet enseignant." actions={[{ label: 'Planning', href: `/angelcare-360-command-center/emploi-du-temps?teacherId=${id}`, detail: 'Créneaux et conflits de planning.' }, { label: 'Cours', href: `/angelcare-360-command-center/academique/cours?staffId=${id}`, detail: 'Cours attribués et exécution.' }, { label: 'Évaluations', href: `/angelcare-360-command-center/academique/examens?staffId=${id}`, detail: 'Évaluations et échéances.' }, { label: 'Coordination', href: '/angelcare-360-command-center/academique?plane=review', detail: 'Points nécessitant une intervention pédagogique.' }]} /><Link href="/angelcare-360-command-center/emploi-du-temps/enseignants" style={linkStyle}>Retour aux enseignants</Link></div>}
      contextRow={<><Badge label={`${classes} classe(s)`} /><Badge label={`${subjects} matière(s)`} /><Badge label={`${teacherAssignments.length} affectation(s)`} /><Badge label={`${conflicts} conflit(s)`} /></>}
    >
      <section style={panelStyle}>
        <div style={heroGridStyle}>
          <Metric label="Créneaux" value={slots.length} />
          <Metric label="Affectations" value={teacherAssignments.length} />
          <Metric label="Classes planifiées" value={classes} />
          <Metric label="Conflits" value={conflicts} />
        </div>

        {slots.length ? (
          <div style={scheduleStyle}>
            {[...slots].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)).map((slot) => (
              <article key={slot.id} style={{ ...slotStyle, ...((slot.conflict_count || 0) > 0 ? conflictSlotStyle : null) }}>
                <div style={timeBlockStyle}><span style={dayStyle}>{dayLabel(slot.day_of_week)}</span><strong>{slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}</strong></div>
                <div style={subjectBlockStyle}><b>{slot.class_code || slot.class_name || 'Classe'} · {slot.subject_name || slot.subject_code || 'Matière'}</b><small>{slot.section_name || 'Section non précisée'}{slot.room ? ` · Salle ${slot.room}` : ''}</small></div>
                <em style={(slot.conflict_count || 0) > 0 ? conflictPillStyle : cleanPillStyle}>{slot.conflict_count || 0} conflit(s)</em>
              </article>
            ))}
          </div>
        ) : (
          <div style={emptyCommandStyle}>
            <span>Aucune séance planifiée pour cette période</span>
            <strong>{teacherName} reste un enseignant canonique Area 5.</strong>
            <p>{teacherAssignments.length ? `${teacherAssignments.length} affectation(s) pédagogique(s) existent, mais aucun créneau n’est encore programmé.` : 'Aucune affectation active n’est actuellement reliée au planning.'}</p>
            <div style={commandFooterStyle}>
              <Link href="/angelcare-360-command-center/emploi-du-temps" style={linkStyle}>Préparer le planning</Link>
              <Link href="/angelcare-360-command-center/administration?plane=assignments" style={linkStyle}>Ouvrir les affectations</Link>
            </div>
          </div>
        )}

        <div style={commandFooterStyle}>
          <Link href="/angelcare-360-command-center/emploi-du-temps?plane=conflicts" style={linkStyle}>Inspecter les conflits</Link>
          <Link href="/angelcare-360-command-center/academique?plane=review" style={linkStyle}>Coordination académique</Link>
          <Link href="/angelcare-360-command-center/academique/cours" style={linkStyle}>Cours</Link>
          <Link href="/angelcare-360-command-center/academique/examens" style={linkStyle}>Évaluations</Link>
        </div>
      </section>
    </Angelcare360TimetablePageShell>
  )
}

function dayLabel(day: number) { return ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'][Math.max(0, day - 1)] || `Jour ${day}` }
function Metric({ label, value }: { label: string; value: number }) { return <div style={metricStyle}><span>{label}</span><strong>{value}</strong></div> }
function Badge({ label }: { label: string }) { return <span style={badgeStyle}>{label}</span> }
const panelStyle: React.CSSProperties = { display: 'grid', gap: 16, padding: 18 }
const heroGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 9 }
const metricStyle: React.CSSProperties = { display: 'grid', gap: 4, padding: 14, borderRadius: 15, border: '1px solid #dbe7ee', background: '#f8fbfd' }
const scheduleStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const slotStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '150px minmax(0,1fr) auto', gap: 13, alignItems: 'center', padding: 13, borderRadius: 14, border: '1px solid #dce7ee', background: '#fff' }
const conflictSlotStyle: React.CSSProperties = { borderColor: '#f0c6cc', background: '#fff8f9' }
const timeBlockStyle: React.CSSProperties = { display: 'grid', gap: 4 }
const dayStyle: React.CSSProperties = { color: '#0b7c9d', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 900 }
const subjectBlockStyle: React.CSSProperties = { display: 'grid', gap: 3 }
const cleanPillStyle: React.CSSProperties = { fontStyle: 'normal', borderRadius: 999, padding: '5px 8px', background: '#edf8f4', color: '#0b7759', fontSize: 9, fontWeight: 900 }
const conflictPillStyle: React.CSSProperties = { ...cleanPillStyle, background: '#fff0f2', color: '#c83c50' }
const commandFooterStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }
const linkStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', minHeight: 36, borderRadius: 10, border: '1px solid #cfe0e9', padding: '8px 10px', background: '#f6fbfd', color: '#155f7b', textDecoration: 'none', fontSize: 10, fontWeight: 900 }
const badgeStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', borderRadius: 999, padding: '6px 9px', background: '#eef8fb', color: '#176b85', fontSize: 10, fontWeight: 900 }
const emptyCommandStyle: React.CSSProperties = { display: 'grid', gap: 7, padding: 20, borderRadius: 18, border: '1px dashed #bcd6e1', background: 'linear-gradient(145deg,#f7fbfd,#fff)', color: '#345d74' }
