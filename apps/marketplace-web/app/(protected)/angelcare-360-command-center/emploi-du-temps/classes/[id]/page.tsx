import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ANGELCARE360_TIMETABLE_NAVIGATION } from '@/data/angelcare360/timetable-navigation'
import Angelcare360TimetablePageShell from '@/components/angelcare360/timetable/Angelcare360TimetablePageShell'
import AcademicZoneAQuickCommand from '@/components/angelcare360/zone-a-academic/AcademicZoneAQuickCommand'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360TimetableSlots } from '@/lib/angelcare360/server/timetable'
import { listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import type { Angelcare360TimetableSlotListRecord } from '@/types/angelcare360/attendance'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClassAcademicDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')
  const { id } = await params
  const [allSlots, classes] = await Promise.all([
    listAngelcare360TimetableSlots({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360Classes(context.school.id, context.academicYear?.id || null),
  ])
  const classRecord = classes.find((item) => String(item.id) === id)
  if (!classRecord) notFound()

  const slots: Angelcare360TimetableSlotListRecord[] = allSlots.filter((slot) => slot.class_id === id)
  const conflicts = slots.reduce((sum, slot) => sum + (slot.conflict_count || 0), 0)
  const subjects = new Set(slots.map((slot) => slot.subject_id)).size
  const teachers = new Set(slots.map((slot) => slot.staff_id).filter(Boolean)).size
  const classLabel = String(classRecord.class_code || classRecord.name || 'Dossier de classe')

  return (
    <Angelcare360TimetablePageShell
      title={classLabel}
      subtitle="Dossier académique du groupe : rythme hebdomadaire, matières, enseignants, readiness et conflits de planning."
      badge="Class Academic Command"
      statusLabel={slots.length ? `${slots.length} créneau(x)` : 'Planning à préparer'}
      navigationItems={ANGELCARE360_TIMETABLE_NAVIGATION}
      primaryAction={<div style={commandFooterStyle}><AcademicZoneAQuickCommand label="Commandes de la classe" title="Class Academic Quick Command" eyebrow="Classe · pilotage" description="Accéder aux matières opérationnelles de cette classe sans perdre le dossier courant." actions={[{ label: 'Cours de la classe', href: `/angelcare-360-command-center/academique/cours?classId=${id}`, detail: 'Séances, réalisation et progression.' }, { label: 'Devoirs', href: `/angelcare-360-command-center/academique/devoirs?classId=${id}`, detail: 'Travail à rendre et correction.' }, { label: 'Évaluations', href: `/angelcare-360-command-center/academique/examens?classId=${id}`, detail: 'Évaluations planifiées et résultats.' }, { label: 'Notes & maîtrise', href: `/angelcare-360-command-center/academique/notes?classId=${id}`, detail: 'Matrice de saisie et consolidation.' }]} /><Link href="/angelcare-360-command-center/emploi-du-temps/classes" style={linkStyle}>Retour aux classes</Link></div>}
      contextRow={<><Badge label={`${subjects} matière(s)`} /><Badge label={`${teachers} enseignant(s)`} /><Badge label={`${conflicts} conflit(s)`} /><Badge label={`Capacité: ${classRecord.capacity ?? '—'}`} /></>}
    >
      <section style={panelStyle}>
        <div style={heroGridStyle}>
          <Metric label="Charge hebdomadaire" value={slots.length} />
          <Metric label="Matières" value={subjects} />
          <Metric label="Enseignants" value={teachers} />
          <Metric label="Conflits" value={conflicts} />
        </div>

        {slots.length ? (
          <div style={scheduleStyle}>
            {[...slots].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)).map((slot) => (
              <article key={slot.id} style={{ ...slotStyle, ...((slot.conflict_count || 0) > 0 ? conflictSlotStyle : null) }}>
                <div style={timeBlockStyle}><span style={dayStyle}>{dayLabel(slot.day_of_week)}</span><strong>{slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}</strong></div>
                <div style={subjectBlockStyle}><b>{slot.subject_name || slot.subject_code || 'Matière'}</b><small>{slot.staff_full_name || 'Enseignant non affecté'}{slot.room ? ` · Salle ${slot.room}` : ''}</small></div>
                <em style={(slot.conflict_count || 0) > 0 ? conflictPillStyle : cleanPillStyle}>{slot.conflict_count || 0} conflit(s)</em>
              </article>
            ))}
          </div>
        ) : (
          <div style={emptyCommandStyle}>
            <span>Planning pédagogique à préparer</span>
            <strong>{classRecord.name || classRecord.class_code || 'Cette classe'} existe bien dans Area 3.</strong>
            <p>Aucun créneau n’est encore programmé pour l’année active. Le dossier reste accessible : absence de planning ne signifie jamais classe inexistante.</p>
            <div style={commandFooterStyle}>
              <Link href="/angelcare-360-command-center/emploi-du-temps" style={linkStyle}>Préparer le planning</Link>
              <Link href="/angelcare-360-command-center/administration?plane=assignments" style={linkStyle}>Vérifier les affectations</Link>
            </div>
          </div>
        )}

        <div style={commandFooterStyle}>
          <Link href={`/angelcare-360-command-center/academique/cours?classId=${id}`} style={linkStyle}>Cours de la classe</Link>
          <Link href={`/angelcare-360-command-center/academique/devoirs?classId=${id}`} style={linkStyle}>Devoirs</Link>
          <Link href={`/angelcare-360-command-center/academique/examens?classId=${id}`} style={linkStyle}>Évaluations</Link>
          <Link href={`/angelcare-360-command-center/academique/notes?classId=${id}`} style={linkStyle}>Notes & maîtrise</Link>
          <Link href="/angelcare-360-command-center/academique?plane=progression" style={linkStyle}>Progression</Link>
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
