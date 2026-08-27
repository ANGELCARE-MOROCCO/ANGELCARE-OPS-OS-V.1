import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360AcademicYearsOverview from '@/components/angelcare360/academic-years/Angelcare360AcademicYearsOverview'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { getAngelcare360AcademicYearsOverviewData } from '@/lib/angelcare360/server/academic-years-overview'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'

export const dynamic = 'force-dynamic'

const YEAR_CONFIG: Angelcare360AdminEntityConfig = {
  routeKey: 'annees-scolaires',
  resource: 'annees-scolaires',
  title: 'Années scolaires',
  subtitle: 'Ouverture, activation et clôture des cycles académiques de l’établissement.',
  headerBadge: 'Cycle académique',
  listPermission: 'annees_scolaires.view',
  createPermission: 'annees_scolaires.create',
  updatePermission: 'annees_scolaires.update',
  searchPlaceholder: 'Rechercher une année scolaire',
  emptyTitle: 'Aucune année scolaire',
  emptyDescription: 'Créez une année pour structurer les périodes et le calendrier institutionnel.',
  createLabel: 'Créer une année',
  editLabel: 'Modifier l’année',
  searchableKeys: ['year_code', 'label', 'status'],
  statusField: 'status',
  statusValues: ['planned', 'active', 'closed', 'archived'],
  fields: [
    { name: 'school_id', label: 'Établissement', kind: 'text', required: true, readOnly: true },
    { name: 'year_code', label: 'Code année', kind: 'text', required: true, placeholder: '2026-2027' },
    { name: 'label', label: 'Libellé', kind: 'text', required: true, placeholder: 'Année scolaire 2026-2027' },
    { name: 'starts_on', label: 'Date de début', kind: 'date', required: true },
    { name: 'ends_on', label: 'Date de fin', kind: 'date', required: true },
    { name: 'is_current', label: 'Définir comme année active', kind: 'switch' },
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
    { key: 'status', label: 'Statut', kind: 'status' },
  ],
}

const TERM_CONFIG: Angelcare360AdminEntityConfig = {
  routeKey: 'periodes',
  resource: 'periodes',
  title: 'Périodes académiques',
  subtitle: 'Trimestres, semestres, pré-rentrée et périodes personnalisées.',
  headerBadge: 'Période',
  listPermission: 'annees_scolaires.view',
  createPermission: 'annees_scolaires.update',
  updatePermission: 'annees_scolaires.update',
  searchPlaceholder: 'Rechercher une période',
  emptyTitle: 'Aucune période',
  emptyDescription: 'Ajoutez les périodes de l’année scolaire active.',
  createLabel: 'Ajouter une période',
  editLabel: 'Modifier la période',
  searchableKeys: ['term_code', 'label', 'term_type', 'status'],
  statusField: 'status',
  statusValues: ['planned', 'active', 'closed', 'archived'],
  fields: [
    { name: 'school_id', label: 'Établissement', kind: 'text', required: true, readOnly: true },
    { name: 'academic_year_id', label: 'Année scolaire', kind: 'text', required: true, readOnly: true },
    { name: 'term_code', label: 'Code période', kind: 'text', required: true, placeholder: 'T1-2026' },
    { name: 'label', label: 'Libellé', kind: 'text', required: true, placeholder: '1er trimestre' },
    { name: 'term_type', label: 'Type', kind: 'select', required: true, options: [
      { label: 'Trimestre', value: 'trimestre' },
      { label: 'Semestre', value: 'semestre' },
      { label: 'Pré-rentrée', value: 'pre_rentree' },
      { label: 'Clôture & bilan', value: 'cloture' },
      { label: 'Période personnalisée', value: 'custom' },
    ] },
    { name: 'starts_on', label: 'Date de début', kind: 'date', required: true },
    { name: 'ends_on', label: 'Date de fin', kind: 'date', required: true },
    { name: 'order_index', label: 'Ordre dans la timeline', kind: 'number', required: true, min: 1 },
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
    { key: 'starts_on', label: 'Début', kind: 'date' },
    { key: 'ends_on', label: 'Fin', kind: 'date' },
    { key: 'status', label: 'Statut', kind: 'status' },
  ],
}

export default async function Angelcare360AcademicYearsCockpitPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  const canView = context.access.accessLevel === 'super_admin' || context.permissions.has('annees_scolaires.view')
  if (!canView) {
    return (
      <Angelcare360ErrorState
        title="Accès au calendrier académique verrouillé"
        description="Votre rôle ne permet pas encore d’accéder aux années scolaires et périodes."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const data = await getAngelcare360AcademicYearsOverviewData({
    schoolId: context.school.id,
    preferredAcademicYearId: context.academicYear?.id || null,
  })

  const activeYearId = data.activeYear?.id || context.academicYear?.id || ''
  const canCreateYear = context.access.accessLevel === 'super_admin' || context.permissions.has('annees_scolaires.create')
  const canUpdateYear = context.access.accessLevel === 'super_admin' || context.permissions.has('annees_scolaires.update')
  const canManageTerms = canUpdateYear
  const canCreateCalendar = context.access.accessLevel === 'super_admin' || context.permissions.has('emploi_du_temps.create')
  const canUpdateCalendar = context.access.accessLevel === 'super_admin' || context.permissions.has('emploi_du_temps.update')

  return (
    <Angelcare360AcademicYearsOverview
      data={data}
      schoolId={context.school.id}
      schoolName={context.school.name}
      yearConfig={{ ...YEAR_CONFIG, fixedValues: { school_id: context.school.id, status: 'planned', is_current: false } }}
      termConfig={{ ...TERM_CONFIG, fixedValues: { school_id: context.school.id, academic_year_id: activeYearId || null, status: 'planned', order_index: data.terms.length + 1, term_type: 'trimestre' } }}
      canCreateYear={canCreateYear}
      canUpdateYear={canUpdateYear}
      canManageTerms={canManageTerms}
      canCreateCalendar={canCreateCalendar}
      canUpdateCalendar={canUpdateCalendar}
    />
  )
}
