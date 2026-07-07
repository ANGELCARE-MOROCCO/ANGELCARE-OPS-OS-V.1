import type { Angelcare360AdministrationOverview } from '@/types/angelcare360/administration'

function readMetadata(record: Record<string, unknown>) {
  return (record.metadata_json && typeof record.metadata_json === 'object' ? record.metadata_json : {}) as Record<string, unknown>
}

export function mapSchoolRow(row: Record<string, unknown>): Record<string, unknown> {
  const metadata = readMetadata(row)
  return {
    ...row,
    contact_principal: row.contact_principal || metadata.contact_principal || null,
    target_capacity: row.target_capacity || metadata.target_capacity || null,
    notes: row.notes || metadata.notes || null,
  }
}

export function mapAcademicYearRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    is_current: Boolean(row.is_current),
  }
}

export function mapTermRow(row: Record<string, unknown>): Record<string, unknown> {
  const metadata = readMetadata(row)
  return {
    ...row,
    term_type: row.term_type || metadata.term_type || null,
  }
}

export function mapClassRow(row: Record<string, unknown>): Record<string, unknown> {
  const metadata = readMetadata(row)
  return {
    ...row,
    description: row.description || metadata.description || null,
  }
}

export function mapSectionRow(row: Record<string, unknown>): Record<string, unknown> {
  const metadata = readMetadata(row)
  return {
    ...row,
    main_teacher_id: row.main_teacher_id || metadata.main_teacher_id || null,
  }
}

export function mapSubjectRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...row,
    linked_class_ids: Array.isArray(row.linked_class_ids) ? row.linked_class_ids : [],
  }
}

export function mapTeacherAssignmentRow(row: Record<string, unknown>): Record<string, unknown> {
  const staff = row.staff && typeof row.staff === 'object' ? (row.staff as Record<string, unknown>) : {}
  const classRecord = row.class && typeof row.class === 'object' ? (row.class as Record<string, unknown>) : {}
  const section = row.section && typeof row.section === 'object' ? (row.section as Record<string, unknown>) : {}
  const subject = row.subject && typeof row.subject === 'object' ? (row.subject as Record<string, unknown>) : {}

  return {
    ...row,
    staff_name: staff.full_name || staff.staff_code || null,
    class_name: classRecord.name || classRecord.class_code || null,
    section_name: section.name || section.section_code || null,
    subject_name: subject.name || subject.subject_code || null,
  }
}

export function buildAdministrationContextItems(overview: Angelcare360AdministrationOverview) {
  return [
    { label: 'Établissements', value: String(overview.schoolCount) },
    { label: 'Années scolaires', value: String(overview.academicYearCount) },
    { label: 'Classes', value: String(overview.classCount) },
    { label: 'Sections', value: String(overview.sectionCount) },
    { label: 'Matières', value: String(overview.subjectCount) },
    { label: 'Rôles actifs', value: String(overview.activeRoleCount) },
  ]
}
