import { redirect } from 'next/navigation'
import Angelcare360AdministrationEntityScreen from '@/components/angelcare360/administration/Angelcare360AdministrationEntityScreen'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AdministrationContext, listAngelcare360Classes, listAngelcare360Sections, listAngelcare360Staff } from '@/lib/angelcare360/server'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'
import { mapClassRow, mapSectionRow } from '../_mappers'

export const dynamic = 'force-dynamic'

export default async function Angelcare360SectionsPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) redirect('/angelcare-360-command-center/administration')

  const academicYearId = state.overview.currentAcademicYear?.id || null
  const [sectionsRaw, classesRaw, staffRaw] = await Promise.all([
    listAngelcare360Sections(state.context.school.id, academicYearId),
    listAngelcare360Classes(state.context.school.id, academicYearId),
    listAngelcare360Staff(state.context.school.id),
  ])

  const sections = sectionsRaw.map(mapSectionRow)
  const classes = classesRaw.map(mapClassRow)
  const classOptions = classes.map((item) => ({ label: `${String(item.name || item.class_code)} · ${String(item.class_code || '')}`.trim(), value: String(item.id) }))
  const staffOptions = staffRaw.map((item) => ({ label: `${String(item.full_name || '')}${item.staff_code ? ` · ${item.staff_code}` : ''}`, value: String(item.id) }))
  const canCreate = state.context.permissions.has('classes.create') || state.context.access.accessLevel === 'super_admin'
  const canUpdate = state.context.permissions.has('classes.update') || state.context.access.accessLevel === 'super_admin'

  const config: Angelcare360AdminEntityConfig = {
    routeKey: 'sections',
    resource: 'sections',
    title: 'Sections',
    subtitle: 'Organisation fine des classes avec capacités, salles et responsables.',
    headerBadge: 'Structure',
    listPermission: 'classes.view',
    createPermission: 'classes.create',
    updatePermission: 'classes.update',
    searchPlaceholder: 'Rechercher une section',
    emptyTitle: 'Aucune section',
    emptyDescription: 'Créez les sections pour répartir les élèves par groupe et par enseignant.',
    createLabel: 'Créer une section',
    editLabel: 'Modifier la section',
    searchableKeys: ['section_code', 'name', 'room', 'status'],
    statusField: 'status',
    statusValues: ['active', 'inactive', 'archived'],
    fields: [
      { name: 'school_id', label: 'École', kind: 'text', readOnly: true },
      { name: 'academic_year_id', label: 'Année scolaire', kind: 'text', readOnly: true },
      { name: 'class_id', label: 'Classe', kind: 'select', required: true, options: classOptions },
      { name: 'section_code', label: 'Code section', kind: 'text', required: true },
      { name: 'name', label: 'Nom', kind: 'text', required: true },
      { name: 'capacity', label: 'Capacité', kind: 'number', min: 0, required: true },
      { name: 'room', label: 'Salle', kind: 'text' },
      { name: 'main_teacher_id', label: 'Enseignant responsable', kind: 'select', options: staffOptions },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
    ],
    columns: [
      { key: 'section_code', label: 'Code' },
      { key: 'name', label: 'Nom' },
      { key: 'class_id', label: 'Classe' },
      { key: 'capacity', label: 'Capacité', kind: 'number' },
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    filters: [
      { name: 'status', label: 'Statut', options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
      { name: 'class_id', label: 'Classe', options: classOptions },
    ],
    rowActions: [
      { key: 'edit', label: 'Modifier', kind: 'secondary' },
      { key: 'status', label: 'Archiver', kind: 'danger', operation: 'status', value: 'archived', disabledReason: 'L’archivage conserve l’historique de la section.' },
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
      rows={sections}
      overview={state.overview}
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: state.overview.currentSchool?.name || state.context.school.name },
            { label: 'Année active', value: state.overview.currentAcademicYear?.label || 'Non définie' },
            { label: 'Sections', value: String(sections.length) },
          ]}
        />
      )}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason={state.overview.currentAcademicYear ? undefined : 'Une année scolaire active est requise pour créer une section.'}
      updateDisabledReason="Vous n’avez pas la permission de modifier une section."
    />
  )
}
