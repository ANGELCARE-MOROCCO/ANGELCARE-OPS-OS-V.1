import { redirect } from 'next/navigation'
import Angelcare360AdministrationEntityScreen from '@/components/angelcare360/administration/Angelcare360AdministrationEntityScreen'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AdministrationContext, listAngelcare360AcademicYears } from '@/lib/angelcare360/server'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'
import { mapAcademicYearRow } from '../_mappers'

export const dynamic = 'force-dynamic'

const YEAR_CONFIG: Angelcare360AdminEntityConfig = {
  routeKey: 'annees-scolaires',
  resource: 'annees-scolaires',
  title: 'Années scolaires',
  subtitle: 'Ouverture, suivi et activation des cycles académiques de l’établissement.',
  headerBadge: 'Cycle',
  listPermission: 'annees_scolaires.view',
  createPermission: 'annees_scolaires.create',
  updatePermission: 'annees_scolaires.update',
  searchPlaceholder: 'Rechercher une année scolaire',
  emptyTitle: 'Aucune année scolaire',
  emptyDescription: 'Créez une année scolaire pour structurer les périodes et les classes.',
  createLabel: 'Créer une année',
  editLabel: 'Modifier l’année',
  searchableKeys: ['year_code', 'label', 'status'],
  statusField: 'status',
  statusValues: ['planned', 'active', 'closed', 'archived'],
  fields: [
    { name: 'school_id', label: 'École', kind: 'text', required: true, readOnly: true, helpText: 'L’année est rattachée à l’établissement actif.' },
    { name: 'year_code', label: 'Code année', kind: 'text', required: true },
    { name: 'label', label: 'Libellé', kind: 'text', required: true },
    { name: 'starts_on', label: 'Date de début', kind: 'date', required: true },
    { name: 'ends_on', label: 'Date de fin', kind: 'date', required: true },
    { name: 'is_current', label: 'Année active', kind: 'switch' },
    { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
      { label: 'Planifiée', value: 'planned' },
      { label: 'Active', value: 'active' },
      { label: 'Clôturée', value: 'closed' },
      { label: 'Archivée', value: 'archived' },
    ] },
  ],
  columns: [
    { key: 'year_code', label: 'Code' },
    { key: 'label', label: 'Libellé' },
    { key: 'starts_on', label: 'Début', kind: 'date' },
    { key: 'ends_on', label: 'Fin', kind: 'date' },
    { key: 'is_current', label: 'Active', kind: 'boolean' },
    { key: 'status', label: 'Statut', kind: 'status' },
  ],
  filters: [
    { name: 'status', label: 'Statut', options: [
      { label: 'Planifiée', value: 'planned' },
      { label: 'Active', value: 'active' },
      { label: 'Clôturée', value: 'closed' },
      { label: 'Archivée', value: 'archived' },
    ] },
  ],
  rowActions: [
    { key: 'edit', label: 'Modifier', kind: 'secondary' },
    { key: 'activate', label: 'Définir active', kind: 'primary', operation: 'activate', disabledReason: 'Cette action active une seule année à la fois.' },
  ],
}

export default async function Angelcare360AnneesScolairesPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) redirect('/angelcare-360-command-center/administration')

  const years = (await listAngelcare360AcademicYears(state.context.school.id)).map(mapAcademicYearRow)
  const canCreate = state.context.permissions.has('annees_scolaires.create') || state.context.access.accessLevel === 'super_admin'
  const canUpdate = state.context.permissions.has('annees_scolaires.update') || state.context.access.accessLevel === 'super_admin'

  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement actif', value: state.overview.currentSchool?.name || state.context.school.name },
        { label: 'Année active', value: state.overview.currentAcademicYear?.label || 'Non définie' },
        { label: 'Années', value: String(years.length) },
      ]}
    />
  )

  return (
    <Angelcare360AdministrationEntityScreen
      config={{ ...YEAR_CONFIG, fixedValues: { school_id: state.context.school.id } }}
      rows={years}
      overview={state.overview}
      contextRow={contextRow}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="Vous n’avez pas la permission de créer une année scolaire."
      updateDisabledReason="Vous n’avez pas la permission de modifier une année scolaire."
    />
  )
}

