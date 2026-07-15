import { redirect } from 'next/navigation'
import Angelcare360AdministrationEntityScreen from '@/components/angelcare360/administration/Angelcare360AdministrationEntityScreen'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AdministrationContext, listAngelcare360Terms } from '@/lib/angelcare360/server'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'
import { mapTermRow } from '../_mappers'

export const dynamic = 'force-dynamic'

const TERM_CONFIG: Angelcare360AdminEntityConfig = {
  routeKey: 'periodes',
  resource: 'periodes',
  title: 'Périodes',
  subtitle: 'Gestion des trimestres, semestres et périodes personnalisées.',
  headerBadge: 'Périodes',
  listPermission: 'annees_scolaires.view',
  createPermission: 'annees_scolaires.update',
  updatePermission: 'annees_scolaires.update',
  searchPlaceholder: 'Rechercher une période',
  emptyTitle: 'Aucune période',
  emptyDescription: 'Créez les périodes de l’année pour structurer les évaluations et le calendrier.',
  createLabel: 'Créer une période',
  editLabel: 'Modifier la période',
  searchableKeys: ['term_code', 'label', 'term_type', 'status'],
  statusField: 'status',
  statusValues: ['planned', 'active', 'closed', 'archived'],
  fields: [
    { name: 'school_id', label: 'École', kind: 'text', readOnly: true },
    { name: 'academic_year_id', label: 'Année scolaire', kind: 'text', readOnly: true },
    { name: 'term_code', label: 'Code période', kind: 'text', required: true },
    { name: 'label', label: 'Libellé', kind: 'text', required: true },
    { name: 'term_type', label: 'Type', kind: 'select', options: [
      { label: 'Trimestre', value: 'trimestre' },
      { label: 'Semestre', value: 'semestre' },
      { label: 'Période personnalisée', value: 'custom' },
    ] },
    { name: 'starts_on', label: 'Date de début', kind: 'date', required: true },
    { name: 'ends_on', label: 'Date de fin', kind: 'date', required: true },
    { name: 'order_index', label: 'Ordre', kind: 'number', required: true, min: 1 },
    { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
      { label: 'Planifiée', value: 'planned' },
      { label: 'Active', value: 'active' },
      { label: 'Clôturée', value: 'closed' },
      { label: 'Archivée', value: 'archived' },
    ] },
  ],
  columns: [
    { key: 'term_code', label: 'Code' },
    { key: 'label', label: 'Libellé' },
    { key: 'term_type', label: 'Type' },
    { key: 'starts_on', label: 'Début', kind: 'date' },
    { key: 'ends_on', label: 'Fin', kind: 'date' },
    { key: 'order_index', label: 'Ordre', kind: 'number' },
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
  ],
}

export default async function Angelcare360PeriodesPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) redirect('/angelcare-360-command-center/administration')

  const terms = (await listAngelcare360Terms(state.context.school.id, state.overview.currentAcademicYear?.id || null)).map(mapTermRow)
  const canCreate = state.context.permissions.has('annees_scolaires.update') || state.context.access.accessLevel === 'super_admin'
  const canUpdate = state.context.permissions.has('annees_scolaires.update') || state.context.access.accessLevel === 'super_admin'
  const currentYear = state.overview.currentAcademicYear?.id || ''

  return (
    <Angelcare360AdministrationEntityScreen
      config={{
        ...TERM_CONFIG,
        fixedValues: {
          school_id: state.context.school.id,
          academic_year_id: currentYear || null,
        },
      }}
      rows={terms}
      overview={state.overview}
      contextRow={(
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: state.overview.currentSchool?.name || state.context.school.name },
            { label: 'Année active', value: state.overview.currentAcademicYear?.label || 'Non définie' },
            { label: 'Périodes', value: String(terms.length) },
          ]}
        />
      )}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason={currentYear ? undefined : 'Une année scolaire active est requise pour créer une période.'}
      updateDisabledReason="Vous n’avez pas la permission de modifier une période."
    />
  )
}
