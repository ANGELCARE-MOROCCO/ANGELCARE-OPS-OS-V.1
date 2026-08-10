import { redirect } from 'next/navigation'
import Angelcare360AdministrationEntityScreen from '@/components/angelcare360/administration/Angelcare360AdministrationEntityScreen'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AdministrationContext, listAngelcare360Classes } from '@/lib/angelcare360/server'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'
import { mapClassRow } from '../_mappers'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClassesPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) redirect('/angelcare-360-command-center/administration')

  const classes = (await listAngelcare360Classes(state.context.school.id, state.overview.currentAcademicYear?.id || null)).map(mapClassRow)
  const levelOptions = Array.from(new Set(classes.map((item) => String(item.level || '').trim()).filter(Boolean))).map((value) => ({ label: value, value }))
  const canCreate = state.context.permissions.has('classes.create') || state.context.access.accessLevel === 'super_admin'
  const canUpdate = state.context.permissions.has('classes.update') || state.context.access.accessLevel === 'super_admin'

  const config: Angelcare360AdminEntityConfig = {
    routeKey: 'classes',
    resource: 'classes',
    title: 'Classes',
    subtitle: 'Structuration des classes, niveaux et capacités de l’établissement.',
    headerBadge: 'Structure',
    listPermission: 'classes.view',
    createPermission: 'classes.create',
    updatePermission: 'classes.update',
    searchPlaceholder: 'Rechercher une classe',
    emptyTitle: 'Aucune classe',
    emptyDescription: 'Créez les classes pour préparer les sections, les matières et les affectations.',
    createLabel: 'Créer une classe',
    editLabel: 'Modifier la classe',
    searchableKeys: ['class_code', 'name', 'level', 'status'],
    statusField: 'status',
    statusValues: ['active', 'inactive', 'archived'],
    fields: [
      { name: 'school_id', label: 'École', kind: 'text', readOnly: true },
      { name: 'academic_year_id', label: 'Année scolaire', kind: 'text', readOnly: true },
      { name: 'class_code', label: 'Code classe', kind: 'text', required: true },
      { name: 'name', label: 'Nom', kind: 'text', required: true },
      { name: 'level', label: 'Niveau', kind: 'select', required: true, options: levelOptions.length > 0 ? levelOptions : [
        { label: 'Préscolaire', value: 'prescolaire' },
        { label: 'Primaire', value: 'primaire' },
        { label: 'Collège', value: 'college' },
        { label: 'Lycée', value: 'lycee' },
      ] },
      { name: 'capacity', label: 'Capacité', kind: 'number', min: 0, required: true },
      { name: 'order_index', label: 'Ordre', kind: 'number', min: 1, required: true },
      { name: 'homeroom_staff_id', label: 'Professeur principal', kind: 'text', helpText: 'Référence du personnel rattaché à la classe.' },
      { name: 'description', label: 'Description', kind: 'textarea' },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
    ],
    columns: [
      { key: 'class_code', label: 'Code' },
      { key: 'name', label: 'Nom' },
      { key: 'level', label: 'Niveau' },
      { key: 'capacity', label: 'Capacité', kind: 'number' },
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    filters: [
      { name: 'status', label: 'Statut', options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
      { name: 'level', label: 'Niveau', options: levelOptions },
    ],
    rowActions: [
      { key: 'edit', label: 'Modifier', kind: 'secondary' },
      { key: 'status', label: 'Archiver', kind: 'danger', operation: 'status', value: 'archived', disabledReason: 'L’archivage conserve l’historique et ne supprime pas la classe.' },
    ],
  }

  return (
    <Angelcare360AdministrationEntityScreen
      config={{
        ...config,
        fixedValues: {
          school_id: state.context.school.id,
          academic_year_id: state.overview.currentAcademicYear?.id || null,
        },
      }}
      rows={classes}
      overview={state.overview}
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: state.overview.currentSchool?.name || state.context.school.name },
            { label: 'Année active', value: state.overview.currentAcademicYear?.label || 'Non définie' },
            { label: 'Classes', value: String(classes.length) },
          ]}
        />
      )}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason={state.overview.currentAcademicYear ? undefined : 'Une année scolaire active est requise pour créer une classe.'}
      updateDisabledReason="Vous n’avez pas la permission de modifier une classe."
    />
  )
}
