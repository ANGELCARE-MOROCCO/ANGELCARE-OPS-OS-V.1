import { ac360CustomerModules, type Ac360CustomerModule } from './customer-ui-model'

export type Ac360DedicatedModuleRoute = {
  slug: string
  moduleKey: string
  label: string
  // UI doctrine: FR Maroc natif, thème blanc premium, gouvernance AC360 visible.
  eyebrow: string
  title: string
  promise: string
  endpoint: string
  businessQuestion: string
  primaryCommand: string
  secondaryCommand: string
  tertiaryCommand: string
  inPageNav: string[]
  kpis: Array<{ label: string; value: string; detail: string; tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate' }>
  operationalLanes: Array<{ label: string; count: number; detail: string; tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate' }>
  commandStack: Array<{ title: string; detail: string; guard: string; impact: string }>
  sections: Array<{ id: string; label: string; title: string; description: string; bullets: string[] }>
  governance: string[]
  monetization: string[]
  emptyState: string
}

const baseRoute = (moduleKey: string, slug: string, label: string, endpoint: string): Ac360DedicatedModuleRoute => ({
  slug,
  moduleKey,
  label,
  eyebrow: 'Espace opérationnel dédié · Client Maroc',
  title: `${label} · poste de pilotage détaillé`,
  promise: 'Un espace français natif, gouverné par les droits AC360, prêt pour données live, actions contextuelles, preuves, audit et facturation.',
  endpoint,
  businessQuestion: 'Quelle décision doit être prise maintenant, par qui, avec quel risque, quel coût usage et quelle preuve ? ',
  primaryCommand: 'Créer action gouvernée',
  secondaryCommand: 'Filtrer risques',
  tertiaryCommand: 'Exporter avec audit',
  inPageNav: ['Vue exécutive', 'File opérationnelle', 'Actions', 'Chronologie', 'Facturation & droits', 'Audit'],
  kpis: [
    { label: 'Santé module', value: '88%', detail: 'score opérationnel calculé live/fallback', tone: 'blue' },
    { label: 'Actions ouvertes', value: '24', detail: 'dossiers à traiter par priorité', tone: 'amber' },
    { label: 'Risque critique', value: '1', detail: 'éléments nécessitant escalade', tone: 'rose' },
    { label: 'Automatisable', value: '9', detail: 'actions candidates aux workflows', tone: 'emerald' },
  ],
  operationalLanes: [
    { label: 'Nouveau', count: 8, detail: 'entrées reçues ou créées', tone: 'blue' },
    { label: 'En cours', count: 14, detail: 'traitement staff ou direction', tone: 'amber' },
    { label: 'À valider', count: 5, detail: 'validation responsable requise', tone: 'violet' },
    { label: 'Clôturé', count: 32, detail: 'dossiers avec preuve/audit', tone: 'emerald' },
  ],
  commandStack: [
    { title: 'Pré-contrôle droits & plan', detail: 'Vérifier package, add-on, restrictions et usage avant action.', guard: 'entitlement + policy', impact: 'évite actions non facturées' },
    { title: 'Action opérationnelle', detail: 'Créer, valider, relancer, enregistrer ou escalader selon le module.', guard: 'guard execute', impact: 'traçabilité complète' },
    { title: 'Usage & preuve', detail: 'Crédits, journal d’activité, audit et recommandation Growth Menu après succès.', guard: 'usage + audit', impact: 'modèle billable vivant' },
  ],
  sections: [
    { id: 'vue-executive', label: 'Vue exécutive', title: 'Synthèse direction et signaux de santé', description: 'Lecture immédiate des priorités, risques, volumes et décisions attendues.', bullets: ['Score santé opérationnel', 'Alertes critiques', 'Recommandations prochain meilleur geste'] },
    { id: 'file-operationnelle', label: 'File opérationnelle', title: 'Table dense et sélection multi-dossiers', description: 'Vue conçue pour agir, filtrer, assigner, relancer, valider et exporter.', bullets: ['Filtres intelligents', 'Vues enregistrées', 'Actions contextuelles'] },
    { id: 'actions', label: 'Actions', title: 'Commandes gardées par AC360', description: 'Chaque bouton sérieux reste relié à la doctrine : statut org, abonnement, droits, capacité, usage, audit.', bullets: ['Pré-vol action', 'Blocage expliqué', 'Upgrade ou top-up proposé'] },
    { id: 'chronologie', label: 'Chronologie', title: 'Preuves, événements et historique', description: 'Les preuves rassurent les directeurs, les parents et l’équipe AngelCare.', bullets: ['Timeline métier', 'Historique décision', 'Responsabilité claire'] },
    { id: 'facturation-droits', label: 'Facturation & droits', title: 'Couche commerciale visible mais élégante', description: 'Le module montre ce qui est inclus, add-on, à l’usage ou réservé Command/Entreprise.', bullets: ['Plan requis', 'Crédits consommés', 'Préservation données'] },
    { id: 'audit', label: 'Audit', title: 'Confiance entreprise et gouvernance', description: 'Chaque action sensible doit être justifiable, retrouvable et contrôlée.', bullets: ['Logs', 'Restrictions', 'Contrôles rôles'] },
  ],
  governance: ['Droits vérifiés avant action', 'Usage enregistré après succès', 'Blocage expliqué en français', 'Données préservées après annulation add-on'],
  monetization: ['Plan Start / Pro / Command visible', 'Add-on Growth Menu recommandé si valeur détectée', 'Crédits et limites affichés sans friction'],
  emptyState: 'Aucune donnée critique. L’espace reste prêt pour onboarding, import, première action ou activation add-on.',
})

export const ac360DedicatedModuleRoutes: Ac360DedicatedModuleRoute[] = [
  {
    ...baseRoute('command-center', 'cockpit-direction', 'Cockpit de Direction', '/api/ac360/phase2-final-lock/dashboard'),
    title: 'Cockpit de Direction · brief live, risques, décisions et croissance',
    businessQuestion: 'Quelle décision la direction doit-elle prendre aujourd’hui pour protéger l’école, les parents, le cash-flow et la réputation ?',
    primaryCommand: 'Lancer brief direction',
    secondaryCommand: 'Voir risques critiques',
    tertiaryCommand: 'Préparer rapport direction',
    inPageNav: ['Brief du jour', 'Santé école', 'Risques', 'Validations', 'Croissance', 'Usage & plan', 'Audit'],
  },
  {
    ...baseRoute('students-families', 'eleves-familles', 'Élèves & Familles', '/api/ac360/school-ops/summary'),
    title: 'Élèves & Familles · dossier 360 complet et actionnable',
    businessQuestion: 'Quel enfant ou quelle famille nécessite une action administrative, financière, santé, document ou parentale ?',
    primaryCommand: 'Créer élève',
    secondaryCommand: 'Contrôler dossiers incomplets',
    tertiaryCommand: 'Importer familles',
    inPageNav: ['Vue 360', 'Élèves', 'Familles', 'Documents', 'Santé', 'Facturation', 'Timeline', 'Audit'],
  },
  {
    ...baseRoute('attendance', 'presence-operations', 'Présence & Opérations du Jour', '/api/ac360/school-attendance/dashboard'),
    title: 'Présence & Opérations du Jour · daybook, corrections et clôture',
    businessQuestion: 'La journée est-elle correctement ouverte, suivie, corrigée et clôturée avec preuve ?',
    primaryCommand: 'Ouvrir session',
    secondaryCommand: 'Valider corrections',
    tertiaryCommand: 'Clôturer journée',
    inPageNav: ['Aujourd’hui', 'Élèves', 'Staff', 'Corrections', 'Absences', 'Daybook', 'Rapports', 'Audit'],
    kpis: [
      { label: 'Présents', value: '142', detail: 'élèves présents live/fallback', tone: 'emerald' },
      { label: 'Absents', value: '11', detail: 'dont non justifiés', tone: 'amber' },
      { label: 'Corrections', value: '6', detail: 'à valider par responsable', tone: 'rose' },
      { label: 'Clôture', value: '18:00', detail: 'session à fermer avec audit', tone: 'blue' },
    ],
  },
  {
    ...baseRoute('finance', 'finance-creances', 'Finance & Créances', '/api/ac360/school-finance/dashboard'),
    title: 'Finance & Créances · cash-flow, impayés, promesses et relances',
    businessQuestion: 'Quelles familles doivent être relancées maintenant, quel montant est à risque et quelle action protège la trésorerie ?',
    primaryCommand: 'Émettre facture',
    secondaryCommand: 'Envoyer relance',
    tertiaryCommand: 'Réconcilier créances',
    inPageNav: ['Vue cash-flow', 'Factures', 'Paiements', 'Créances', 'Promesses', 'Ajustements', 'Automatisations', 'Audit'],
    kpis: [
      { label: 'Facturé', value: '184 000 MAD', detail: 'cycle mensuel en cours', tone: 'blue' },
      { label: 'Encaissé', value: '139 000 MAD', detail: 'paiements affectés', tone: 'emerald' },
      { label: 'Impayés', value: '31 500 MAD', detail: '18 familles à risque', tone: 'rose' },
      { label: 'Promesses', value: '12 000 MAD', detail: 'suivi à confirmer', tone: 'amber' },
    ],
    monetization: ['Finance Power recommandé si impayés récurrents', 'Relances WhatsApp/SMS consomment crédits', 'Rapports PDF/export soumis au plan'],
  },
  {
    ...baseRoute('admissions', 'admissions-crm', 'Admissions CRM', '/api/ac360/school-admissions/dashboard'),
    title: 'Admissions CRM · leads, visites, offres, dossiers et conversion',
    businessQuestion: 'Quel prospect chaud doit être relancé maintenant et quelle valeur d’inscription est à protéger ?',
    primaryCommand: 'Créer lead',
    secondaryCommand: 'Planifier visite',
    tertiaryCommand: 'Générer offre',
    inPageNav: ['Pipeline', 'Leads', 'Visites', 'Suivis', 'Offres', 'Dossiers', 'Conversion', 'Imports', 'Audit'],
    kpis: [
      { label: 'Leads ouverts', value: '18', detail: '6 chauds à traiter', tone: 'blue' },
      { label: 'Visites', value: '4', detail: 'planifiées cette semaine', tone: 'amber' },
      { label: 'Offres', value: '3', detail: 'en attente décision', tone: 'violet' },
      { label: 'Pipeline', value: '42 000 MAD/mois', detail: 'valeur estimée', tone: 'emerald' },
    ],
  },
  {
    ...baseRoute('communication', 'communication-centre', 'Centre de Communication', '/api/ac360/school-communication/dashboard'),
    title: 'Centre de Communication · messages, campagnes, modèles et consentements',
    primaryCommand: 'Composer message',
    secondaryCommand: 'Créer campagne',
    tertiaryCommand: 'Vérifier livraisons',
    inPageNav: ['Inbox', 'Campagnes', 'Modèles', 'Segments', 'Consentements', 'Livraison', 'Analytics', 'Audit'],
  },
  {
    ...baseRoute('documents', 'documents-rapports', 'Documents, Rapports & Stockage', '/api/ac360/school-documents/dashboard'),
    title: 'Documents, Rapports & Stockage · preuve, versioning, exports et limites',
    primaryCommand: 'Enregistrer document',
    secondaryCommand: 'Générer rapport',
    tertiaryCommand: 'Réconcilier stockage',
    inPageNav: ['Documents', 'Dossiers', 'Versions', 'Revues', 'Rapports', 'Exports', 'Stockage', 'Audit'],
  },
  {
    ...baseRoute('workflows', 'taches-workflows', 'Tâches, Validations & Workflows', '/api/ac360/school-workflows/dashboard'),
    title: 'Tâches, Validations & Workflows · exécution contrôlée et preuves',
    primaryCommand: 'Créer tâche',
    secondaryCommand: 'Demander validation',
    tertiaryCommand: 'Démarrer workflow',
    inPageNav: ['Boards', 'Mes tâches', 'Validations', 'Récurrentes', 'Workflows', 'Tickets', 'Rapports', 'Audit'],
  },
  {
    ...baseRoute('parenttrust', 'parenttrust', 'ParentTrust', '/api/ac360/school-parenttrust/dashboard'),
    title: 'ParentTrust · satisfaction, réclamations, rendez-vous et réputation',
    businessQuestion: 'Quel parent risque de perdre confiance et quelle action doit restaurer la relation ?',
    primaryCommand: 'Ouvrir réclamation',
    secondaryCommand: 'Lancer survey',
    tertiaryCommand: 'Planifier rendez-vous',
    inPageNav: ['Trust score', 'Surveys', 'Réclamations', 'Rendez-vous', 'Réputation', 'Témoignages', 'Rétention', 'Audit'],
    kpis: [
      { label: 'Satisfaction', value: '86%', detail: 'score ParentTrust', tone: 'emerald' },
      { label: 'Réclamations', value: '4', detail: '1 critique', tone: 'rose' },
      { label: 'RDV parents', value: '7', detail: 'à confirmer', tone: 'amber' },
      { label: 'Témoignages', value: '12', detail: 'réputation activable', tone: 'blue' },
    ],
  },
  {
    ...baseRoute('hr', 'rh-planning', 'RH, Planning & Congés', '/api/ac360/school-hr/dashboard'),
    title: 'RH, Planning & Congés · couverture staff, contrats, shifts et demandes',
    primaryCommand: 'Assigner shift',
    secondaryCommand: 'Valider congé',
    tertiaryCommand: 'Ouvrir staffing request',
    inPageNav: ['Staff', 'Contrats', 'Shifts', 'Planning', 'Congés', 'Staffing', 'Évaluations', 'Audit'],
  },
  {
    ...baseRoute('safety', 'sante-securite', 'Santé, Sécurité & Incidents', '/api/ac360/school-health-safety/dashboard'),
    title: 'Santé, Sécurité & Incidents · incidents, médicaments et pickup autorisé',
    primaryCommand: 'Déclarer incident',
    secondaryCommand: 'Enregistrer médicament',
    tertiaryCommand: 'Vérifier pickup',
    inPageNav: ['Santé', 'Contacts urgence', 'Médication', 'Incidents', 'Pickup', 'Checks', 'Alertes', 'Audit'],
  },
  {
    ...baseRoute('transport', 'transport-circuits', 'Transport & Circuits', '/api/ac360/school-transport/dashboard'),
    title: 'Transport & Circuits · véhicules, chauffeurs, routes, retards et sécurité',
    primaryCommand: 'Ouvrir route run',
    secondaryCommand: 'Enregistrer événement',
    tertiaryCommand: 'Clôturer circuit',
    inPageNav: ['Routes', 'Véhicules', 'Chauffeurs', 'Affectations', 'Runs', 'Retards', 'Sécurité', 'Audit'],
  },
  {
    ...baseRoute('billing-growth', 'facturation-growth-menu', 'Facturation & Growth Menu', '/api/ac360/billing-center'),
    title: 'Facturation & Growth Menu · plans, crédits, add-ons, restrictions et Sérénité',
    businessQuestion: 'Quels droits, crédits, modules et restrictions gouvernent l’expérience client et les revenus AngelCare ?',
    primaryCommand: 'Inspecter plan',
    secondaryCommand: 'Activer add-on',
    tertiaryCommand: 'Acheter crédits',
    inPageNav: ['Plan actuel', 'Usage', 'Crédits', 'Add-ons', 'Sérénité', 'Factures', 'Restrictions', 'Upgrade'],
    kpis: [
      { label: 'Plan', value: 'Command', detail: 'abonnement actif', tone: 'blue' },
      { label: 'Crédits', value: '82%', detail: 'solde mensuel', tone: 'amber' },
      { label: 'Add-ons', value: '9', detail: 'modules actifs', tone: 'emerald' },
      { label: 'Restrictions', value: '0', detail: 'aucun blocage dur', tone: 'slate' },
    ],
    monetization: ['Start / Pro / Command visibles', 'Growth Menu avec prix MAD et annulation', 'Sérénité comme abonnement confort', 'Données conservées en lecture seule après annulation'],
  },
]

export function getAc360DedicatedModuleRouteBySlug(slug: string): Ac360DedicatedModuleRoute | undefined {
  return ac360DedicatedModuleRoutes.find((route) => route.slug === slug)
}

export function getAc360DedicatedModuleRouteByModuleKey(moduleKey: string): Ac360DedicatedModuleRoute | undefined {
  return ac360DedicatedModuleRoutes.find((route) => route.moduleKey === moduleKey)
}

export function getAc360DedicatedModuleForRoute(route: Ac360DedicatedModuleRoute): Ac360CustomerModule {
  return ac360CustomerModules.find((module) => module.key === route.moduleKey) || ac360CustomerModules[0]
}

export const ac360PriorityDedicatedSlugs = ['finance-creances', 'admissions-crm', 'presence-operations', 'eleves-familles', 'parenttrust', 'facturation-growth-menu']
