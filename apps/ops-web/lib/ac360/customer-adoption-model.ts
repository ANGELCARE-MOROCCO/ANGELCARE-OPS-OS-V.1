import type { Ac360CustomerLiveCockpit } from './customer-live-data'
import { ac360CustomerModules } from './customer-ui-model'

export type Ac360CustomerAdoptionSignalTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'

export type Ac360CustomerPersonalizationProfile = {
  key: string
  label: string
  mission: string
  homePromise: string
  preferredDensity: 'dense' | 'balanced' | 'guided'
  primaryModules: string[]
  quickActions: string[]
  hiddenUntilNeeded: string[]
  governanceReminder: string
}

export type Ac360CustomerTourStep = {
  key: string
  title: string
  description: string
  anchor: string
  expectedOutcome: string
  ownerRole: string
  billableSignal: string
}

export type Ac360GuidedEmptyState = {
  moduleKey: string
  title: string
  description: string
  firstAction: string
  secondAction: string
  proofSignal: string
  monetizationSignal: string
  recoveryPath: string
}

export type Ac360AdoptionIntelligenceSignal = {
  key: string
  label: string
  value: string
  detail: string
  tone: Ac360CustomerAdoptionSignalTone
  nextAction: string
}

export const ac360CustomerPersonalizationProfiles: Ac360CustomerPersonalizationProfile[] = [
  {
    key: 'direction',
    label: 'Direction / Propriétaire',
    mission: 'Piloter la santé business, les risques, les revenus, la confiance parent et l’exécution quotidienne sans se perdre dans les écrans.',
    homePromise: 'Cockpit direction, alertes critiques, décisions prioritaires, facturation, croissance et gouvernance.',
    preferredDensity: 'dense',
    primaryModules: ['command-center', 'finance', 'admissions', 'parenttrust', 'billing-growth'],
    quickActions: ['Voir les risques du jour', 'Relancer créances', 'Inspecter prospects chauds', 'Traiter réclamation critique'],
    hiddenUntilNeeded: ['academy', 'branding', 'automation'],
    governanceReminder: 'La Direction voit les preuves, restrictions, limites et recommandations d’upgrade avant toute action sensible.',
  },
  {
    key: 'finance',
    label: 'Responsable Finance',
    mission: 'Accélérer l’encaissement, réduire les impayés, contrôler les promesses de paiement et garder une preuve claire des relances.',
    homePromise: 'Finance, créances, factures, paiements, relances, promesses et restrictions compte.',
    preferredDensity: 'dense',
    primaryModules: ['finance', 'billing-growth', 'communication', 'workflows'],
    quickActions: ['Émettre facture', 'Relancer familles en retard', 'Créer promesse paiement', 'Exporter créances'],
    hiddenUntilNeeded: ['transport', 'safety', 'academy'],
    governanceReminder: 'Chaque relance ou facture affiche le coût crédit, le droit d’usage et la référence preuve.',
  },
  {
    key: 'admissions',
    label: 'Admissions / Commercial',
    mission: 'Transformer les demandes parents en visites, offres et inscriptions avec suivi clair, valeur mensuelle estimée et relances guidées.',
    homePromise: 'Pipeline prospects, visites, offres, candidatures, doublons et conversion élèves.',
    preferredDensity: 'balanced',
    primaryModules: ['admissions', 'intake', 'communication', 'students-families'],
    quickActions: ['Créer lead', 'Planifier visite', 'Envoyer offre', 'Scanner doublons'],
    hiddenUntilNeeded: ['finance', 'hr', 'transport'],
    governanceReminder: 'Les leads convertis gardent l’historique commercial, la source et les preuves de consentement.',
  },
  {
    key: 'teacher',
    label: 'Enseignant / Classe',
    mission: 'Exécuter vite les opérations terrain : présence, observations, incidents, demandes parents et tâches de classe.',
    homePromise: 'Présence, classe, tâches rapides, incidents et actions mobiles.',
    preferredDensity: 'guided',
    primaryModules: ['attendance', 'classes', 'students-families', 'safety'],
    quickActions: ['Marquer présence', 'Signaler incident', 'Ajouter note classe', 'Ouvrir dossier élève'],
    hiddenUntilNeeded: ['billing-growth', 'finance', 'branding'],
    governanceReminder: 'Les actions terrain restent simples mais journalisées avec preuve, rôle et horodatage.',
  },
  {
    key: 'success',
    label: 'AngelCare Success',
    mission: 'Accompagner les écoles, détecter les comptes à risque, guider l’adoption et activer les modules utiles au bon moment.',
    homePromise: 'Adoption, onboarding, santé compte, restrictions, expansion et accompagnement client.',
    preferredDensity: 'dense',
    primaryModules: ['onboarding', 'billing-growth', 'parenttrust', 'automation', 'command-center'],
    quickActions: ['Voir adoption', 'Créer plan d’accompagnement', 'Lever blocage', 'Recommander add-on'],
    hiddenUntilNeeded: ['transport', 'safety'],
    governanceReminder: 'Le Success voit les signaux d’adoption, les blocages et les opportunités d’expansion sans masquer la gouvernance.',
  },
]

export const ac360CustomerOnboardingTourSteps: Ac360CustomerTourStep[] = [
  {
    key: 'cockpit-first-brief',
    title: 'Lire le brief directeur',
    description: 'Commencer par les risques, les priorités, la santé de l’établissement et les recommandations du jour.',
    anchor: 'command-center',
    expectedOutcome: 'Le décideur comprend immédiatement ce qui mérite son attention.',
    ownerRole: 'Direction',
    billableSignal: 'Aucun coût : lecture cockpit incluse dans le plan.',
  },
  {
    key: 'module-universe',
    title: 'Explorer les modules gouvernés',
    description: 'Identifier ce qui est inclus, add-on, à l’usage, limité ou recommandé selon le plan.',
    anchor: 'module-universe',
    expectedOutcome: 'Le client comprend la valeur et les limites sans friction commerciale.',
    ownerRole: 'Direction / Success',
    billableSignal: 'Growth Menu visible avec prix, droits et préservation de données.',
  },
  {
    key: 'smart-command',
    title: 'Utiliser la commande intelligente',
    description: 'Rechercher un dossier, une action, une restriction ou une commande sans naviguer dans tout le système.',
    anchor: 'smart-command-center',
    expectedOutcome: 'Réduction du temps de recherche et meilleure adoption opérationnelle.',
    ownerRole: 'Tous rôles',
    billableSignal: 'Certaines actions lancées depuis la commande peuvent consommer crédits ou add-ons.',
  },
  {
    key: 'guided-action',
    title: 'Exécuter une action gardée',
    description: 'Ouvrir une commande, vérifier le pré-vol AC360, corriger les champs puis exécuter avec preuve.',
    anchor: 'actions',
    expectedOutcome: 'L’utilisateur comprend pourquoi une action est autorisée, bloquée ou facturée.',
    ownerRole: 'Finance / Admissions / Direction',
    billableSignal: 'Pré-vol : plan, usage, crédits, restriction et référence preuve.',
  },
  {
    key: 'adoption-loop',
    title: 'Installer une routine d’adoption',
    description: 'Sauvegarder des vues, suivre les signaux faibles, résoudre les états vides et planifier la prochaine routine.',
    anchor: 'adoption-intelligence',
    expectedOutcome: 'L’école transforme AC360 en rituel de management quotidien.',
    ownerRole: 'Direction / Success',
    billableSignal: 'Les recommandations d’upgrade restent explicites et non forcées.',
  },
]

export const ac360GuidedEmptyStates: Ac360GuidedEmptyState[] = [
  {
    moduleKey: 'finance',
    title: 'Aucune créance visible pour l’instant',
    description: 'Commencez par importer ou créer les comptes familles, puis émettre les premières factures pour activer les tableaux de relance.',
    firstAction: 'Créer une facture test',
    secondAction: 'Ouvrir modèle de relance parent',
    proofSignal: 'Chaque facture créée génère une référence preuve et un événement usage.',
    monetizationSignal: 'Relances WhatsApp/SMS peuvent consommer crédits selon le canal.',
    recoveryPath: 'Si le module est verrouillé, activer Finance avancée ou passer au plan Command.',
  },
  {
    moduleKey: 'admissions',
    title: 'Pipeline admissions encore vide',
    description: 'Ajoutez un premier lead ou connectez un formulaire public pour commencer à mesurer les visites, offres et conversions.',
    firstAction: 'Créer lead admissions',
    secondAction: 'Publier formulaire demande inscription',
    proofSignal: 'Source, consentement, statut et prochaine relance sont conservés dans la timeline.',
    monetizationSignal: 'Les formulaires publics peuvent dépendre d’un add-on Growth Menu.',
    recoveryPath: 'Si aucune source n’est active, créer une source manuelle puis scanner les doublons.',
  },
  {
    moduleKey: 'attendance',
    title: 'Aucune session présence ouverte',
    description: 'Ouvrez la session du jour pour voir les absences, retards, corrections et alertes classe.',
    firstAction: 'Ouvrir session présence',
    secondAction: 'Afficher élèves sans pointage',
    proofSignal: 'Chaque pointage porte heure, rôle, statut, correction et trace audit.',
    monetizationSignal: 'Présence de base incluse, automatisations avancées possibles en add-on.',
    recoveryPath: 'Si bloqué, vérifier la période active, le campus et les règles de présence.',
  },
  {
    moduleKey: 'students-families',
    title: 'Le registre élèves doit être enrichi',
    description: 'Créez les premières fiches élèves avec tuteurs, documents, santé, classe et facturation liée.',
    firstAction: 'Créer élève',
    secondAction: 'Lier responsable légal',
    proofSignal: 'Le dossier élève devient le point central pour présence, finance, santé, transport et ParentTrust.',
    monetizationSignal: 'Les limites de capacité élèves dépendent du plan souscrit.',
    recoveryPath: 'Si la capacité est atteinte, acheter capacité ou passer au plan supérieur.',
  },
  {
    moduleKey: 'parenttrust',
    title: 'ParentTrust attend ses premiers signaux',
    description: 'Ouvrez une réclamation, lancez une enquête ou planifiez un rendez-vous pour commencer à mesurer la confiance parent.',
    firstAction: 'Ouvrir réclamation ParentTrust',
    secondAction: 'Lancer enquête satisfaction',
    proofSignal: 'Chaque plainte possède statut, responsable, timeline, accusé parent et résolution.',
    monetizationSignal: 'ParentTrust avancé peut être activé comme add-on mensuel.',
    recoveryPath: 'Si réclamation critique, assigner propriétaire et créer tâche de suivi.',
  },
  {
    moduleKey: 'billing-growth',
    title: 'Le Growth Menu doit devenir votre console d’expansion',
    description: 'Inspectez les add-ons actifs, limites, crédits, données préservées et recommandations d’upgrade.',
    firstAction: 'Inspecter add-ons recommandés',
    secondAction: 'Acheter crédits ou activer pack Sérénité',
    proofSignal: 'Activation, annulation et préservation de données restent visibles dans la gouvernance.',
    monetizationSignal: 'Chaque add-on affiche prix, valeur, conditions et impact usage.',
    recoveryPath: 'Si compte restreint, résoudre paiement ou contacter AngelCare Success.',
  },
]

export function getAc360PersonalizationProfile(labelOrKey?: string) {
  const normalized = String(labelOrKey || '').toLowerCase()
  return ac360CustomerPersonalizationProfiles.find((profile) => normalized.includes(profile.key) || normalized.includes(profile.label.toLowerCase())) || ac360CustomerPersonalizationProfiles[0]
}

export function getAc360GuidedEmptyState(moduleKey?: string) {
  const normalized = moduleKey || 'command-center'
  return ac360GuidedEmptyStates.find((state) => state.moduleKey === normalized) || {
    moduleKey: normalized,
    title: 'Données en préparation contrôlée',
    description: 'Le module peut fonctionner en fallback sécurisé pendant que les premières données opérationnelles arrivent.',
    firstAction: 'Créer la première action gardée',
    secondAction: 'Consulter les recommandations',
    proofSignal: 'Les preuves apparaîtront dans la timeline dès les premières exécutions.',
    monetizationSignal: 'Les droits, crédits et add-ons restent visibles même en état vide.',
    recoveryPath: 'Vérifier les droits module, le campus actif et le statut du plan.',
  }
}

export function buildAc360AdoptionSignals(live: Ac360CustomerLiveCockpit | null, activeModuleKey?: string): Ac360AdoptionIntelligenceSignal[] {
  const connectedEndpoints = live?.endpointResults?.filter((endpoint) => endpoint.ok).length || 0
  const totalEndpoints = live?.endpointResults?.length || 20
  const coverage = totalEndpoints ? Math.round((connectedEndpoints / totalEndpoints) * 100) : 0
  const module = ac360CustomerModules.find((item) => item.key === activeModuleKey)
  const moduleScore = module?.healthScore || 72
  const creditPercent = live?.billing?.creditPercent ?? 82
  const restrictions = live?.billing?.restrictionCount ?? 0

  return [
    {
      key: 'adoption-score',
      label: 'Score adoption client',
      value: `${Math.min(96, Math.max(42, Math.round((coverage + moduleScore + creditPercent) / 3)))}%`,
      detail: 'Mesure synthétique : couverture runtime, usage cockpit, module actif et discipline d’exécution.',
      tone: 'blue',
      nextAction: 'Transformer les recommandations en routines hebdomadaires.',
    },
    {
      key: 'runtime-coverage',
      label: 'Couverture runtime',
      value: `${coverage}%`,
      detail: `${connectedEndpoints}/${totalEndpoints} endpoints disponibles ou en fallback contrôlé.`,
      tone: coverage >= 80 ? 'emerald' : coverage >= 55 ? 'amber' : 'rose',
      nextAction: 'Vérifier les modules en fallback avant formation client.',
    },
    {
      key: 'guided-readiness',
      label: 'Guidage utilisateur',
      value: module ? 'personnalisé' : 'global',
      detail: module ? `Parcours adapté au module ${module.label}.` : 'Parcours global cockpit direction.',
      tone: 'violet',
      nextAction: 'Lancer le tour guidé du rôle actif.',
    },
    {
      key: 'commercial-friction',
      label: 'Friction commerciale',
      value: restrictions ? `${restrictions} signaux` : 'faible',
      detail: 'Restrictions, crédits bas, add-ons recommandés et modules verrouillés sont expliqués au lieu d’être cachés.',
      tone: restrictions ? 'amber' : 'emerald',
      nextAction: 'Traiter les blocages ou proposer un pack Sérénité.',
    },
  ]
}
