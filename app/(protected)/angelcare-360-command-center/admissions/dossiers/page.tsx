import { redirect } from 'next/navigation'
import Angelcare360AdmissionsListWorkspace from '@/components/angelcare360/admissions/Angelcare360AdmissionsListWorkspace'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import {
  ANGELCARE360_ADMISSION_APPLICATION_STATUS_OPTIONS,
} from '@/data/angelcare360/admissions-navigation'
import {
  createClassOptions,
  createSectionOptions,
} from '@/data/angelcare360/people-pages'
import {
  getAngelcare360AccessContext,
  listAngelcare360AcademicYears,
  listAngelcare360AdmissionApplications,
  listAngelcare360AdmissionLeads,
  listAngelcare360Classes,
  listAngelcare360Parents,
  listAngelcare360Sections,
  listAngelcare360Staff,
  listAngelcare360Students,
} from '@/lib/angelcare360/server'
import type { Angelcare360AdmissionsEntityConfig } from '@/types/angelcare360/admissions'

export const dynamic = 'force-dynamic'

const APPLICATION_CONFIG: Angelcare360AdmissionsEntityConfig = {
  routeKey: 'dossiers',
  resource: 'application',
  title: 'Dossiers d’admission',
  subtitle: 'Applications, décision, pièces et conversion vers le socle personnes.',
  headerBadge: 'Dossier',
  listPermission: 'admissions.view',
  createPermission: 'admissions.create',
  updatePermission: 'admissions.update',
  approvePermission: 'admissions.approve',
  searchPlaceholder: 'Rechercher un dossier',
  emptyTitle: 'Aucun dossier',
  emptyDescription: 'Créez un dossier pour suivre une admission jusqu’à la conversion.',
  createLabel: 'Créer un dossier',
  editLabel: 'Modifier le dossier',
  searchableKeys: ['application_code', 'lead_student_full_name', 'lead_parent_name', 'child_first_name', 'child_last_name', 'phone', 'email', 'status', 'application_stage'],
  detailHrefKey: 'detail_href',
  statusField: 'status',
  statusValues: ['open', 'in_review', 'approved', 'rejected', 'waitlisted', 'converted', 'archived'],
  fields: [
    { name: 'schoolId', label: 'Établissement', kind: 'text', required: true, readOnly: true },
    { name: 'applicationCode', label: 'Code dossier', kind: 'text', required: true },
    { name: 'leadId', label: 'Demande source', kind: 'text' },
    { name: 'parentId', label: 'Parent lié', kind: 'text' },
    { name: 'studentId', label: 'Élève lié', kind: 'text' },
    { name: 'academicYearId', label: 'Année scolaire', kind: 'text' },
    { name: 'classId', label: 'Classe demandée', kind: 'text' },
    { name: 'sectionId', label: 'Section demandée', kind: 'text' },
    { name: 'source', label: 'Source', kind: 'text' },
    { name: 'childFirstName', label: 'Prénom enfant', kind: 'text', required: true },
    { name: 'childLastName', label: 'Nom enfant', kind: 'text', required: true },
    { name: 'childDateOfBirth', label: 'Date de naissance', kind: 'date' },
    { name: 'childGender', label: 'Sexe', kind: 'select', options: [
      { label: 'Fille', value: 'female' },
      { label: 'Garçon', value: 'male' },
      { label: 'Non précisé', value: 'unknown' },
    ] },
    { name: 'childNationality', label: 'Nationalité', kind: 'text' },
    { name: 'parentFirstName', label: 'Prénom parent', kind: 'text', required: true },
    { name: 'parentLastName', label: 'Nom parent', kind: 'text', required: true },
    { name: 'relationshipType', label: 'Relation', kind: 'select', options: [
      { label: 'Père', value: 'père' },
      { label: 'Mère', value: 'mère' },
      { label: 'Tuteur', value: 'tuteur' },
      { label: 'Autre', value: 'autre' },
    ] },
    { name: 'phone', label: 'Téléphone', kind: 'tel' },
    { name: 'email', label: 'Email', kind: 'email' },
    { name: 'address', label: 'Adresse', kind: 'textarea' },
    { name: 'applicationStage', label: 'Étape', kind: 'select', required: true, options: [
      { label: 'Brouillon', value: 'draft' },
      { label: 'Documents en attente', value: 'documents_en_attente' },
      { label: 'Entretien à planifier', value: 'entretien_a_planifier' },
      { label: 'Entretien planifié', value: 'entretien_planifie' },
      { label: 'En étude', value: 'en_etude' },
      { label: 'Accepté', value: 'accepte' },
      { label: 'Refusé', value: 'refuse' },
      { label: 'Liste d’attente', value: 'liste_attente' },
      { label: 'Converti', value: 'converti' },
    ] },
    { name: 'applicationDate', label: 'Date dossier', kind: 'date' },
    { name: 'decisionDate', label: 'Date décision', kind: 'date' },
    { name: 'decisionStatus', label: 'Décision', kind: 'select', options: [
      { label: 'En attente', value: 'pending' },
      { label: 'Accepté', value: 'accepted' },
      { label: 'Refusé', value: 'rejected' },
      { label: 'Liste d’attente', value: 'waitlisted' },
      { label: 'Converti', value: 'converted' },
    ] },
    { name: 'decisionReason', label: 'Motif décision', kind: 'textarea' },
    { name: 'priority', label: 'Priorité', kind: 'select', options: [
      { label: 'Faible', value: 'low' },
      { label: 'Normale', value: 'normal' },
      { label: 'Haute', value: 'high' },
      { label: 'Urgente', value: 'urgent' },
    ] },
    { name: 'nextAction', label: 'Prochaine action', kind: 'textarea' },
    { name: 'nextActionAt', label: 'Échéance', kind: 'datetime' },
    { name: 'responsibleStaffId', label: 'Responsable', kind: 'text' },
    { name: 'convertedAt', label: 'Date conversion', kind: 'datetime' },
    { name: 'convertedStudentId', label: 'Élève converti', kind: 'text' },
    { name: 'convertedParentId', label: 'Parent converti', kind: 'text' },
    { name: 'convertedEnrollmentId', label: 'Affectation convertie', kind: 'text' },
    { name: 'status', label: 'Statut', kind: 'select', required: true, options: ANGELCARE360_ADMISSION_APPLICATION_STATUS_OPTIONS },
  ],
  columns: [
    { key: 'application_code', label: 'Code' },
    { key: 'lead_student_full_name', label: 'Enfant' },
    { key: 'lead_parent_name', label: 'Parent' },
    { key: 'class_name', label: 'Classe' },
    { key: 'section_name', label: 'Section' },
    { key: 'application_stage', label: 'Étape', kind: 'status' },
    { key: 'status', label: 'Statut', kind: 'status' },
    { key: 'missing_document_count', label: 'Pièces', kind: 'number' },
  ],
  filters: [
    { name: 'status', label: 'Statut', options: ANGELCARE360_ADMISSION_APPLICATION_STATUS_OPTIONS },
  ],
  rowActions: [
    { key: 'edit', label: 'Modifier', kind: 'secondary' },
    { key: 'status', label: 'Changer le statut', kind: 'secondary', operation: 'status' },
  ],
}

export default async function Angelcare360AdmissionsDossiersPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/admissions')

  const [rows, academicYears, classes, sections, parents, students, leads, staff] = await Promise.all([
    listAngelcare360AdmissionApplications({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360AcademicYears(context.school.id),
    listAngelcare360Classes(context.school.id, context.academicYear?.id || null),
    listAngelcare360Sections(context.school.id, context.academicYear?.id || null),
    listAngelcare360Parents(context.school.id),
    listAngelcare360Students(context.school.id),
    listAngelcare360AdmissionLeads({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null }),
    listAngelcare360Staff(context.school.id),
  ])

  const academicYearOptions = academicYears.map((row) => ({ label: `${String(row.label)} (${String(row.year_code)})`, value: String(row.id) }))
  const classOptions = createClassOptions(classes as Array<Record<string, unknown>>)
  const sectionOptions = createSectionOptions(sections as Array<Record<string, unknown>>)
  const leadOptions = leads.map((lead) => ({ label: `${String(lead.student_full_name)} · ${String(lead.parent_name)}`, value: String(lead.id) }))
  const parentOptions = parents.map((parent) => ({ label: String(parent.full_name), value: String(parent.id) }))
  const studentOptions = students.map((student) => ({ label: String(student.full_name), value: String(student.id) }))
  const staffOptions = staff.map((item) => ({ label: `${item.full_name} (${item.staff_code})`, value: String(item.id) }))

  const config: Angelcare360AdmissionsEntityConfig = {
    ...APPLICATION_CONFIG,
    fixedValues: {
      schoolId: context.school.id,
      applicationCode: `APP-${Date.now()}`,
      applicationStage: 'open',
      status: 'open',
      decisionStatus: 'pending',
    },
    filters: [
      { name: 'status', label: 'Statut', options: ANGELCARE360_ADMISSION_APPLICATION_STATUS_OPTIONS },
      { name: 'class_name', label: 'Classe', options: classOptions },
      { name: 'section_name', label: 'Section', options: sectionOptions },
    ],
    fields: APPLICATION_CONFIG.fields.map((field) => {
      if (field.name === 'academicYearId') return { ...field, kind: 'select', options: academicYearOptions }
      if (field.name === 'classId') return { ...field, kind: 'select', options: classOptions }
      if (field.name === 'sectionId') return { ...field, kind: 'select', options: sectionOptions }
      if (field.name === 'leadId') return { ...field, kind: 'select', options: leadOptions }
      if (field.name === 'parentId') return { ...field, kind: 'select', options: parentOptions }
      if (field.name === 'studentId') return { ...field, kind: 'select', options: studentOptions }
      if (field.name === 'responsibleStaffId') return { ...field, kind: 'select', options: staffOptions }
      return field
    }),
  }

  const canCreate = context.access.accessLevel === 'super_admin' || context.permissions.has('admissions.create')
  const canUpdate = context.access.accessLevel === 'super_admin' || context.permissions.has('admissions.update')

  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement actif', value: context.school.name },
        { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
        { label: 'Dossiers', value: String(rows.length) },
      ]}
    />
  )

  return (
    <Angelcare360AdmissionsListWorkspace
      config={config}
      rows={rows as unknown as Array<Record<string, unknown>>}
      contextRow={contextRow}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="Vous n’avez pas la permission de créer un dossier."
      updateDisabledReason="Vous n’avez pas la permission de modifier un dossier."
      statusChange={{ entity: 'application', schoolId: context.school.id, options: ANGELCARE360_ADMISSION_APPLICATION_STATUS_OPTIONS }}
    />
  )
}
