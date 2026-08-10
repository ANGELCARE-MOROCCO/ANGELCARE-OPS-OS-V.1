import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360ClassesSectionsOverview from '@/components/angelcare360/classes/Angelcare360ClassesSectionsOverview'
import { getAngelcare360AdministrationContext } from '@/lib/angelcare360/server'
import { getAngelcare360ClassesSectionsOverviewData } from '@/lib/angelcare360/server/classes-sections-overview'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'

export const dynamic = 'force-dynamic'

export default async function Angelcare360ClassesSectionsPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) redirect('/angelcare-360-command-center')

  if (!state.context.permissions.has('classes.view') && state.context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès aux classes verrouillé"
        description="Votre rôle ne permet pas encore d’accéder à la structure pédagogique."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const schoolId = state.context.school.id
  const academicYearId = state.overview.currentAcademicYear?.id || null
  const overview = await getAngelcare360ClassesSectionsOverviewData({ schoolId, academicYearId })
  const canCreateClass = state.context.access.accessLevel === 'super_admin' || state.context.permissions.has('classes.create')
  const canUpdateClass = state.context.access.accessLevel === 'super_admin' || state.context.permissions.has('classes.update')
  const canCreateSection = canCreateClass
  const canAssignTeacher = state.context.access.accessLevel === 'super_admin' || state.context.permissions.has('enseignants.assign')

  const classConfig: Angelcare360AdminEntityConfig = {
    routeKey: 'classes',
    resource: 'classes',
    title: 'Classes',
    subtitle: 'Créer ou ajuster une classe, sa capacité et son titulaire.',
    headerBadge: 'Structure',
    listPermission: 'classes.view',
    createPermission: 'classes.create',
    updatePermission: 'classes.update',
    searchPlaceholder: 'Rechercher une classe',
    emptyTitle: 'Aucune classe',
    emptyDescription: 'Créez la première classe de l’année scolaire.',
    createLabel: 'Créer une classe',
    editLabel: 'Modifier la classe',
    searchableKeys: ['class_code', 'name', 'level', 'status'],
    fixedValues: { school_id: schoolId, academic_year_id: academicYearId },
    fields: [
      { name: 'school_id', label: 'École', kind: 'text', readOnly: true },
      { name: 'academic_year_id', label: 'Année scolaire', kind: 'text', readOnly: true },
      { name: 'class_code', label: 'Code classe', kind: 'text', required: true },
      { name: 'name', label: 'Nom de la classe', kind: 'text', required: true },
      { name: 'level', label: 'Niveau', kind: 'select', required: true, options: overview.options.levels },
      { name: 'capacity', label: 'Capacité', kind: 'number', min: 0, required: true },
      { name: 'order_index', label: 'Ordre pédagogique', kind: 'number', min: 1, required: true },
      { name: 'homeroom_staff_id', label: 'Professeur principal', kind: 'select', options: overview.options.staff },
      { name: 'description', label: 'Description', kind: 'textarea' },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Archivée', value: 'archived' },
      ] },
    ],
    columns: [],
  }

  const sectionConfig: Angelcare360AdminEntityConfig = {
    routeKey: 'sections', resource: 'sections', title: 'Sections', subtitle: 'Créer un groupe, sa salle, sa capacité et son responsable.', headerBadge: 'Structure', listPermission: 'classes.view', createPermission: 'classes.create', updatePermission: 'classes.update', searchPlaceholder: 'Rechercher une section', emptyTitle: 'Aucune section', emptyDescription: 'Créez les sections après les classes.', createLabel: 'Créer une section', editLabel: 'Modifier la section', searchableKeys: ['section_code', 'name', 'room', 'status'], fixedValues: { school_id: schoolId, academic_year_id: academicYearId }, fields: [
      { name: 'school_id', label: 'École', kind: 'text', readOnly: true },
      { name: 'academic_year_id', label: 'Année scolaire', kind: 'text', readOnly: true },
      { name: 'class_id', label: 'Classe', kind: 'select', required: true, options: overview.options.classes },
      { name: 'section_code', label: 'Code section', kind: 'text', required: true },
      { name: 'name', label: 'Nom', kind: 'text', required: true },
      { name: 'capacity', label: 'Capacité', kind: 'number', min: 0, required: true },
      { name: 'room', label: 'Salle', kind: 'text' },
      { name: 'main_teacher_id', label: 'Enseignant responsable', kind: 'select', options: overview.options.staff },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Archivée', value: 'archived' },
      ] },
    ], columns: [],
  }

  const assignmentConfig: Angelcare360AdminEntityConfig = {
    routeKey: 'affectations', resource: 'affectations', title: 'Affectations enseignants', subtitle: 'Relier un enseignant à une classe, une section et une matière.', headerBadge: 'Pédagogie', listPermission: 'enseignants.view', createPermission: 'enseignants.assign', updatePermission: 'enseignants.assign', searchPlaceholder: 'Rechercher une affectation', emptyTitle: 'Aucune affectation', emptyDescription: 'Affectez un enseignant à la structure.', createLabel: 'Créer une affectation', editLabel: 'Modifier l’affectation', searchableKeys: ['assignment_role', 'status'], fixedValues: { school_id: schoolId, academic_year_id: academicYearId }, fields: [
      { name: 'school_id', label: 'École', kind: 'text', readOnly: true },
      { name: 'academic_year_id', label: 'Année scolaire', kind: 'text', readOnly: true },
      { name: 'staff_id', label: 'Enseignant', kind: 'select', required: true, options: overview.options.staff },
      { name: 'class_id', label: 'Classe', kind: 'select', options: overview.options.classes },
      { name: 'section_id', label: 'Section', kind: 'select', options: overview.options.sections },
      { name: 'subject_id', label: 'Matière', kind: 'select', options: overview.options.subjects },
      { name: 'assignment_role', label: 'Rôle d’affectation', kind: 'text', required: true },
      { name: 'weekly_hours', label: 'Heures hebdomadaires', kind: 'number', min: 0, required: true },
      { name: 'assigned_from', label: 'Date de début', kind: 'date' },
      { name: 'assigned_to', label: 'Date de fin', kind: 'date' },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }, { label: 'Archivée', value: 'archived' },
      ] },
    ], columns: [],
  }

  return (
    <Angelcare360ClassesSectionsOverview
      overview={overview}
      schoolName={state.overview.currentSchool?.name || state.context.school.name}
      academicYearLabel={state.overview.currentAcademicYear?.label || 'Année scolaire à configurer'}
      classConfig={classConfig}
      sectionConfig={sectionConfig}
      assignmentConfig={assignmentConfig}
      canCreateClass={canCreateClass && Boolean(academicYearId)}
      canUpdateClass={canUpdateClass}
      canCreateSection={canCreateSection && Boolean(academicYearId)}
      canAssignTeacher={canAssignTeacher && Boolean(academicYearId)}
      createClassDisabledReason={academicYearId ? 'Vous ne disposez pas du droit de créer une classe.' : 'Une année scolaire active est requise.'}
      updateClassDisabledReason="Vous ne disposez pas du droit de modifier une classe."
      createSectionDisabledReason={academicYearId ? 'Vous ne disposez pas du droit de créer une section.' : 'Une année scolaire active est requise.'}
      assignTeacherDisabledReason={academicYearId ? 'Vous ne disposez pas du droit d’affecter un enseignant.' : 'Une année scolaire active est requise.'}
    />
  )
}
