import { createClient } from '@/lib/supabase/server'

type Row = Record<string, unknown>
type Option = { label: string; value: string }

export type Angelcare360ClassStructureRecord = {
  id: string
  school_id: string
  academic_year_id: string
  class_code: string
  name: string
  level: string
  capacity: number
  order_index: number
  homeroom_staff_id: string | null
  description: string
  status: string
  effectif: number
  occupancy: number | null
  remainingSeats: number
  sectionCount: number
  sectionLabels: string[]
  teacherName: string
}

export type Angelcare360SectionStructureRecord = {
  id: string
  school_id: string
  academic_year_id: string
  class_id: string
  section_code: string
  name: string
  capacity: number
  room: string
  main_teacher_id: string | null
  status: string
  className: string
  classCode: string
  level: string
  effectif: number
  occupancy: number | null
}

export type Angelcare360AssignmentStructureRecord = {
  id: string
  staff_id: string
  class_id: string | null
  section_id: string | null
  subject_id: string | null
  assignment_role: string
  weekly_hours: number
  status: string
  staffName: string
  className: string
  sectionName: string
  subjectName: string
}

export type Angelcare360ClassesSectionsOverviewData = {
  classes: Angelcare360ClassStructureRecord[]
  sections: Angelcare360SectionStructureRecord[]
  assignments: Angelcare360AssignmentStructureRecord[]
  metrics: {
    activeClasses: number
    activeSections: number
    totalCapacity: number
    totalStudents: number
    occupancyRate: number | null
    nearFullClasses: number
    overloadedClasses: number
    availableClasses: number
    reassignmentCount: number
  }
  levelMatrix: Array<{
    level: string
    sectionCount: number
    classCount: number
    capacity: number
    effectif: number
    occupancy: number | null
  }>
  heatmap: {
    levels: string[]
    rows: Array<{
      section: string
      cells: Record<string, { occupancy: number | null; effectif: number; capacity: number } | null>
    }>
  }
  alerts: Array<{
    id: string
    title: string
    detail: string
    count: number
    tone: 'red' | 'orange' | 'blue' | 'green'
    href: string
  }>
  reassignments: Array<{
    id: string
    title: string
    detail: string
    priority: 'haute' | 'moyenne' | 'basse'
    dueLabel: string
    tone: 'red' | 'orange' | 'green'
    href: string
  }>
  options: {
    classes: Option[]
    sections: Option[]
    staff: Option[]
    subjects: Option[]
    levels: Option[]
  }
  queryWarnings: string[]
}

function asString(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value)
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function asRowArray(value: unknown): Row[] {
  return Array.isArray(value) ? (value as unknown as Row[]) : []
}

function asObject(value: unknown): Row {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Row) : {}
}

function percentage(part: number, total: number) {
  if (!total) return null
  return Math.round((part / total) * 1000) / 10
}

function normalizeLevel(value: unknown) {
  return asString(value).trim() || 'Niveau à préciser'
}

function normalizedSectionKey(row: Row) {
  return asString(row.section_code || row.name).trim() || 'Section'
}

function dueLabel(offset: number) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date)
}

async function safeQuery(
  label: string,
  query: PromiseLike<{ data: unknown; error: { message?: string } | null }>,
  warnings: string[],
) {
  const { data, error } = await query
  if (error) {
    const warning = `${label}: ${error.message || 'source indisponible'}`
    if (!warnings.includes(warning)) warnings.push(warning)
    return [] as Row[]
  }
  return asRowArray(data)
}

export async function getAngelcare360ClassesSectionsOverviewData(input: {
  schoolId: string
  academicYearId: string | null
}): Promise<Angelcare360ClassesSectionsOverviewData> {
  const client = await createClient()
  const warnings: string[] = []

  let classesQuery = client
    .from('angelcare360_classes')
    .select('id, school_id, academic_year_id, class_code, name, level, capacity, order_index, homeroom_staff_id, status, metadata_json, created_at, updated_at')
    .eq('school_id', input.schoolId)
    .order('order_index', { ascending: true })
    .order('name', { ascending: true })
  let sectionsQuery = client
    .from('angelcare360_sections')
    .select('id, school_id, academic_year_id, class_id, section_code, name, capacity, room, status, metadata_json, created_at, updated_at')
    .eq('school_id', input.schoolId)
    .order('name', { ascending: true })
  let assignmentsQuery = client
    .from('angelcare360_teacher_assignments')
    .select('id, school_id, academic_year_id, staff_id, class_id, section_id, subject_id, assignment_role, weekly_hours, status, metadata_json, created_at, updated_at')
    .eq('school_id', input.schoolId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (input.academicYearId) {
    classesQuery = classesQuery.eq('academic_year_id', input.academicYearId)
    sectionsQuery = sectionsQuery.eq('academic_year_id', input.academicYearId)
    assignmentsQuery = assignmentsQuery.eq('academic_year_id', input.academicYearId)
  }

  const [classRows, sectionRows, studentRows, assignmentRows, staffRows, subjectRows] = await Promise.all([
    safeQuery('classes', classesQuery, warnings),
    safeQuery('sections', sectionsQuery, warnings),
    safeQuery(
      'students',
      client
        .from('angelcare360_students')
        .select('id, school_id, full_name, current_class_id, current_section_id, status, metadata_json')
        .eq('school_id', input.schoolId)
        .eq('status', 'active'),
      warnings,
    ),
    safeQuery('affectations', assignmentsQuery, warnings),
    safeQuery(
      'staff',
      client
        .from('angelcare360_staff')
        .select('id, school_id, staff_code, full_name, staff_type, status, metadata_json')
        .eq('school_id', input.schoolId)
        .in('status', ['active', 'on_leave'])
        .order('full_name', { ascending: true }),
      warnings,
    ),
    safeQuery(
      'matieres',
      client
        .from('angelcare360_subjects')
        .select('id, school_id, subject_code, name, status')
        .eq('school_id', input.schoolId)
        .eq('status', 'active')
        .order('name', { ascending: true }),
      warnings,
    ),
  ])

  const classById = new Map(classRows.map((row) => [asString(row.id), row]))
  const sectionById = new Map(sectionRows.map((row) => [asString(row.id), row]))
  const staffById = new Map(staffRows.map((row) => [asString(row.id), row]))
  const subjectById = new Map(subjectRows.map((row) => [asString(row.id), row]))

  const studentsByClass = new Map<string, Row[]>()
  const studentsBySection = new Map<string, Row[]>()
  for (const student of studentRows) {
    const classId = asString(student.current_class_id)
    const sectionId = asString(student.current_section_id)
    if (classId) studentsByClass.set(classId, [...(studentsByClass.get(classId) || []), student])
    if (sectionId) studentsBySection.set(sectionId, [...(studentsBySection.get(sectionId) || []), student])
  }

  const sectionsByClass = new Map<string, Row[]>()
  for (const section of sectionRows) {
    const classId = asString(section.class_id)
    sectionsByClass.set(classId, [...(sectionsByClass.get(classId) || []), section])
  }

  const assignmentsByClass = new Map<string, Row[]>()
  for (const assignment of assignmentRows) {
    const classId = asString(assignment.class_id)
    if (classId) assignmentsByClass.set(classId, [...(assignmentsByClass.get(classId) || []), assignment])
  }

  const classes: Angelcare360ClassStructureRecord[] = classRows.map((row) => {
    const id = asString(row.id)
    const capacity = asNumber(row.capacity)
    const effectif = (studentsByClass.get(id) || []).length
    const classSections = sectionsByClass.get(id) || []
    const assignments = assignmentsByClass.get(id) || []
    const primaryAssignment = assignments.find((assignment) => {
      const role = asString(assignment.assignment_role).toLowerCase()
      return role.includes('principal') || role.includes('titulaire') || role.includes('homeroom')
    }) || assignments[0]
    const teacherId = asString(row.homeroom_staff_id || primaryAssignment?.staff_id)
    const teacher = staffById.get(teacherId)
    const meta = asObject(row.metadata_json)

    return {
      id,
      school_id: asString(row.school_id),
      academic_year_id: asString(row.academic_year_id),
      class_code: asString(row.class_code),
      name: asString(row.name),
      level: normalizeLevel(row.level),
      capacity,
      order_index: asNumber(row.order_index) || 1,
      homeroom_staff_id: teacherId || null,
      description: asString(meta.description),
      status: asString(row.status) || 'active',
      effectif,
      occupancy: percentage(effectif, capacity),
      remainingSeats: Math.max(0, capacity - effectif),
      sectionCount: classSections.filter((section) => asString(section.status) === 'active').length,
      sectionLabels: classSections.map((section) => asString(section.section_code || section.name)).filter(Boolean),
      teacherName: asString(teacher?.full_name) || 'Titulaire à affecter',
    }
  })

  const sections: Angelcare360SectionStructureRecord[] = sectionRows.map((row) => {
    const id = asString(row.id)
    const classRow = classById.get(asString(row.class_id))
    const capacity = asNumber(row.capacity)
    const effectif = (studentsBySection.get(id) || []).length
    const meta = asObject(row.metadata_json)
    return {
      id,
      school_id: asString(row.school_id),
      academic_year_id: asString(row.academic_year_id),
      class_id: asString(row.class_id),
      section_code: asString(row.section_code),
      name: asString(row.name),
      capacity,
      room: asString(row.room),
      main_teacher_id: asString(meta.main_teacher_id) || null,
      status: asString(row.status) || 'active',
      className: asString(classRow?.name) || 'Classe',
      classCode: asString(classRow?.class_code),
      level: normalizeLevel(classRow?.level),
      effectif,
      occupancy: percentage(effectif, capacity),
    }
  })

  const assignments: Angelcare360AssignmentStructureRecord[] = assignmentRows.map((row) => {
    const staff = staffById.get(asString(row.staff_id))
    const classRow = classById.get(asString(row.class_id))
    const section = sectionById.get(asString(row.section_id))
    const subject = subjectById.get(asString(row.subject_id))
    return {
      id: asString(row.id),
      staff_id: asString(row.staff_id),
      class_id: asString(row.class_id) || null,
      section_id: asString(row.section_id) || null,
      subject_id: asString(row.subject_id) || null,
      assignment_role: asString(row.assignment_role) || 'teacher',
      weekly_hours: asNumber(row.weekly_hours),
      status: asString(row.status) || 'active',
      staffName: asString(staff?.full_name) || 'Enseignant à préciser',
      className: asString(classRow?.name || classRow?.class_code) || 'Classe à préciser',
      sectionName: asString(section?.name || section?.section_code),
      subjectName: asString(subject?.name || subject?.subject_code),
    }
  })

  const activeClasses = classes.filter((row) => row.status === 'active')
  const activeSections = sections.filter((row) => row.status === 'active')
  const totalCapacity = activeClasses.reduce((sum, row) => sum + row.capacity, 0)
  const totalStudents = activeClasses.reduce((sum, row) => sum + row.effectif, 0)
  const nearFull = activeClasses.filter((row) => row.occupancy !== null && row.occupancy >= 85 && row.occupancy <= 100)
  const overloaded = activeClasses.filter((row) => row.occupancy !== null && row.occupancy > 100)
  const available = activeClasses.filter((row) => row.remainingSeats >= 5)

  const mismatchStudents = studentRows.filter((student) => {
    const classId = asString(student.current_class_id)
    const sectionId = asString(student.current_section_id)
    if (!classId || !sectionId) return false
    const section = sectionById.get(sectionId)
    return Boolean(section && asString(section.class_id) !== classId)
  })

  const missingSectionByClass = new Map<string, number>()
  for (const student of studentRows) {
    const classId = asString(student.current_class_id)
    if (!classId || asString(student.current_section_id)) continue
    const activeClassSections = (sectionsByClass.get(classId) || []).filter((section) => asString(section.status) === 'active')
    if (activeClassSections.length) missingSectionByClass.set(classId, (missingSectionByClass.get(classId) || 0) + 1)
  }

  const reassignments: Angelcare360ClassesSectionsOverviewData['reassignments'] = []
  for (const row of overloaded) {
    const excess = Math.max(1, row.effectif - row.capacity)
    reassignments.push({
      id: `overload-${row.id}`,
      title: `${row.class_code || row.name} — Rééquilibrage effectifs`,
      detail: `${excess} élève(s) au-dessus de la capacité`,
      priority: 'haute',
      dueLabel: dueLabel(1),
      tone: 'red',
      href: '/angelcare-360-command-center/personnes/affectations-classes',
    })
  }
  for (const [classId, count] of missingSectionByClass.entries()) {
    const row = classes.find((item) => item.id === classId)
    if (!row) continue
    reassignments.push({
      id: `section-${classId}`,
      title: `${row.class_code || row.name} — Sections à compléter`,
      detail: `${count} élève(s) sans section active`,
      priority: count >= 3 ? 'moyenne' : 'basse',
      dueLabel: dueLabel(count >= 3 ? 2 : 4),
      tone: count >= 3 ? 'orange' : 'green',
      href: '/angelcare-360-command-center/personnes/affectations-classes',
    })
  }
  if (mismatchStudents.length) {
    reassignments.push({
      id: 'section-class-mismatch',
      title: 'Cohérence classe / section',
      detail: `${mismatchStudents.length} dossier(s) avec rattachement incohérent`,
      priority: 'haute',
      dueLabel: dueLabel(1),
      tone: 'red',
      href: '/angelcare-360-command-center/personnes/affectations-classes',
    })
  }

  const reassignmentCount = overloaded.reduce((sum, row) => sum + Math.max(1, row.effectif - row.capacity), 0)
    + Array.from(missingSectionByClass.values()).reduce((sum, count) => sum + count, 0)
    + mismatchStudents.length

  const levelOrder = Array.from(new Set(activeClasses.map((row) => row.level)))
  const levelMatrix = levelOrder.map((level) => {
    const levelClasses = activeClasses.filter((row) => row.level === level)
    const classIds = new Set(levelClasses.map((row) => row.id))
    const levelSections = activeSections.filter((row) => classIds.has(row.class_id))
    const capacity = levelClasses.reduce((sum, row) => sum + row.capacity, 0)
    const effectif = levelClasses.reduce((sum, row) => sum + row.effectif, 0)
    return {
      level,
      sectionCount: levelSections.length,
      classCount: levelClasses.length,
      capacity,
      effectif,
      occupancy: percentage(effectif, capacity),
    }
  })

  const heatLevels = levelOrder.slice(0, 6)
  const sectionKeys = Array.from(new Set(activeSections.map((row) => row.section_code || row.name))).slice(0, 6)
  const heatRows = sectionKeys.map((sectionKey) => {
    const cells: Record<string, { occupancy: number | null; effectif: number; capacity: number } | null> = {}
    for (const level of heatLevels) {
      const matching = activeSections.filter((section) => (section.section_code || section.name) === sectionKey && section.level === level)
      if (!matching.length) {
        cells[level] = null
        continue
      }
      const capacity = matching.reduce((sum, row) => sum + row.capacity, 0)
      const effectif = matching.reduce((sum, row) => sum + row.effectif, 0)
      cells[level] = { occupancy: percentage(effectif, capacity), effectif, capacity }
    }
    return { section: sectionKey, cells }
  })

  const alerts: Angelcare360ClassesSectionsOverviewData['alerts'] = [
    {
      id: 'overloaded',
      title: 'Groupes surchargés',
      detail: overloaded.length ? `${overloaded.length} classe(s) dépassent leur capacité.` : 'Aucune classe ne dépasse sa capacité.',
      count: overloaded.length,
      tone: overloaded.length ? 'red' : 'green',
      href: '#classes',
    },
    {
      id: 'near-full',
      title: 'Capacité bientôt atteinte',
      detail: nearFull.length ? `${nearFull.length} classe(s) entre 85 % et 100 % d’occupation.` : 'Aucune classe en seuil de vigilance.',
      count: nearFull.length,
      tone: nearFull.length ? 'orange' : 'green',
      href: '#classes',
    },
    {
      id: 'available',
      title: 'Capacité disponible',
      detail: available.length ? `${available.length} classe(s) disposent d’au moins 5 places.` : 'Aucune réserve de capacité significative.',
      count: available.length,
      tone: available.length ? 'blue' : 'orange',
      href: '#capacity',
    },
  ]

  const existingLevels = Array.from(new Set(classes.map((row) => row.level).filter(Boolean)))
  const defaultLevels = ['Maternelle', 'CP', 'CE1', 'CE2', 'CM1', 'CM2', 'Collège', 'Lycée']
  const levels = Array.from(new Set([...existingLevels, ...defaultLevels])).map((level) => ({ label: level, value: level }))
  const teacherRows = staffRows.filter((row) => asString(row.staff_type) === 'teacher')
  const staffSource = teacherRows.length ? teacherRows : staffRows

  return {
    classes,
    sections,
    assignments,
    metrics: {
      activeClasses: activeClasses.length,
      activeSections: activeSections.length,
      totalCapacity,
      totalStudents,
      occupancyRate: percentage(totalStudents, totalCapacity),
      nearFullClasses: nearFull.length,
      overloadedClasses: overloaded.length,
      availableClasses: available.length,
      reassignmentCount,
    },
    levelMatrix,
    heatmap: { levels: heatLevels, rows: heatRows },
    alerts,
    reassignments: reassignments.slice(0, 6),
    options: {
      classes: activeClasses.map((row) => ({ label: `${row.class_code} · ${row.name}`.trim(), value: row.id })),
      sections: activeSections.map((row) => ({ label: `${row.classCode} / ${row.section_code} · ${row.name}`.trim(), value: row.id })),
      staff: staffSource.map((row) => ({ label: `${asString(row.full_name)}${row.staff_code ? ` · ${asString(row.staff_code)}` : ''}`, value: asString(row.id) })),
      subjects: subjectRows.map((row) => ({ label: `${asString(row.name)}${row.subject_code ? ` · ${asString(row.subject_code)}` : ''}`, value: asString(row.id) })),
      levels,
    },
    queryWarnings: warnings,
  }
}
