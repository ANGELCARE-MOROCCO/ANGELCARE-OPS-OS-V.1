import { redirect } from 'next/navigation'
import Angelcare360ErrorState from '@/components/angelcare360/states/Angelcare360ErrorState'
import Angelcare360SubjectsProgramOverview from '@/components/angelcare360/academics/Angelcare360SubjectsProgramOverview'
import { getAngelcare360AccessContext } from '@/lib/angelcare360/server'
import { listAngelcare360Classes } from '@/lib/angelcare360/server/queries'
import { getAngelcare360SubjectsProgramOverview } from '@/lib/angelcare360/server/subjects-program-overview'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'

export const dynamic = 'force-dynamic'

export default async function Angelcare360SubjectsProgramPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center')

  if (!context.permissions.has('matieres.view') && context.access.accessLevel !== 'super_admin') {
    return (
      <Angelcare360ErrorState
        title="Accès aux matières verrouillé"
        description="Votre rôle ne permet pas encore d’accéder au catalogue et à la progression pédagogique."
        actionLabel="Retour au cockpit"
        actionHref="/angelcare-360-command-center"
      />
    )
  }

  const academicYearId = context.academicYear?.id || null
  const [overview, classes] = await Promise.all([
    getAngelcare360SubjectsProgramOverview({
      schoolId: context.school.id,
      academicYearId,
      academicYearStartsOn: context.academicYear?.starts_on || null,
      academicYearEndsOn: context.academicYear?.ends_on || null,
    }),
    listAngelcare360Classes(context.school.id, academicYearId),
  ])

  const classOptions = classes.map((item) => ({
    label: `${String(item.name || item.class_code || 'Classe')} · ${String(item.level || '')}`.trim(),
    value: String(item.id),
  }))

  const subjectConfig: Angelcare360AdminEntityConfig = {
    routeKey: 'matieres',
    resource: 'matieres',
    title: 'Matières',
    subtitle: 'Créer et maintenir le référentiel pédagogique relié aux classes réelles.',
    headerBadge: 'Académique',
    listPermission: 'matieres.view',
    createPermission: 'matieres.create',
    updatePermission: 'matieres.update',
    searchPlaceholder: 'Rechercher une matière',
    emptyTitle: 'Aucune matière',
    emptyDescription: 'Créez le catalogue pédagogique pour alimenter les séquences et évaluations.',
    createLabel: 'Créer une matière',
    editLabel: 'Modifier la matière',
    searchableKeys: ['subject_code', 'name', 'short_name', 'department', 'status'],
    statusField: 'status',
    statusValues: ['active', 'inactive', 'archived'],
    fixedValues: { school_id: context.school.id },
    fields: [
      { name: 'school_id', label: 'Établissement', kind: 'text', readOnly: true },
      { name: 'subject_code', label: 'Code matière', kind: 'text', required: true, placeholder: 'MAT-001' },
      { name: 'name', label: 'Nom de la matière', kind: 'text', required: true },
      { name: 'short_name', label: 'Nom court', kind: 'text' },
      { name: 'department', label: 'Domaine pédagogique', kind: 'text', placeholder: 'Sciences, langues, arts…' },
      { name: 'credit_hours', label: 'Heures de référence', kind: 'number', min: 0, step: 0.5 },
      { name: 'linked_class_ids', label: 'Classes concernées', kind: 'multi-select', options: classOptions, helpText: 'Ces rattachements alimentent le catalogue et les affectations.' },
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
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    filters: [{ name: 'status', label: 'Statut', options: [
      { label: 'Actif', value: 'active' },
      { label: 'Inactif', value: 'inactive' },
      { label: 'Archivé', value: 'archived' },
    ] }],
  }

  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('matieres.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('matieres.update')

  return (
    <Angelcare360SubjectsProgramOverview
      overview={overview}
      subjectConfig={subjectConfig}
      schoolName={context.school.name}
      academicYearLabel={context.academicYear?.label || 'Année scolaire à configurer'}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="La création de matières est réservée aux rôles autorisés."
      updateDisabledReason="La modification de matières est réservée aux rôles autorisés."
    />
  )
}
