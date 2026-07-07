import type {
  Angelcare360PeopleEntityConfig,
  Angelcare360PeopleFieldOption,
} from '@/types/angelcare360/people'

export type Angelcare360PeopleSelectSource = Array<Record<string, unknown>>

export function toPeopleOptions(
  rows: Angelcare360PeopleSelectSource,
  labelSelector: (row: Record<string, unknown>) => string,
  valueSelector: (row: Record<string, unknown>) => string = (row) => String(row.id || ''),
): Angelcare360PeopleFieldOption[] {
  return rows
    .map((row) => ({
      label: labelSelector(row),
      value: valueSelector(row),
    }))
    .filter((option) => Boolean(option.value))
}

function text(value: unknown) {
  return value === null || value === undefined ? '' : String(value)
}

function name(row: Record<string, unknown>) {
  return text(row.full_name || [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || row.name || row.label)
}

function classLabel(row: Record<string, unknown>) {
  const parts = [text(row.class_code), text(row.name || row.level)].filter(Boolean)
  return parts.join(' · ') || text(row.name)
}

function sectionLabel(row: Record<string, unknown>) {
  const parts = [text(row.section_code), text(row.name)].filter(Boolean)
  return parts.join(' · ') || text(row.name)
}

function subjectLabel(row: Record<string, unknown>) {
  const parts = [text(row.subject_code), text(row.name)].filter(Boolean)
  return parts.join(' · ') || text(row.name)
}

function mapStudentValues(row: Record<string, unknown>) {
  const metadata = (row.metadata_json as Record<string, unknown> | undefined) || {}
  return {
    id: row.id,
    schoolId: row.school_id,
    studentCode: row.student_code,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    nationalId: row.national_id,
    nationality: metadata.nationality || null,
    address: metadata.address || null,
    administrativeNotes: metadata.administrative_notes || null,
    currentClassId: row.current_class_id,
    currentSectionId: row.current_section_id,
    academicYearId: row.academic_year_id || null,
    admissionStatus: row.admission_status,
    status: row.status,
    transportRequired: Boolean(row.transport_required),
    portalAppUserId: row.portal_app_user_id || null,
  }
}

function mapParentValues(row: Record<string, unknown>) {
  const metadata = (row.metadata_json as Record<string, unknown> | undefined) || {}
  return {
    id: row.id,
    schoolId: row.school_id,
    parentCode: row.parent_code,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    relationshipType: metadata.relationship_type || 'tuteur',
    email: row.email,
    phone: row.phone,
    secondaryPhone: metadata.secondary_phone || null,
    whatsapp: row.whatsapp,
    occupation: row.occupation,
    preferredLanguage: row.preferred_language,
    address: row.address,
    administrativeNotes: metadata.notes || null,
    status: row.status,
  }
}

function mapStaffValues(row: Record<string, unknown>) {
  const metadata = (row.metadata_json as Record<string, unknown> | undefined) || {}
  return {
    id: row.id,
    schoolId: row.school_id,
    staffCode: row.staff_code,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    staffType: row.staff_type,
    department: row.department,
    hireDate: row.hire_date,
    endDate: row.end_date,
    speciality: metadata.speciality || null,
    contractType: metadata.contract_type || null,
    administrativeNotes: metadata.notes || null,
    status: row.status,
  }
}

function mapEmergencyContactValues(row: Record<string, unknown>) {
  const metadata = (row.metadata_json as Record<string, unknown> | undefined) || {}
  return {
    id: row.id,
    schoolId: row.school_id,
    contactableType: row.contactable_type,
    contactableId: row.contactable_id,
    contactName: row.contact_name,
    relationshipType: row.relationship_type,
    phone: row.phone,
    email: row.email,
    priority: row.priority,
    status: row.status,
    notes: metadata.notes || null,
  }
}

function mapDocumentValues(row: Record<string, unknown>) {
  const metadata = (row.metadata_json as Record<string, unknown> | undefined) || {}
  return {
    id: row.id,
    schoolId: row.school_id,
    documentCode: row.document_code,
    documentableType: row.documentable_type,
    documentableId: row.documentable_id,
    category: row.category,
    title: row.title,
    fileName: row.file_name,
    filePath: row.file_path,
    visibility: row.visibility,
    status: row.status,
    documentState: metadata.document_state || 'requis',
    expiryDate: metadata.expiry_date || null,
    notes: metadata.notes || null,
  }
}

function mapLinkValues(row: Record<string, unknown>) {
  return {
    id: row.id,
    schoolId: row.school_id,
    studentId: row.student_id,
    parentId: row.parent_id,
    relationshipType: row.relationship_type,
    isPrimary: Boolean(row.is_primary),
    isGuardian: Boolean(row.is_guardian),
    canPickup: Boolean(row.can_pickup),
    canReceiveMessages: Boolean(row.can_receive_messages),
    canPayFees: Boolean(row.can_pay_fees),
    status: row.status,
  }
}

function mapEnrollmentValues(row: Record<string, unknown>) {
  return {
    id: row.id,
    schoolId: row.school_id,
    academicYearId: row.academic_year_id,
    studentId: row.student_id,
    classId: row.class_id,
    sectionId: row.section_id,
    enrollmentNumber: row.enrollment_number,
    status: row.status,
  }
}

function baseRowActions() {
  return [
    { key: 'edit', label: 'Modifier', kind: 'secondary' as const },
    { key: 'status', label: 'Archiver', kind: 'danger' as const, operation: 'status', value: 'archived', disabledReason: 'L’archivage est réservé aux dossiers obsolètes.' },
  ]
}

export function createStudentPeopleConfig(input: {
  schoolId: string
  academicYearId?: string | null
  classOptions: Angelcare360PeopleFieldOption[]
  sectionOptions: Angelcare360PeopleFieldOption[]
  classRows: Angelcare360PeopleSelectSource
  sectionRows: Angelcare360PeopleSelectSource
}): Angelcare360PeopleEntityConfig {
  return {
    resource: 'eleves',
    title: 'Élèves',
    subtitle: 'Dossiers élèves, classe/section, familles liées et état administratif.',
    headerBadge: 'Dossier',
    listPermission: 'eleves.view',
    createPermission: 'eleves.create',
    updatePermission: 'eleves.update',
    searchPlaceholder: 'Rechercher par nom, matricule, classe, parent ou statut',
    emptyTitle: 'Aucun élève',
    emptyDescription: 'Créez le premier dossier élève pour commencer à structurer les inscriptions.',
    createLabel: 'Créer un élève',
    editLabel: 'Modifier l’élève',
    fixedValues: {
      schoolId: input.schoolId,
      academicYearId: input.academicYearId || null,
    },
    detailHrefKey: 'detail_href',
    statusField: 'status',
    statusValues: ['active', 'inactive', 'archived'],
    fields: [
      { name: 'studentCode', label: 'Matricule', kind: 'text', required: true },
      { name: 'firstName', label: 'Prénom', kind: 'text', required: true },
      { name: 'lastName', label: 'Nom', kind: 'text', required: true },
      { name: 'fullName', label: 'Nom complet', kind: 'text', required: true, helpText: 'Utilisé dans les dossiers et les exports.' },
      { name: 'dateOfBirth', label: 'Date de naissance', kind: 'date' },
      { name: 'gender', label: 'Sexe', kind: 'select', options: [
        { label: 'Fille', value: 'female' },
        { label: 'Garçon', value: 'male' },
        { label: 'Non précisé', value: 'unknown' },
      ] },
      { name: 'nationalId', label: 'Identifiant national', kind: 'text' },
      { name: 'nationality', label: 'Nationalité', kind: 'text' },
      { name: 'address', label: 'Adresse', kind: 'textarea' },
      { name: 'currentClassId', label: 'Classe', kind: 'select', options: input.classOptions },
      { name: 'currentSectionId', label: 'Section', kind: 'select', options: input.sectionOptions },
      { name: 'admissionStatus', label: 'Statut d’admission', kind: 'select', required: true, options: [
        { label: 'Prospect', value: 'prospect' },
        { label: 'Préinscrit', value: 'preinscrit' },
        { label: 'Inscrit', value: 'enrolled' },
        { label: 'Transféré', value: 'transferred' },
        { label: 'Sorti', value: 'left' },
      ] },
      { name: 'transportRequired', label: 'Transport requis', kind: 'switch' },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
      { name: 'administrativeNotes', label: 'Notes administratives', kind: 'textarea' },
    ],
    columns: [
      { key: 'student_code', label: 'Matricule' },
      { key: 'full_name', label: 'Élève' },
      { key: 'current_class_name', label: 'Classe' },
      { key: 'current_section_name', label: 'Section' },
      { key: 'parent_names', label: 'Parents', kind: 'chips' },
      { key: 'admission_status', label: 'Admission', kind: 'status' },
      { key: 'status', label: 'Statut', kind: 'status' },
      { key: 'document_count', label: 'Documents', kind: 'number' },
    ],
    filters: [
      { name: 'status', label: 'Statut', options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
      { name: 'current_class_name', label: 'Classe', options: input.classOptions },
      { name: 'current_section_name', label: 'Section', options: input.sectionOptions },
      { name: 'admission_status', label: 'Admission', options: [
        { label: 'Prospect', value: 'prospect' },
        { label: 'Préinscrit', value: 'preinscrit' },
        { label: 'Inscrit', value: 'enrolled' },
        { label: 'Transféré', value: 'transferred' },
        { label: 'Sorti', value: 'left' },
      ] },
    ],
    rowActions: [
      { key: 'edit', label: 'Modifier', kind: 'secondary' },
      { key: 'unlink', label: 'Dissocier', kind: 'danger', operation: 'unlink' },
      { key: 'status', label: 'Archiver', kind: 'danger', operation: 'status', value: 'archived', disabledReason: 'L’archivage est réservé aux dossiers obsolètes.' },
    ],
    searchableKeys: ['student_code', 'full_name', 'first_name', 'last_name', 'current_class_name', 'current_section_name', 'admission_status', 'status', 'parent_names'],
    normalizeInitialValues: mapStudentValues,
  }
}

export function createParentPeopleConfig(input: { schoolId: string }): Angelcare360PeopleEntityConfig {
  return {
    resource: 'parents',
    title: 'Parents',
    subtitle: 'Dossiers familles, contacts, liens enfants et complétude administrative.',
    headerBadge: 'Familles',
    listPermission: 'parents.view',
    createPermission: 'parents.create',
    updatePermission: 'parents.update',
    searchPlaceholder: 'Rechercher par nom, téléphone, email ou enfant',
    emptyTitle: 'Aucun parent',
    emptyDescription: 'Créez le premier dossier famille pour relier les enfants aux responsables légaux.',
    createLabel: 'Créer un parent',
    editLabel: 'Modifier le parent',
    fixedValues: { schoolId: input.schoolId },
    detailHrefKey: 'detail_href',
    statusField: 'status',
    statusValues: ['active', 'inactive', 'archived'],
    fields: [
      { name: 'parentCode', label: 'Code parent', kind: 'text', required: true },
      { name: 'firstName', label: 'Prénom', kind: 'text', required: true },
      { name: 'lastName', label: 'Nom', kind: 'text', required: true },
      { name: 'fullName', label: 'Nom complet', kind: 'text', required: true },
      { name: 'relationshipType', label: 'Relation', kind: 'select', required: true, options: [
        { label: 'Père', value: 'père' },
        { label: 'Mère', value: 'mère' },
        { label: 'Tuteur', value: 'tuteur' },
        { label: 'Autre', value: 'autre' },
      ] },
      { name: 'phone', label: 'Téléphone principal', kind: 'tel' },
      { name: 'secondaryPhone', label: 'Téléphone secondaire', kind: 'tel' },
      { name: 'whatsapp', label: 'WhatsApp', kind: 'tel' },
      { name: 'email', label: 'Email', kind: 'email' },
      { name: 'occupation', label: 'Profession', kind: 'text' },
      { name: 'preferredLanguage', label: 'Langue préférée', kind: 'select', options: [
        { label: 'Français', value: 'fr' },
        { label: 'Arabe', value: 'ar' },
        { label: 'Bilingue', value: 'bilingual' },
      ] },
      { name: 'address', label: 'Adresse', kind: 'textarea' },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
      { name: 'administrativeNotes', label: 'Notes administratives', kind: 'textarea' },
    ],
    columns: [
      { key: 'parent_code', label: 'Code' },
      { key: 'full_name', label: 'Parent' },
      { key: 'relationship_type', label: 'Relation' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'email', label: 'Email' },
      { key: 'child_names', label: 'Enfants', kind: 'chips' },
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    filters: [
      { name: 'status', label: 'Statut', options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
      { name: 'relationship_type', label: 'Relation', options: [
        { label: 'Père', value: 'père' },
        { label: 'Mère', value: 'mère' },
        { label: 'Tuteur', value: 'tuteur' },
        { label: 'Autre', value: 'autre' },
      ] },
    ],
    rowActions: baseRowActions(),
    searchableKeys: ['parent_code', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'whatsapp', 'child_names', 'relationship_type', 'status'],
    normalizeInitialValues: mapParentValues,
  }
}

export function createStaffPeopleConfig(input: { schoolId: string; staffType: 'teacher' | 'personnel' }): Angelcare360PeopleEntityConfig {
  const teacher = input.staffType === 'teacher'
  return {
    resource: teacher ? 'enseignants' : 'personnel',
    title: teacher ? 'Enseignants' : 'Personnel',
    subtitle: teacher ? 'Profils pédagogiques et affectations de service.' : 'Dossiers du personnel, contrats et organisation interne.',
    headerBadge: teacher ? 'Pédagogie' : 'RH',
    listPermission: teacher ? 'enseignants.view' : 'personnel.view',
    createPermission: teacher ? 'enseignants.create' : 'personnel.create',
    updatePermission: teacher ? 'enseignants.update' : 'personnel.update',
    searchPlaceholder: teacher ? 'Rechercher un enseignant' : 'Rechercher un membre du personnel',
    emptyTitle: teacher ? 'Aucun enseignant' : 'Aucun membre du personnel',
    emptyDescription: teacher ? 'Ajoutez le premier enseignant pour alimenter les affectations de classes et de matières.' : 'Ajoutez le premier membre du personnel pour structurer l’organisation interne.',
    createLabel: teacher ? 'Créer un enseignant' : 'Créer un membre du personnel',
    editLabel: teacher ? 'Modifier l’enseignant' : 'Modifier le personnel',
    fixedValues: { schoolId: input.schoolId },
    detailHrefKey: 'detail_href',
    statusField: 'status',
    statusValues: ['active', 'on_leave', 'inactive', 'archived'],
    fields: [
      { name: 'staffCode', label: 'Matricule', kind: 'text', required: true },
      { name: 'firstName', label: 'Prénom', kind: 'text', required: true },
      { name: 'lastName', label: 'Nom', kind: 'text', required: true },
      { name: 'fullName', label: 'Nom complet', kind: 'text', required: true },
      { name: 'email', label: 'Email', kind: 'email' },
      { name: 'phone', label: 'Téléphone', kind: 'tel' },
      { name: 'department', label: 'Département', kind: 'text' },
      { name: 'hireDate', label: 'Date d’entrée', kind: 'date' },
      { name: 'endDate', label: 'Date de sortie', kind: 'date' },
      { name: 'speciality', label: 'Spécialité', kind: 'text' },
      { name: 'contractType', label: 'Type de contrat', kind: 'text' },
      { name: 'staffType', label: 'Type de personnel', kind: 'select', required: true, readOnly: true, disabledReason: teacher ? 'Le type est fixé à enseignant sur cette page.' : 'Le type est fixé au personnel sur cette page.', options: [
        { label: 'Enseignant', value: 'teacher' },
        { label: 'Personnel', value: 'personnel' },
        { label: 'Administration', value: 'administration' },
      ] },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Actif', value: 'active' },
        { label: 'En congé', value: 'on_leave' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
      { name: 'administrativeNotes', label: 'Notes administratives', kind: 'textarea' },
    ],
    columns: [
      { key: 'staff_code', label: 'Matricule' },
      { key: 'full_name', label: teacher ? 'Enseignant' : 'Personnel' },
      { key: 'department', label: 'Département' },
      { key: 'class_names', label: 'Classes', kind: 'chips' },
      { key: 'subject_names', label: 'Matières', kind: 'chips' },
      { key: 'contract_count', label: 'Contrats', kind: 'number' },
      { key: 'assignment_count', label: 'Affectations', kind: 'number' },
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    filters: [
      { name: 'status', label: 'Statut', options: [
        { label: 'Actif', value: 'active' },
        { label: 'En congé', value: 'on_leave' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
      { name: 'department', label: 'Département', options: [] },
      { name: 'staff_type', label: 'Type', options: [
        { label: 'Enseignant', value: 'teacher' },
        { label: 'Personnel', value: 'personnel' },
      ] },
    ],
    rowActions: baseRowActions(),
    searchableKeys: ['staff_code', 'full_name', 'first_name', 'last_name', 'email', 'phone', 'department', 'class_names', 'subject_names', 'staff_type', 'status'],
    normalizeInitialValues: mapStaffValues,
  }
}

export function createEmergencyContactPeopleConfig(input: { schoolId: string }): Angelcare360PeopleEntityConfig {
  return {
    resource: 'contacts-urgence',
    title: 'Contacts d’urgence',
    subtitle: 'Contacts critiques liés aux élèves et au personnel.',
    headerBadge: 'Sécurité',
    listPermission: 'eleves.view',
    createPermission: 'eleves.update',
    updatePermission: 'eleves.update',
    searchPlaceholder: 'Rechercher un contact, une relation ou un téléphone',
    emptyTitle: 'Aucun contact d’urgence',
    emptyDescription: 'Ajoutez des contacts prioritaires pour sécuriser les dossiers humains.',
    createLabel: 'Créer un contact',
    editLabel: 'Modifier le contact',
    fixedValues: { schoolId: input.schoolId },
    searchableKeys: ['contact_name', 'relationship_type', 'phone', 'email', 'status', 'linked_person_name'],
    detailHrefKey: 'detail_href',
    statusField: 'status',
    statusValues: ['active', 'inactive', 'archived'],
    fields: [
      { name: 'contactableType', label: 'Type de fiche', kind: 'select', required: true, options: [
        { label: 'Élève', value: 'student' },
        { label: 'Personnel', value: 'staff' },
      ] },
      { name: 'contactableId', label: 'Identifiant lié', kind: 'text', required: true, helpText: 'Identifiant technique de l’élève ou du membre du personnel.' },
      { name: 'contactName', label: 'Nom du contact', kind: 'text', required: true },
      { name: 'relationshipType', label: 'Relation', kind: 'text' },
      { name: 'phone', label: 'Téléphone', kind: 'tel', required: true },
      { name: 'email', label: 'Email', kind: 'email' },
      { name: 'priority', label: 'Priorité', kind: 'number', min: 1, step: 1 },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
      { name: 'notes', label: 'Notes', kind: 'textarea' },
    ],
    columns: [
      { key: 'contact_name', label: 'Contact' },
      { key: 'linked_person_name', label: 'Personne liée' },
      { key: 'relationship_type', label: 'Relation' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'priority', label: 'Priorité', kind: 'number' },
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    filters: [
      { name: 'contactable_type', label: 'Fiche liée', options: [
        { label: 'Élève', value: 'student' },
        { label: 'Personnel', value: 'staff' },
      ] },
      { name: 'status', label: 'Statut', options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
    ],
    rowActions: baseRowActions(),
    searchableKeys: ['contact_name', 'relationship_type', 'phone', 'email', 'linked_person_name', 'status'],
    normalizeInitialValues: mapEmergencyContactValues,
  }
}

export function createDocumentPeopleConfig(input: { schoolId: string }): Angelcare360PeopleEntityConfig {
  return {
    resource: 'documents',
    title: 'Documents',
    subtitle: 'Références documentaires, statuts de conformité et suivi des pièces.',
    headerBadge: 'Pièces',
    listPermission: 'documents.view',
    createPermission: 'documents.create',
    updatePermission: 'documents.update',
    searchPlaceholder: 'Rechercher par titre, catégorie ou personne liée',
    emptyTitle: 'Aucun document référencé',
    emptyDescription: 'Enregistrez les documents administratifs pour sécuriser les dossiers humains.',
    createLabel: 'Créer une référence',
    editLabel: 'Modifier le document',
    fixedValues: { schoolId: input.schoolId },
    searchableKeys: ['document_code', 'title', 'category', 'documentable_type', 'linked_person_name', 'status'],
    detailHrefKey: 'detail_href',
    statusField: 'status',
    statusValues: ['requis', 'recu', 'validé', 'expire', 'archived'],
    fields: [
      { name: 'documentCode', label: 'Code document', kind: 'text', required: true },
      { name: 'documentableType', label: 'Type de fiche', kind: 'select', required: true, options: [
        { label: 'Élève', value: 'student' },
        { label: 'Parent', value: 'parent' },
        { label: 'Personnel', value: 'staff' },
      ] },
      { name: 'documentableId', label: 'Identifiant lié', kind: 'text', required: true, helpText: 'Identifiant technique de la fiche liée.' },
      { name: 'category', label: 'Catégorie', kind: 'text', required: true },
      { name: 'title', label: 'Titre', kind: 'text', required: true },
      { name: 'fileName', label: 'Nom de fichier', kind: 'text' },
      { name: 'filePath', label: 'Chemin de fichier', kind: 'text', helpText: 'La mise en ligne directe reste verrouillée à ce stade.' },
      { name: 'visibility', label: 'Visibilité', kind: 'select', required: true, options: [
        { label: 'Privé', value: 'private' },
        { label: 'Établissement', value: 'school' },
        { label: 'Public', value: 'public' },
        { label: 'Restreint', value: 'restricted' },
      ] },
      { name: 'documentState', label: 'État documentaire', kind: 'select', required: true, options: [
        { label: 'Requis', value: 'requis' },
        { label: 'Reçu', value: 'recu' },
        { label: 'Validé', value: 'validé' },
        { label: 'Expiré', value: 'expire' },
      ] },
      { name: 'expiryDate', label: 'Date d’expiration', kind: 'date' },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Requis', value: 'requis' },
        { label: 'Reçu', value: 'recu' },
        { label: 'Validé', value: 'validé' },
        { label: 'Expiré', value: 'expire' },
        { label: 'Archivé', value: 'archived' },
      ] },
      { name: 'notes', label: 'Notes', kind: 'textarea' },
    ],
    columns: [
      { key: 'document_code', label: 'Code' },
      { key: 'title', label: 'Titre' },
      { key: 'category', label: 'Catégorie' },
      { key: 'linked_person_name', label: 'Lié à' },
      { key: 'documentable_type', label: 'Type' },
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    filters: [
      { name: 'documentable_type', label: 'Type', options: [
        { label: 'Élève', value: 'student' },
        { label: 'Parent', value: 'parent' },
        { label: 'Personnel', value: 'staff' },
      ] },
      { name: 'status', label: 'Statut', options: [
        { label: 'Requis', value: 'requis' },
        { label: 'Reçu', value: 'recu' },
        { label: 'Validé', value: 'validé' },
        { label: 'Expiré', value: 'expire' },
        { label: 'Archivé', value: 'archived' },
      ] },
      { name: 'category', label: 'Catégorie', options: [] },
    ],
    rowActions: baseRowActions(),
    searchableKeys: ['document_code', 'title', 'category', 'documentable_type', 'linked_person_name', 'status'],
    normalizeInitialValues: mapDocumentValues,
  }
}

export function createStudentParentLinkPeopleConfig(input: { schoolId: string; studentOptions: Angelcare360PeopleFieldOption[]; parentOptions: Angelcare360PeopleFieldOption[] }): Angelcare360PeopleEntityConfig {
  return {
    resource: 'liens-parent-enfant',
    title: 'Liens parent/enfant',
    subtitle: 'Gestion des liens légaux et de la hiérarchie de contact.',
    headerBadge: 'Relations',
    listPermission: 'parents.view',
    createPermission: 'parents.update',
    updatePermission: 'parents.update',
    searchPlaceholder: 'Rechercher un lien, un parent ou un élève',
    emptyTitle: 'Aucun lien parent/enfant',
    emptyDescription: 'Créez un lien pour rendre le dossier familial opérationnel.',
    createLabel: 'Créer un lien',
    editLabel: 'Modifier le lien',
    fixedValues: { schoolId: input.schoolId },
    searchableKeys: ['student_full_name', 'student_code', 'parent_full_name', 'parent_code', 'relationship_type', 'status'],
    detailHrefKey: 'detail_href',
    statusField: 'status',
    statusValues: ['active', 'inactive', 'archived'],
    fields: [
      { name: 'studentId', label: 'Élève', kind: 'select', required: true, options: input.studentOptions },
      { name: 'parentId', label: 'Parent', kind: 'select', required: true, options: input.parentOptions },
      { name: 'relationshipType', label: 'Relation', kind: 'select', required: true, options: [
        { label: 'Père', value: 'père' },
        { label: 'Mère', value: 'mère' },
        { label: 'Tuteur', value: 'tuteur' },
        { label: 'Autre', value: 'autre' },
      ] },
      { name: 'isPrimary', label: 'Contact principal', kind: 'switch' },
      { name: 'isGuardian', label: 'Responsable légal', kind: 'switch' },
      { name: 'canPickup', label: 'Peut récupérer', kind: 'switch' },
      { name: 'canReceiveMessages', label: 'Peut recevoir les messages', kind: 'switch' },
      { name: 'canPayFees', label: 'Peut régler les frais', kind: 'switch' },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
    ],
    columns: [
      { key: 'student_full_name', label: 'Élève' },
      { key: 'parent_full_name', label: 'Parent' },
      { key: 'relationship_type', label: 'Relation' },
      { key: 'is_primary', label: 'Principal', kind: 'boolean' },
      { key: 'can_receive_messages', label: 'Messages', kind: 'boolean' },
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    filters: [
      { name: 'relationship_type', label: 'Relation', options: [
        { label: 'Père', value: 'père' },
        { label: 'Mère', value: 'mère' },
        { label: 'Tuteur', value: 'tuteur' },
        { label: 'Autre', value: 'autre' },
      ] },
      { name: 'status', label: 'Statut', options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
    ],
    rowActions: baseRowActions(),
    searchableKeys: ['student_full_name', 'student_code', 'parent_full_name', 'parent_code', 'relationship_type', 'status'],
    normalizeInitialValues: mapLinkValues,
  }
}

export function createClassEnrollmentPeopleConfig(input: { schoolId: string; academicYearId?: string | null; classOptions: Angelcare360PeopleFieldOption[]; sectionOptions: Angelcare360PeopleFieldOption[]; studentOptions: Angelcare360PeopleFieldOption[] }): Angelcare360PeopleEntityConfig {
  return {
    resource: 'affectations-classes',
    title: 'Affectations classes',
    subtitle: 'Inscriptions et rattachements opérationnels des élèves.',
    headerBadge: 'Inscriptions',
    listPermission: 'classes.view',
    createPermission: 'eleves.assign',
    updatePermission: 'eleves.assign',
    searchPlaceholder: 'Rechercher un élève, une classe ou une section',
    emptyTitle: 'Aucune affectation',
    emptyDescription: 'Affectez les élèves à des classes et sections pour démarrer le suivi opérationnel.',
    createLabel: 'Affecter un élève',
    editLabel: 'Modifier l’affectation',
    fixedValues: { schoolId: input.schoolId, academicYearId: input.academicYearId || null },
    searchableKeys: ['student_full_name', 'student_code', 'class_name', 'class_code', 'section_name', 'section_code', 'status'],
    detailHrefKey: 'detail_href',
    statusField: 'status',
    statusValues: ['active', 'inactive', 'archived'],
    fields: [
      { name: 'studentId', label: 'Élève', kind: 'select', required: true, options: input.studentOptions },
      { name: 'classId', label: 'Classe', kind: 'select', required: true, options: input.classOptions },
      { name: 'sectionId', label: 'Section', kind: 'select', options: input.sectionOptions },
      { name: 'enrollmentNumber', label: 'Numéro d’inscription', kind: 'text' },
      { name: 'status', label: 'Statut', kind: 'select', required: true, options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
    ],
    columns: [
      { key: 'student_full_name', label: 'Élève' },
      { key: 'class_name', label: 'Classe' },
      { key: 'section_name', label: 'Section' },
      { key: 'enrollment_number', label: 'Inscription' },
      { key: 'enrollment_status', label: 'État', kind: 'status' },
      { key: 'status', label: 'Statut', kind: 'status' },
    ],
    filters: [
      { name: 'class_name', label: 'Classe', options: input.classOptions },
      { name: 'section_name', label: 'Section', options: input.sectionOptions },
      { name: 'status', label: 'Statut', options: [
        { label: 'Actif', value: 'active' },
        { label: 'Inactif', value: 'inactive' },
        { label: 'Archivé', value: 'archived' },
      ] },
    ],
    rowActions: baseRowActions(),
    searchableKeys: ['student_full_name', 'student_code', 'class_name', 'class_code', 'section_name', 'section_code', 'status'],
    normalizeInitialValues: mapEnrollmentValues,
  }
}

export function createPeopleAuditConfig(): Angelcare360PeopleEntityConfig {
  return {
    resource: 'audit',
    title: 'Audit personnes',
    subtitle: 'Suivi des mutations sensibles liées aux dossiers humains.',
    headerBadge: 'Traçabilité',
    listPermission: 'audit.view',
    searchPlaceholder: 'Rechercher par acteur, entité ou action',
    emptyTitle: 'Aucun événement d’audit',
    emptyDescription: 'Les mutations sensibles apparaîtront ici dès qu’elles seront enregistrées.',
    createLabel: 'Filtrer',
    editLabel: 'Détail',
    searchableKeys: ['module', 'action', 'entity_type', 'entity_id', 'actor_role', 'actor_user_id', 'severity'],
    columns: [
      { key: 'created_at', label: 'Date', kind: 'datetime' },
      { key: 'actor_role', label: 'Rôle' },
      { key: 'module', label: 'Module' },
      { key: 'action', label: 'Action' },
      { key: 'entity_type', label: 'Entité' },
      { key: 'severity', label: 'Gravité', kind: 'status' },
    ],
    filters: [
      { name: 'module', label: 'Module', options: [
        { label: 'Élèves', value: 'eleves' },
        { label: 'Parents', value: 'parents' },
        { label: 'Enseignants', value: 'enseignants' },
        { label: 'Personnel', value: 'personnel' },
        { label: 'Documents', value: 'personnes' },
      ] },
      { name: 'severity', label: 'Gravité', options: [
        { label: 'Info', value: 'info' },
        { label: 'Notice', value: 'notice' },
        { label: 'Avertissement', value: 'warning' },
        { label: 'Critique', value: 'critical' },
      ] },
    ],
    rowActions: [
      { key: 'view', label: 'Consulter', kind: 'secondary', disabledReason: 'La consultation s’effectue dans le panneau latéral.' },
    ],
    detailHrefKey: 'detail_href',
    normalizeInitialValues: (row) => row,
  }
}

export function createOptionsFromNameRows(rows: Angelcare360PeopleSelectSource, valueKey = 'id') {
  return toPeopleOptions(rows, name, (row) => text(row[valueKey] || row.id))
}

export function createClassOptions(rows: Angelcare360PeopleSelectSource) {
  return toPeopleOptions(rows, classLabel)
}

export function createSectionOptions(rows: Angelcare360PeopleSelectSource) {
  return toPeopleOptions(rows, sectionLabel)
}

export function createSubjectOptions(rows: Angelcare360PeopleSelectSource) {
  return toPeopleOptions(rows, subjectLabel)
}

export function createStudentOptions(rows: Angelcare360PeopleSelectSource) {
  return toPeopleOptions(rows, (row) => `${text(row.student_code || row.code || '')} · ${name(row)}`.trim())
}

export function createParentOptions(rows: Angelcare360PeopleSelectSource) {
  return toPeopleOptions(rows, (row) => `${text(row.parent_code || row.code || '')} · ${name(row)}`.trim())
}
