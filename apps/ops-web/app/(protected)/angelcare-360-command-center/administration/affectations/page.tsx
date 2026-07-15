import { redirect } from 'next/navigation'
import Angelcare360AdministrationEntityScreen from '@/components/angelcare360/administration/Angelcare360AdministrationEntityScreen'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AdministrationContext, listAngelcare360Classes, listAngelcare360Sections, listAngelcare360Staff, listAngelcare360Subjects, listAngelcare360TeacherAssignments } from '@/lib/angelcare360/server'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'
import { mapClassRow, mapSectionRow, mapTeacherAssignmentRow, mapSubjectRow } from '../_mappers'

export const dynamic = 'force-dynamic'

export default async function Angelcare360AffectationsPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) redirect('/angelcare-360-command-center/administration')

  const academicYearId = state.overview.currentAcademicYear?.id || null
  const [assignmentsRaw, classesRaw, sectionsRaw, staffRaw, subjectsRaw] = await Promise.all([
    listAngelcare360TeacherAssignments(state.context.school.id, academicYearId),
    listAngelcare360Classes(state.context.school.id, academicYearId),
    listAngelcare360Sections(state.context.school.id, academicYearId),
    listAngelcare360Staff(state.context.school.id),
    listAngelcare360Subjects(state.context.school.id),
  ])

  const assignments = assignmentsRaw.map(mapTeacherAssignmentRow)
  const classOptions = classesRaw.map(mapClassRow).map((item) => ({ label: `${String(item.name || item.class_code)} · ${String(item.class_code || '')}`.trim(), value: String(item.id) }))
  const sectionOptions = sectionsRaw.map(mapSectionRow).map((item) => ({ label: `${String(item.name || item.section_code)} · ${String(item.section_code || '')}`.trim(), value: String(item.id) }))
  const staffOptions = staffRaw.map((item) => ({ label: `${String(item.full_name || '')}${item.staff_code ? ` · ${item.staff_code}` : ''}`, value: String(item.id) }))
  const subjectOptions = subjectsRaw.map(mapSubjectRow).map((item) => ({ label: `${String(item.name || item.subject_code)} · ${String(item.subject_code || '')}`.trim(), value: String(item.id) }))
  const canCreate = state.context.permissions.has('enseignants.assign') || state.context.access.accessLevel === 'super_admin'
  const canUpdate = state.context.permissions.has('enseignants.assign') || state.context.access.accessLevel === 'super_admin'

  const config: Angelcare360AdminEntityConfig = {
    routeKey: 'affectations',
    resource: 'affectations',
    title: 'Affectations enseignants',
    subtitle: 'Affectation des enseignants aux classes, sections et matières.',
    headerBadge: 'Pédagogie',
    listPermission: 'enseignants.view',
    createPermission: 'enseignants.assign',
    updatePermission: 'enseignants.assign',
    searchPlaceholder: 'Rechercher une affectation',
    emptyTitle: 'Aucune affectation',
    emptyDescription: 'Affectez les enseignants pour préparer les classes et les services pédagogiques.',
    createLabel: 'Créer une affectation',
    editLabel: 'Modifier l’affectation',
    searchableKeys: ['assignment_role', 'status', 'staff_name', 'class_name', 'section_name', 'subject_name'],
    statusField: 'status',
    statusValues: ['active', 'inactive', 'archived'],
    fields: [
      { name: 'school_id', label: 'École', kind: 'text', readOnly: true },
      { name: 'academic_year_id', label: 'Année scolaire', kind: 'text', readOnly: true },
      { name: 'staff_id', label: 'Enseignant', kind: 'select', required: true, options: staffOptions },
      { name: 'class_id', label: 'Classe', kind: 'select', options: classOptions },
      { name: 'section_id', label: 'Section', kind: 'select', options: sectionOptions },
      { name: 'subject_id', label: 'Matière', kind: 'select', options: subjectOptions },
      { name: 'assignment_role', label: "Rôle d’affectation", kind: 'text', required: true },
      { name: 'weekly_hours', label: 'Heures hebdomadaires', kind: 'number', min: 0, required: true },
      { name: 'assigned_from', label: 'Date de début', kind: 'date' },
      { name: 'assigned_to', label: 'Date de fin', kind: 'date' },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Archivée', value: 'archived' },
      ] },
    ],
    columns: [
      { key: 'staff_name', label: 'Enseignant' },
      { key: 'class_name', label: 'Classe' },
      { key: 'section_name', label: 'Section' },
      { key: 'subject_name', label: 'Matière' },
      { key: 'assignment_role', label: 'Rôle' },
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    filters: [
      { name: 'status', label: 'Statut', options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Archivée', value: 'archived' },
      ] },
      { name: 'class_id', label: 'Classe', options: classOptions },
      { name: 'section_id', label: 'Section', options: sectionOptions },
      { name: 'subject_id', label: 'Matière', options: subjectOptions },
    ],
    rowActions: [
      { key: 'edit', label: 'Modifier', kind: 'secondary' },
      { key: 'status', label: 'Désactiver', kind: 'danger', operation: 'update', value: 'inactive', disabledReason: 'La désactivation conserve l’historique des affectations.' },
    ],
  }

  return (
    <Angelcare360AdministrationEntityScreen
      config={{
        ...config,
        fixedValues: {
          school_id: state.context.school.id,
          academic_year_id: academicYearId || null,
        },
      }}
      rows={assignments}
      overview={state.overview}
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: state.overview.currentSchool?.name || state.context.school.name },
            { label: 'Année active', value: state.overview.currentAcademicYear?.label || 'Non définie' },
            { label: 'Affectations', value: String(assignments.length) },
          ]}
        />
      )}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason={state.overview.currentAcademicYear ? undefined : 'Une année scolaire active est requise pour créer une affectation.'}
      updateDisabledReason="Vous n’avez pas la permission de modifier une affectation."
    />
  )
}
