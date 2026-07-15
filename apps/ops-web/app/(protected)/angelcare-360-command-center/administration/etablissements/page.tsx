import { redirect } from 'next/navigation'
import Angelcare360AdministrationEntityScreen from '@/components/angelcare360/administration/Angelcare360AdministrationEntityScreen'
import Angelcare360AdministrationContextRow from '@/components/angelcare360/administration/Angelcare360AdministrationContextRow'
import { getAngelcare360AdministrationContext, listAngelcare360Schools } from '@/lib/angelcare360/server'
import type { Angelcare360AdminEntityConfig } from '@/types/angelcare360/administration'
import { mapSchoolRow } from '../_mappers'

export const dynamic = 'force-dynamic'

const SCHOOL_CONFIG: Angelcare360AdminEntityConfig = {
  routeKey: 'etablissements',
  resource: 'etablissements',
  title: 'Établissements',
  subtitle: 'Gestion des écoles, de leur identité administrative et de leurs paramètres de base.',
  headerBadge: 'Setup',
  listPermission: 'parametres.view',
  createPermission: 'parametres.create',
  updatePermission: 'parametres.update',
  searchPlaceholder: 'Rechercher un établissement',
  emptyTitle: 'Aucun établissement',
  emptyDescription: 'Créez le premier établissement pour initialiser le command center.',
  createLabel: 'Créer un établissement',
  editLabel: 'Modifier l’établissement',
  searchableKeys: ['school_code', 'name', 'city', 'country', 'email', 'phone', 'school_type'],
  statusField: 'status',
  statusValues: ['active', 'inactive', 'suspended', 'archived'],
  fields: [
    { name: 'school_code', label: 'Code établissement', kind: 'text', required: true },
    { name: 'name', label: 'Nom', kind: 'text', required: true },
    { name: 'school_type', label: 'Type établissement', kind: 'select', required: true, options: [
      { label: 'École', value: 'ecole' },
      { label: 'Crèche', value: 'creche' },
      { label: 'Maternelle', value: 'maternelle' },
      { label: 'Primaire', value: 'primaire' },
      { label: 'Collège', value: 'college' },
      { label: 'Lycée', value: 'lycee' },
    ] },
    { name: 'city', label: 'Ville', kind: 'text' },
    { name: 'country', label: 'Pays', kind: 'text' },
    { name: 'address', label: 'Adresse', kind: 'textarea' },
    { name: 'phone', label: 'Téléphone', kind: 'tel' },
    { name: 'email', label: 'Email', kind: 'email' },
    { name: 'contact_principal', label: 'Contact principal', kind: 'text', helpText: 'Stocké dans les métadonnées de l’établissement.' },
    { name: 'currency', label: 'Devise', kind: 'select', options: [
      { label: 'MAD', value: 'MAD' },
      { label: 'EUR', value: 'EUR' },
      { label: 'USD', value: 'USD' },
    ] },
    { name: 'language', label: 'Langue', kind: 'select', options: [
      { label: 'Français', value: 'fr' },
      { label: 'Arabe', value: 'ar' },
      { label: 'Bilingue', value: 'bilingual' },
    ] },
    { name: 'timezone', label: 'Fuseau horaire', kind: 'text' },
    { name: 'target_capacity', label: 'Capacité cible', kind: 'number', min: 0, helpText: 'Stocké dans les métadonnées.' },
    { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
      { label: 'Actif', value: 'active' },
      { label: 'Inactif', value: 'inactive' },
      { label: 'Suspendu', value: 'suspended' },
      { label: 'Archivé', value: 'archived' },
    ] },
    { name: 'notes', label: 'Notes', kind: 'textarea', helpText: 'Note administrative interne, stockée en métadonnées.' },
  ],
  columns: [
    { key: 'school_code', label: 'Code' },
    { key: 'name', label: 'Nom' },
    { key: 'school_type', label: 'Type' },
    { key: 'city', label: 'Ville' },
    { key: 'country', label: 'Pays' },
    { key: 'status', label: 'Statut', kind: 'status' },
  ],
  filters: [
    { name: 'status', label: 'Statut', options: [
      { label: 'Actif', value: 'active' },
      { label: 'Inactif', value: 'inactive' },
      { label: 'Suspendu', value: 'suspended' },
      { label: 'Archivé', value: 'archived' },
    ] },
    { name: 'school_type', label: 'Type', options: [
      { label: 'École', value: 'ecole' },
      { label: 'Crèche', value: 'creche' },
      { label: 'Maternelle', value: 'maternelle' },
      { label: 'Primaire', value: 'primaire' },
      { label: 'Collège', value: 'college' },
      { label: 'Lycée', value: 'lycee' },
    ] },
    { name: 'city', label: 'Ville', options: [] },
  ],
  rowActions: [
    { key: 'edit', label: 'Modifier', kind: 'secondary' },
    { key: 'status', label: 'Archiver', kind: 'danger', operation: 'status', value: 'archived', disabledReason: 'L’archivage est réservé aux établissements obsolètes.' },
  ],
}

export default async function Angelcare360EtablissementsPage() {
  const state = await getAngelcare360AdministrationContext()
  if (!state?.context?.school || !state.overview) redirect('/angelcare-360-command-center/administration')

  const schools = (await listAngelcare360Schools()).map(mapSchoolRow)
  const canCreate = state.context.permissions.has('parametres.create') || state.context.access.accessLevel === 'super_admin'
  const canUpdate = state.context.permissions.has('parametres.update') || state.context.access.accessLevel === 'super_admin'

  const contextRow = (
    <Angelcare360AdministrationContextRow
      items={[
        { label: 'Établissement actif', value: state.overview.currentSchool?.name || state.context.school.name },
        { label: 'Année active', value: state.overview.currentAcademicYear?.label || 'Non définie' },
        { label: 'Établissements', value: String(schools.length) },
      ]}
    />
  )

  return (
    <Angelcare360AdministrationEntityScreen
      config={SCHOOL_CONFIG}
      rows={schools}
      overview={state.overview}
      contextRow={contextRow}
      canCreate={canCreate}
      canUpdate={canUpdate}
      createDisabledReason="Vous n’avez pas la permission de créer un établissement."
      updateDisabledReason="Vous n’avez pas la permission de modifier un établissement."
    />
  )
}

