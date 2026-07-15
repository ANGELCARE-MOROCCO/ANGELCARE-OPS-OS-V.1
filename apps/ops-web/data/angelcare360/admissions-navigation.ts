import type { Angelcare360AdmissionsNavigationItem } from '@/types/angelcare360/admissions'

export const ANGELCARE360_ADMISSIONS_NAVIGATION: Angelcare360AdmissionsNavigationItem[] = [
  {
    key: 'overview',
    label: 'Vue d’ensemble',
    href: '/angelcare-360-command-center/admissions',
    summary: 'Cockpit admissions, préparation et risques opérationnels.',
    permission: 'admissions.view',
    badge: 'Centre',
  },
  {
    key: 'pipeline',
    label: 'Pipeline',
    href: '/angelcare-360-command-center/admissions/pipeline',
    summary: 'Flux des demandes et dossiers par étape réelle.',
    permission: 'admissions.view',
  },
  {
    key: 'demandes',
    label: 'Demandes',
    href: '/angelcare-360-command-center/admissions/demandes',
    summary: 'Prospects d’inscription, qualification et suivi.',
    permission: 'admissions.view',
  },
  {
    key: 'dossiers',
    label: 'Dossiers',
    href: '/angelcare-360-command-center/admissions/dossiers',
    summary: 'Applications, décisions et conversion.',
    permission: 'admissions.view',
  },
  {
    key: 'documents',
    label: 'Documents requis',
    href: '/angelcare-360-command-center/admissions/documents',
    summary: 'Référentiel documentaire et statuts des pièces.',
    permission: 'documents.view',
  },
  {
    key: 'entretiens',
    label: 'Entretiens / suivis',
    href: '/angelcare-360-command-center/admissions/entretiens',
    summary: 'Prochaines actions, rendez-vous et retards.',
    permission: 'admissions.view',
  },
  {
    key: 'conversions',
    label: 'Conversions',
    href: '/angelcare-360-command-center/admissions/conversions',
    summary: 'Vérification de conversion vers les dossiers personnes.',
    permission: 'admissions.approve',
  },
  {
    key: 'audit',
    label: 'Audit admissions',
    href: '/angelcare-360-command-center/admissions/audit',
    summary: 'Traçabilité des opérations admissions.',
    permission: 'audit.view',
  },
]

export const ANGELCARE360_ADMISSION_LEAD_STATUS_OPTIONS = [
  { label: 'Nouvelle demande', value: 'new' },
  { label: 'À contacter', value: 'contacted' },
  { label: 'Qualifiée', value: 'qualified' },
  { label: 'Dossier ouvert', value: 'application_open' },
  { label: 'Convertie', value: 'converted' },
  { label: 'Archivée', value: 'archived' },
]

export const ANGELCARE360_ADMISSION_APPLICATION_STATUS_OPTIONS = [
  { label: 'Ouvert', value: 'open' },
  { label: 'En étude', value: 'in_review' },
  { label: 'Accepté', value: 'approved' },
  { label: 'Refusé', value: 'rejected' },
  { label: 'Liste d’attente', value: 'waitlisted' },
  { label: 'Converti', value: 'converted' },
  { label: 'Archivé', value: 'archived' },
]

export const ANGELCARE360_ADMISSION_DOCUMENT_STATUS_OPTIONS = [
  { label: 'Requis', value: 'requis' },
  { label: 'En attente', value: 'en_attente' },
  { label: 'Reçu', value: 'recu' },
  { label: 'Validé', value: 'validé' },
  { label: 'Rejeté', value: 'rejete' },
  { label: 'Expiré', value: 'expire' },
]

export const ANGELCARE360_ADMISSION_REQUIRED_DOCUMENT_TEMPLATES = [
  { documentKey: 'extrait-acte-naissance', title: 'Extrait d’acte de naissance', description: 'Pièce d’état civil de l’enfant.' },
  { documentKey: 'cin-parent-tuteur', title: 'Copie CIN parent/tuteur', description: 'Pièce d’identité du responsable légal.' },
  { documentKey: 'carnet-vaccination', title: 'Carnet de vaccination', description: 'Carnet de santé / vaccination si requis.' },
  { documentKey: 'photo-identite', title: 'Photo d’identité', description: 'Photo récente de l’élève.' },
  { documentKey: 'certificat-medical', title: 'Certificat médical', description: 'Document médical si demandé.' },
  { documentKey: 'ancien-bulletin', title: 'Ancien bulletin', description: 'Bulletin antérieur si applicable.' },
  { documentKey: 'autorisation-sortie', title: 'Autorisation de sortie', description: 'Autorisation complémentaire si applicable.' },
]
