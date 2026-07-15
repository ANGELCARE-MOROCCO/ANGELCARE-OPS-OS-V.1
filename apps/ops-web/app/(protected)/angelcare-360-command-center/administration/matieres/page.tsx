import { redirect } from 'next/navigation'
import Angelcare360AdministrationEntityScreen from '@/components/angelcare360/administration/Angelcare360AdministrationEntityScreen'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AdministrationContext, listAngelcare360Classes, listAngelcare360Subjects } from '@/lib/angelcare360/server'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'
import { mapClassRow, mapSubjectRow } from '../_mappers'

export const dynamic = 'force-dynamic'

export default async function Angelcare360MatieresPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) redirect('/angelcare-360-command-center/administration')

  const [subjectsRaw, classesRaw] = await Promise.all([
    listAngelcare360Subjects(state.context.school.id),
    listAngelcare360Classes(state.context.school.id, state.overview.currentAcademicYear?.id || null),
  ])

  const subjects = subjectsRaw.map(mapSubjectRow)
  const classOptions = classesRaw.map(mapClassRow).map((item) => ({ label: `${String(item.name || item.class_code)} · ${String(item.class_code || '')}`.trim(), value: String(item.id) }))
  const canCreate = state.context.permissions.has('matieres.create') || state.context.access.accessLevel === 'super_admin'
  const canUpdate = state.context.permissions.has('matieres.update') || state.context.access.accessLevel === 'super_admin'

  const config: Angelcare360AdminEntityConfig = {
    routeKey: 'matieres',
    resource: 'matieres',
    title: 'Matières',
    subtitle: 'Catalogue des disciplines, coefficients et rattachements aux classes.',
    headerBadge: 'Académique',
    listPermission: 'matieres.view',
    createPermission: 'matieres.create',
    updatePermission: 'matieres.update',
    searchPlaceholder: 'Rechercher une matière',
    emptyTitle: 'Aucune matière',
    emptyDescription: 'Créez le catalogue pédagogique pour alimenter les affectations et les évaluations.',
    createLabel: 'Créer une matière',
    editLabel: 'Modifier la matière',
    searchableKeys: ['subject_code', 'name', 'short_name', 'department', 'status'],
    statusField: 'status',
    statusValues: ['active', 'inactive', 'archived'],
    fields: [
      { name: 'school_id', label: 'École', kind: 'text', readOnly: true },
      { name: 'subject_code', label: 'Code matière', kind: 'text', required: true },
      { name: 'name', label: 'Nom', kind: 'text', required: true },
      { name: 'short_name', label: 'Nom court', kind: 'text' },
      { name: 'department', label: 'Domaine', kind: 'text' },
      { name: 'credit_hours', label: 'Heures de crédit', kind: 'number', min: 0 },
      { name: 'linked_class_ids', label: 'Classes liées', kind: 'multi-select', options: classOptions, helpText: 'Associez la matière aux classes concernées.' },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
    ],
    columns: [
      { key: 'subject_code', label: 'Code' },
      { key: 'name', label: 'Nom' },
      { key: 'department', label: 'Domaine' },
      { key: 'linked_class_ids', label: 'Classes', kind: 'chips' },
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    filters: [
      { name: 'status', label: 'Statut', options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
    ],
    rowActions: [
      { key: 'edit', label: 'Modifier', kind: 'secondary' },
    ],
  }

  return (
    <Angelcare360AdministrationEntityScreen
      config={{
        ...config,
        fixedValues: {
          school_id: state.context.school.id,
        },
      }}
      rows={subjects}
      overview={state.overview}
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: state.overview.currentSchool?.name || state.context.school.name },
            { label: 'Année active', value: state.overview.currentAcademicYear?.label || 'Non définie' },
            { label: 'Matières', value: String(subjects.length) },
          ]}
        />
      )}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="Vous n’avez pas la permission de créer une matière."
      updateDisabledReason="Vous n’avez pas la permission de modifier une matière."
    />
  )
}

