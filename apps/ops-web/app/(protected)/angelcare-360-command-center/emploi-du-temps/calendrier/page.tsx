import { redirect } from 'next/navigation'
import { ANGELCARE360_TIMETABLE_NAVIGATION } from '@/data/angelcare360/timetable-navigation'
import Angelcare360TimetablePageShell from '@/components/angelcare360/timetable/Angelcare360TimetablePageShell'
import Angelcare360TimetableWorkspace from '@/components/angelcare360/timetable/Angelcare360TimetableWorkspace'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360SchoolCalendarEvents, listAngelcare360TimetableSlots } from '@/lib/angelcare360/server/timetable'
import { listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import { listAngelcare360Sections, listAngelcare360Subjects, listAngelcare360TeacherAssignments } from '@/lib/angelcare360/server/administration'
import Angelcare360EmptyState from '@/components/angelcare360/states/Angelcare360EmptyState'

export const dynamic = 'force-dynamic'

type Row = Record<string, unknown>

function text(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function relation(value: unknown): Row {
  if (Array.isArray(value)) return (value[0] || {}) as Row
  return value && typeof value === 'object' ? value as Row : {}
}

export default async function Angelcare360SchoolCalendarPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const academicYearId = context.academicYear?.id || null
  const [slots, events, classes, sections, subjects, assignments] = await Promise.all([
    listAngelcare360TimetableSlots({ schoolId: context.school.id, academicYearId }),
    listAngelcare360SchoolCalendarEvents({ schoolId: context.school.id, academicYearId }),
    listAngelcare360Classes(context.school.id, academicYearId),
    listAngelcare360Sections(context.school.id, academicYearId),
    listAngelcare360Subjects(context.school.id),
    listAngelcare360TeacherAssignments(context.school.id, academicYearId),
  ])

  const classOptions = (classes as Row[]).map((row) => ({
    value: text(row.id),
    label: text(row.class_code) ? `${text(row.class_code)} · ${text(row.name) || 'Classe'}` : text(row.name) || 'Classe',
  })).filter((item) => item.value)

  const sectionOptions = (sections as Row[]).map((row) => ({
    value: text(row.id),
    label: text(row.section_code) ? `${text(row.section_code)} · ${text(row.name) || 'Section'}` : text(row.name) || 'Section',
    parentId: text(row.class_id) || null,
  })).filter((item) => item.value)

  const subjectOptions = (subjects as Row[]).map((row) => ({
    value: text(row.id),
    label: text(row.subject_code) ? `${text(row.subject_code)} · ${text(row.name) || 'Matière'}` : text(row.name) || 'Matière',
  })).filter((item) => item.value)

  const assignmentOptions = (assignments as Row[]).map((row) => {
    const staff = relation(row.staff)
    const klass = relation(row.class)
    const section = relation(row.section)
    const subject = relation(row.subject)
    return {
      id: text(row.id),
      staffId: text(row.staff_id),
      staffLabel: text(staff.full_name) || text(staff.staff_code) || 'Enseignant',
      classId: text(row.class_id),
      classLabel: text(klass.class_code) || text(klass.name) || 'Classe',
      sectionId: text(row.section_id) || null,
      sectionLabel: text(section.section_code) || text(section.name) || null,
      subjectId: text(row.subject_id),
      subjectLabel: text(subject.subject_code) || text(subject.name) || 'Matière',
      status: text(row.status),
    }
  }).filter((item) => item.id && item.staffId && item.classId && item.subjectId)

  const staffOptions = [...new Map(assignmentOptions.map((item) => [item.staffId, { value: item.staffId, label: item.staffLabel }])).values()]

  return (
    <Angelcare360TimetablePageShell
      title="Calendrier scolaire"
      subtitle="Évènements, congés, activités et créneaux réunis dans un airspace pilotable."
      badge="Airspace"
      statusLabel={`${events.length} évènement(s) · ${slots.length} créneau(x)`}
      contextRow={<Badge label={`Établissement: ${context.school.name}`} />}
      navigationItems={ANGELCARE360_TIMETABLE_NAVIGATION}
    >
      {events.length === 0 && slots.length === 0 ? (
        <Angelcare360EmptyState title="Planning à construire" description="Aucun évènement ni créneau n’est encore planifié. La création reste liée aux classes, matières et affectations existantes." />
      ) : null}
      <Angelcare360TimetableWorkspace
        schoolId={context.school.id}
        academicYearId={academicYearId || ''}
        slots={slots}
        events={events}
        classOptions={classOptions}
        sectionOptions={sectionOptions}
        subjectOptions={subjectOptions}
        staffOptions={staffOptions}
        assignmentOptions={assignmentOptions}
        canCreate={context.permissions.has('emploi_du_temps.create') || context.access.accessLevel === 'super_admin'}
        canUpdate={context.permissions.has('emploi_du_temps.update') || context.access.accessLevel === 'super_admin'}
      />
    </Angelcare360TimetablePageShell>
  )
}

function Badge({ label }: { label: string }) {
  return <span style={badgeStyle}>{label}</span>
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  padding: '6px 10px',
  background: '#eff6ff',
  color: '#1e40af',
  fontSize: 12,
  fontWeight: 900,
}
