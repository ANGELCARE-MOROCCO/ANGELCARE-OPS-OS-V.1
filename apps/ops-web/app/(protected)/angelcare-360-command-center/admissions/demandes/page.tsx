import { redirect } from 'next/navigation'
import Angelcare360AdmissionsListWorkspace from '@/components/angelcare360/admissions/Angelcare360AdmissionsListWorkspace'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { ANGELCARE360_ADMISSION_LEAD_STATUS_OPTIONS } from '@/data/angelcare360/admissions-navigation'
import {
  getAngelcare360AccessContext,
  listAngelcare360AdmissionLeads,
  listAngelcare360Staff,
} from '@/lib/angelcare360/server'
import type { Angelcare360AdmissionsEntityConfig } from '@/types/angelcare360/admissions'

export const dynamic = 'force-dynamic'

const LEAD_CONFIG: Angelcare360AdmissionsEntityConfig = {
  routeKey: 'demandes',
  resource: 'lead',
  title: 'Demandes d’inscription',
  subtitle: 'Prospects, qualification et suivi du premier contact.',
  headerBadge: 'Admissions',
  listPermission: 'admissions.view',
  createPermission: 'admissions.create',
  updatePermission: 'admissions.update',
  searchPlaceholder: 'Rechercher une demande',
  emptyTitle: 'Aucune demande',
  emptyDescription: 'Créez une première demande pour alimenter le pipeline admissions.',
  createLabel: 'Créer une demande',
  editLabel: 'Modifier la demande',
  searchableKeys: ['lead_code', 'student_full_name', 'parent_name', 'parent_phone', 'parent_email', 'desired_level', 'source_channel', 'status'],
  detailHrefKey: 'detail_href',
  columns: [
    { key: 'lead_code', label: 'Code' },
    { key: 'student_full_name', label: 'Enfant' },
    { key: 'parent_name', label: 'Parent' },
    { key: 'parent_phone', label: 'Téléphone' },
    { key: 'desired_level', label: 'Niveau' },
    { key: 'source_channel', label: 'Source' },
    { key: 'status', label: 'Statut', kind: 'status' },
    { key: 'next_action_at', label: 'Échéance', kind: 'datetime' },
  ],
  filters: [
    { name: 'status', label: 'Statut', options: ANGELCARE360_ADMISSION_LEAD_STATUS_OPTIONS },
  ],
  rowActions: [
    { key: 'edit', label: 'Modifier', kind: 'secondary' },
    { key: 'status', label: 'Changer le statut', kind: 'secondary', operation: 'status' },
  ],
  fields: [
    { name: 'schoolId', label: 'Établissement', kind: 'text', required: true, readOnly: true },
    { name: 'leadCode', label: 'Code demande', kind: 'text', required: true },
    { name: 'parentName', label: 'Nom du parent', kind: 'text', required: true },
    { name: 'parentPhone', label: 'Téléphone', kind: 'tel', helpText: 'Le téléphone ou l’email du contact est requis.' },
    { name: 'parentEmail', label: 'Email', kind: 'email' },
    { name: 'studentFullName', label: 'Nom de l’enfant', kind: 'text', required: true },
    { name: 'childFirstName', label: 'Prénom enfant', kind: 'text' },
    { name: 'childLastName', label: 'Nom enfant', kind: 'text' },
    { name: 'childDateOfBirth', label: 'Date de naissance', kind: 'date' },
    { name: 'relationshipType', label: 'Relation', kind: 'select', options: [
      { label: 'Père', value: 'père' },
      { label: 'Mère', value: 'mère' },
      { label: 'Tuteur', value: 'tuteur' },
      { label: 'Autre', value: 'autre' },
    ] },
    { name: 'desiredLevel', label: 'Niveau demandé', kind: 'text' },
    { name: 'sourceChannel', label: 'Source', kind: 'select', options: [
      { label: 'Formulaire web', value: 'web' },
      { label: 'Appel', value: 'appel' },
      { label: 'Visite', value: 'visite' },
      { label: 'Recommandation', value: 'recommandation' },
      { label: 'Email', value: 'email' },
      { label: 'Autre', value: 'autre' },
    ] },
    { name: 'assignedStaffId', label: 'Responsable', kind: 'text' },
    { name: 'priority', label: 'Priorité', kind: 'select', options: [
      { label: 'Faible', value: 'low' },
      { label: 'Normale', value: 'normal' },
      { label: 'Haute', value: 'high' },
      { label: 'Urgente', value: 'urgent' },
    ] },
    { name: 'nextAction', label: 'Prochaine action', kind: 'textarea' },
    { name: 'nextActionAt', label: 'Échéance', kind: 'datetime' },
    { name: 'responsibleStaffId', label: 'Staff responsable', kind: 'text' },
    { name: 'status', label: 'Statut', kind: 'select', required: true, options: ANGELCARE360_ADMISSION_LEAD_STATUS_OPTIONS },
    { name: 'notes', label: 'Notes', kind: 'textarea' },
  ],
}

export default async function Angelcare360AdmissionsDemandesPage() {
  const context = await getAngelcare360AccessContext()
  if (!context?.school) redirect('/angelcare-360-command-center/admissions')

  const rows = await listAngelcare360AdmissionLeads({ schoolId: context.school.id, academicYearId: context.academicYear?.id || null })
  const staff = await listAngelcare360Staff(context.school.id)
  const sourceOptions = Array.from(new Set(rows.map((row) => String(row.source_channel || '').trim()).filter(Boolean))).map((value) => ({ label: value, value }))
  const createConfig: Angelcare360AdmissionsEntityConfig = {
    ...LEAD_CONFIG,
    fixedValues: {
      schoolId: context.school.id,
      leadCode: `LEAD-${Date.now()}`,
      status: 'new',
    },
    filters: [
      { name: 'status', label: 'Statut', options: ANGELCARE360_ADMISSION_LEAD_STATUS_OPTIONS },
      { name: 'source_channel', label: 'Source', options: sourceOptions },
    ],
    fields: LEAD_CONFIG.fields.map((field) => {
      if (field.name === 'responsibleStaffId') {
        return {
          ...field,
          kind: 'select',
          options: staff.map((item) => ({ label: `${item.full_name} (${item.staff_code})`, value: String(item.id) })),
        }
      }
      return field
    }),
  }

  const canCreate = context.permissions.has('admissions.create') || context.access.accessLevel === 'super_admin'
  const canUpdate = context.permissions.has('admissions.update') || context.access.accessLevel === 'super_admin'

  return (
    <Angelcare360AdmissionsListWorkspace
      config={createConfig}
      rows={rows as unknown as Array<Record<string, unknown>>}
      contextRow={
        <Angelcare360AdministrationContextRow
          items={[
            { label: 'Établissement actif', value: context.school.name },
            { label: 'Année active', value: context.academicYear?.label || 'Non définie' },
            { label: 'Demandes', value: String(rows.length) },
          ]}
        />
      }
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="Vous n’avez pas la permission de créer une demande d’inscription."
      updateDisabledReason="Vous n’avez pas la permission de modifier une demande."
      statusChange={{ entity: 'lead', schoolId: context.school.id, options: ANGELCARE360_ADMISSION_LEAD_STATUS_OPTIONS }}
    />
  )
}
