import type { Angelcare360FoundationDomain, Angelcare360FoundationPlane } from '@/types/angelcare360/customer-foundation'

export const ANGELCARE360_FOUNDATION_PLANES: Record<Angelcare360FoundationDomain, Angelcare360FoundationPlane[]> = {
  direction: [
    { key: 'today', label: "Aujourd’hui", description: 'Priorités et décisions immédiates', href: '/angelcare-360-command-center/direction?plane=today' },
    { key: 'network', label: 'Réseau', description: 'Institutions, structure et capacité', href: '/angelcare-360-command-center/direction?plane=network' },
    { key: 'decisions', label: 'Décisions', description: 'Arbitrages et validations', href: '/angelcare-360-command-center/direction?plane=decisions' },
    { key: 'risks', label: 'Risques', description: 'Exceptions, blocages et qualité', href: '/angelcare-360-command-center/direction?plane=risks' },
    { key: 'commitments', label: 'Engagements', description: 'Échéances et responsabilités', href: '/angelcare-360-command-center/direction?plane=commitments' },
    { key: 'performance', label: 'Performance', description: 'Lecture managériale consolidée', href: '/angelcare-360-command-center/direction?plane=performance' },
    { key: 'calendar', label: 'Calendrier', description: 'Rythme institutionnel', href: '/angelcare-360-command-center/direction?plane=calendar' },
    { key: 'audit', label: 'Audit', description: 'Chronologie de gouvernance', href: '/angelcare-360-command-center/direction?plane=audit' },
  ],
  governance: [
    { key: 'institutions', label: 'Institutions', description: 'Identité, statut et responsables', href: '/angelcare-360-command-center/administration?plane=institutions', permission: 'administration.view' },
    { key: 'academic-structure', label: 'Structure académique', description: 'Années, périodes et publication', href: '/angelcare-360-command-center/administration?plane=academic-structure', permission: 'administration.view' },
    { key: 'classes-capacity', label: 'Classes & capacité', description: 'Sections, remplissage et disponibilité', href: '/angelcare-360-command-center/administration?plane=classes-capacity', permission: 'classes.view' },
    { key: 'subjects', label: 'Matières', description: 'Référentiel et couverture', href: '/angelcare-360-command-center/administration?plane=subjects', permission: 'academics.view' },
    { key: 'assignments', label: 'Affectations', description: 'Enseignants, classes et périodes', href: '/angelcare-360-command-center/administration?plane=assignments', permission: 'academics.view' },
    { key: 'roles-permissions', label: 'Rôles & permissions', description: 'Autorités tenant maîtrisées', href: '/angelcare-360-command-center/administration?plane=roles-permissions', permission: 'roles.view' },
    { key: 'settings', label: 'Paramètres', description: 'Configuration autorisée au tenant', href: '/angelcare-360-command-center/administration?plane=settings', permission: 'settings.view' },
    { key: 'audit', label: 'Audit', description: 'Traçabilité institutionnelle', href: '/angelcare-360-command-center/administration?plane=audit', permission: 'audit.view' },
  ],
  people: [
    { key: 'registry', label: 'Registre', description: 'Identités canoniques et multi-rôles', href: '/angelcare-360-command-center/personnes?plane=registry', permission: 'eleves.view' },
    { key: 'students', label: 'Élèves', description: 'Scolarité, classes et responsables', href: '/angelcare-360-command-center/personnes?plane=students', permission: 'eleves.view' },
    { key: 'families', label: 'Familles', description: 'Parents, autorité et urgences', href: '/angelcare-360-command-center/personnes?plane=families', permission: 'parents.view' },
    { key: 'teachers', label: 'Enseignants', description: 'Matières, classes et accès', href: '/angelcare-360-command-center/personnes?plane=teachers', permission: 'enseignants.view' },
    { key: 'personnel', label: 'Personnel', description: 'Fonctions, accès et conformité', href: '/angelcare-360-command-center/personnes?plane=personnel', permission: 'personnel.view' },
    { key: 'relationships', label: 'Relations', description: 'Familles et responsabilités', href: '/angelcare-360-command-center/personnes?plane=relationships', permission: 'parents.view' },
    { key: 'documents', label: 'Documents', description: 'Pièces, conformité et échéances', href: '/angelcare-360-command-center/personnes?plane=documents', permission: 'documents.view' },
    { key: 'data-quality', label: 'Qualité des données', description: 'Doublons et dossiers incomplets', href: '/angelcare-360-command-center/personnes?plane=data-quality', permission: 'eleves.view' },
    { key: 'audit', label: 'Audit', description: 'Chronologie et preuves', href: '/angelcare-360-command-center/personnes?plane=audit', permission: 'audit.view' },
  ],
  admissions: [
    { key: 'pipeline', label: 'Pipeline', description: 'Flux de candidature gouverné', href: '/angelcare-360-command-center/admissions?plane=pipeline', entitlementKey: 'admissions' },
    { key: 'applications', label: 'Demandes', description: 'Qualification et responsabilité', href: '/angelcare-360-command-center/admissions?plane=applications', entitlementKey: 'admissions' },
    { key: 'dossiers', label: 'Dossiers', description: 'Préparation et complétude', href: '/angelcare-360-command-center/admissions?plane=dossiers', entitlementKey: 'admissions' },
    { key: 'interviews', label: 'Entretiens', description: 'Planification et évaluation', href: '/angelcare-360-command-center/admissions?plane=interviews', entitlementKey: 'admissions' },
    { key: 'documents', label: 'Documents', description: 'Pièces, validation et remplacement', href: '/angelcare-360-command-center/admissions?plane=documents', entitlementKey: 'admissions' },
    { key: 'decisions', label: 'Décisions', description: 'Autorité et conditions', href: '/angelcare-360-command-center/admissions?plane=decisions', entitlementKey: 'admissions' },
    { key: 'conversions', label: 'Conversions', description: 'Création contrôlée des dossiers', href: '/angelcare-360-command-center/admissions?plane=conversions', entitlementKey: 'admissions' },
    { key: 'audit', label: 'Audit', description: 'Historique et conformité', href: '/angelcare-360-command-center/admissions?plane=audit', entitlementKey: 'admissions' },
  ],
}

export function resolveAngelcare360FoundationPlane(domain: Angelcare360FoundationDomain, requested?: string | null) {
  const planes = ANGELCARE360_FOUNDATION_PLANES[domain]
  return planes.some((plane) => plane.key === requested) ? String(requested) : planes[0].key
}
