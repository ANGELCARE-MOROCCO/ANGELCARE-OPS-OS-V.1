import { ac360CustomerModules, ac360RoleExperiences, type Ac360CustomerModule } from './customer-ui-model'
import { getAc360DedicatedModuleRouteByModuleKey } from './customer-module-routes'

export type Ac360CustomerPortalRoleKey =
  | 'direction'
  | 'finance'
  | 'admissions'
  | 'teacher'
  | 'success'
  | 'hr'
  | 'transport'
  | 'parenttrust'

export type Ac360PermissionLevel = 'principal' | 'visible' | 'limite' | 'verrouille'
export type Ac360MobileActionTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'

export type Ac360RolePortalMobileAction = {
  key: string
  label: string
  moduleKey: string
  intent: string
  guardSignal: string
  tone: Ac360MobileActionTone
}

export type Ac360RolePortalKpi = {
  label: string
  value: string
  detail: string
  tone: Ac360MobileActionTone
}

export type Ac360RolePortal = {
  key: Ac360CustomerPortalRoleKey
  label: string
  shortLabel: string
  headline: string
  mission: string
  homeModuleKey: string
  primaryModuleKeys: string[]
  secondaryModuleKeys: string[]
  restrictedModuleKeys: string[]
  permissionRules: string[]
  mobileActions: Ac360RolePortalMobileAction[]
  cockpitKpis: Ac360RolePortalKpi[]
  navigationPromise: string
  auditPromise: string
  billingPromise: string
}

const moduleHref = (moduleKey: string) => {
  const route = getAc360DedicatedModuleRouteByModuleKey(moduleKey)
  return route ? `/angelcare-360/customer/${route.slug}` : `/angelcare-360/customer#${moduleKey}`
}

export const ac360CustomerRolePortals: Ac360RolePortal[] = [
  {
    key: 'direction',
    label: 'Propriétaire / Direction',
    shortLabel: 'Direction',
    headline: 'Portail exécutif propriétaire : décisions, risques, cash-flow, parents, équipes et croissance.',
    mission: 'La direction ne voit pas une liste de modules. Elle voit une carte de décision : ce qui bloque, ce qui coûte, ce qui rapporte, ce qui protège la confiance et ce qui doit être validé aujourd’hui.',
    homeModuleKey: 'command-center',
    primaryModuleKeys: ['command-center', 'finance', 'admissions', 'parenttrust', 'attendance', 'billing-growth'],
    secondaryModuleKeys: ['students-families', 'classes', 'workflows', 'communication', 'documents', 'hr', 'safety', 'transport', 'academy', 'automation', 'branding-integrations', 'onboarding-success'],
    restrictedModuleKeys: [],
    permissionRules: [
      'Accès complet aux indicateurs exécutifs, aux risques et aux validations critiques.',
      'Actions financières sensibles soumises au pré-vol AC360 et à l’audit.',
      'Peut inspecter les add-ons, restrictions, crédits et recommandations Growth Menu.',
      'Peut déléguer les files opérationnelles sans perdre la visibilité de preuve.',
    ],
    mobileActions: [
      { key: 'daily-brief', label: 'Brief du jour', moduleKey: 'command-center', intent: 'Lire les urgences et décisions du jour', guardSignal: 'Lecture gouvernée', tone: 'blue' },
      { key: 'finance-risk', label: 'Créances', moduleKey: 'finance', intent: 'Voir les impayés critiques', guardSignal: 'Finance incluse / relances créditées', tone: 'amber' },
      { key: 'parent-risk', label: 'ParentTrust', moduleKey: 'parenttrust', intent: 'Traiter les plaintes critiques', guardSignal: 'Add-on / plan vérifié', tone: 'rose' },
      { key: 'growth', label: 'Growth Menu', moduleKey: 'billing-growth', intent: 'Inspecter plans, crédits et add-ons', guardSignal: 'Facturation visible', tone: 'violet' },
    ],
    cockpitKpis: [
      { label: 'Décisions', value: '12', detail: 'actions direction recommandées', tone: 'blue' },
      { label: 'Cash-flow', value: '31,5K MAD', detail: 'créances à risque', tone: 'amber' },
      { label: 'Confiance', value: '86%', detail: 'signal ParentTrust', tone: 'emerald' },
      { label: 'Restrictions', value: '0', detail: 'blocage dur détecté', tone: 'slate' },
    ],
    navigationPromise: 'Navigation globale dense, orientée décision, avec modules stratégiques en priorité.',
    auditPromise: 'Toutes les décisions sensibles gardent une preuve, un responsable et un historique.',
    billingPromise: 'La direction voit toujours plan, crédits, add-ons, limites, valeur et chemin d’upgrade.',
  },
  {
    key: 'finance',
    label: 'Responsable Finance',
    shortLabel: 'Finance',
    headline: 'Portail finance : factures, encaissements, créances, promesses, ajustements et relances.',
    mission: 'La finance doit protéger le cash-flow, éviter les oublis, contrôler les relances et garder la preuve de chaque décision.',
    homeModuleKey: 'finance',
    primaryModuleKeys: ['finance', 'billing-growth', 'communication', 'documents', 'workflows'],
    secondaryModuleKeys: ['students-families', 'command-center', 'admissions', 'parenttrust'],
    restrictedModuleKeys: ['safety', 'transport', 'academy'],
    permissionRules: [
      'Peut préparer les factures, paiements, promesses et relances selon droits.',
      'Les ajustements sensibles restent soumis à validation direction.',
      'Les campagnes WhatsApp/SMS affichent l’impact crédit avant envoi.',
      'La santé financière est visible sans exposer les zones RH/santé non nécessaires.',
    ],
    mobileActions: [
      { key: 'issue-invoice', label: 'Facturer', moduleKey: 'finance', intent: 'Émettre une facture ou inspecter un lot', guardSignal: 'Pré-vol facture', tone: 'blue' },
      { key: 'payment', label: 'Paiement', moduleKey: 'finance', intent: 'Enregistrer ou affecter un paiement', guardSignal: 'Audit paiement', tone: 'emerald' },
      { key: 'reminder', label: 'Relance', moduleKey: 'communication', intent: 'Préparer relance parent', guardSignal: 'Crédits communication', tone: 'amber' },
    ],
    cockpitKpis: [
      { label: 'Créances', value: '31,5K', detail: 'MAD en retard', tone: 'amber' },
      { label: 'Promesses', value: '7', detail: 'à suivre cette semaine', tone: 'blue' },
      { label: 'Relances', value: '12', detail: 'familles ciblées', tone: 'violet' },
      { label: 'Preuves', value: '100%', detail: 'actions auditables', tone: 'emerald' },
    ],
    navigationPromise: 'La finance voit d’abord argent, relances, preuves et restrictions de facturation.',
    auditPromise: 'Chaque action financière garde une référence preuve et une chronologie.',
    billingPromise: 'Les coûts de communication et les add-ons Finance Power sont exposés avant exécution.',
  },
  {
    key: 'admissions',
    label: 'Responsable Admissions',
    shortLabel: 'Admissions',
    headline: 'Portail admissions : leads, visites, offres, dossiers, conversion et valeur pipeline.',
    mission: 'L’admission doit convertir l’intérêt parent en inscription avec discipline commerciale, suivi et intelligence de revenu.',
    homeModuleKey: 'admissions',
    primaryModuleKeys: ['admissions', 'intake', 'communication', 'students-families', 'documents'],
    secondaryModuleKeys: ['command-center', 'finance', 'parenttrust', 'workflows'],
    restrictedModuleKeys: ['safety', 'transport', 'academy'],
    permissionRules: [
      'Peut créer leads, visites, suivis, offres et demandes de dossier.',
      'La conversion en élève reste gouvernée par droits, capacité et dossier minimum.',
      'Les imports et doublons doivent garder une preuve source.',
      'La valeur pipeline est visible pour la direction mais actionnable par admissions.',
    ],
    mobileActions: [
      { key: 'lead', label: 'Nouveau lead', moduleKey: 'admissions', intent: 'Créer un prospect parent', guardSignal: 'Pré-vol lead', tone: 'blue' },
      { key: 'visit', label: 'Visite', moduleKey: 'admissions', intent: 'Planifier une visite', guardSignal: 'Capacité / agenda', tone: 'emerald' },
      { key: 'followup', label: 'Relancer', moduleKey: 'communication', intent: 'Relancer un parent chaud', guardSignal: 'Crédits message', tone: 'amber' },
    ],
    cockpitKpis: [
      { label: 'Leads', value: '18', detail: 'ouverts', tone: 'blue' },
      { label: 'Chauds', value: '6', detail: 'sans prochaine action', tone: 'amber' },
      { label: 'Visites', value: '4', detail: 'planifiées', tone: 'emerald' },
      { label: 'Valeur', value: '42K', detail: 'MAD/mois potentiel', tone: 'violet' },
    ],
    navigationPromise: 'L’admissions voit pipeline, prochaine action, preuve source et conversion.',
    auditPromise: 'Chaque lead garde source, contact, suivi, offre et historique.',
    billingPromise: 'Les formulaires publics, imports et communications affichent usage et add-on applicable.',
  },
  {
    key: 'teacher',
    label: 'Éducatrice / Enseignant',
    shortLabel: 'Équipe classe',
    headline: 'Portail classe mobile : présence, notes, incidents, tâches et communication utile.',
    mission: 'L’équipe terrain doit exécuter vite sans être noyée dans l’administration : pointer, signaler, suivre, prouver.',
    homeModuleKey: 'attendance',
    primaryModuleKeys: ['attendance', 'students-families', 'classes', 'communication', 'safety', 'workflows'],
    secondaryModuleKeys: ['documents', 'parenttrust'],
    restrictedModuleKeys: ['finance', 'billing-growth', 'branding-integrations', 'onboarding-success'],
    permissionRules: [
      'Accès centré classe, présence, notes et incidents selon responsabilité.',
      'Pas d’accès direct aux créances, plans, add-ons ou réglages commerciaux.',
      'Les incidents et pickups exigent preuve et chronologie.',
      'Les actions mobiles sont pensées pour exécution rapide en situation réelle.',
    ],
    mobileActions: [
      { key: 'presence', label: 'Présence', moduleKey: 'attendance', intent: 'Pointer un élève / statut du jour', guardSignal: 'Session active', tone: 'emerald' },
      { key: 'incident', label: 'Incident', moduleKey: 'safety', intent: 'Déclarer incident', guardSignal: 'Preuve obligatoire', tone: 'rose' },
      { key: 'note', label: 'Note jour', moduleKey: 'communication', intent: 'Préparer message parent', guardSignal: 'Consentement / crédits', tone: 'blue' },
      { key: 'task', label: 'Tâche', moduleKey: 'workflows', intent: 'Clôturer une tâche classe', guardSignal: 'Audit tâche', tone: 'slate' },
    ],
    cockpitKpis: [
      { label: 'Présents', value: '142', detail: 'élèves pointés', tone: 'emerald' },
      { label: 'Corrections', value: '6', detail: 'à valider', tone: 'amber' },
      { label: 'Incidents', value: '1', detail: 'critique', tone: 'rose' },
      { label: 'Tâches', value: '9', detail: 'classe / jour', tone: 'blue' },
    ],
    navigationPromise: 'La vue enseignant privilégie mobile, rapidité et actions terrain.',
    auditPromise: 'Chaque présence, incident ou sortie parent conserve preuve et responsable.',
    billingPromise: 'Les notifications parent restent créditées et expliquées sans exposer le Growth Menu complet.',
  },
  {
    key: 'success',
    label: 'AngelCare Success',
    shortLabel: 'Success',
    headline: 'Portail AngelCare Success : portefeuille client, onboarding, support, déploiement et réussite nationale.',
    mission: 'AngelCare doit pouvoir suivre plusieurs écoles sans chaos : santé compte, risques, tickets, adoption, déploiement et expansion.',
    homeModuleKey: 'onboarding-success',
    primaryModuleKeys: ['onboarding-success', 'command-center', 'billing-growth', 'automation', 'branding-integrations', 'workflows'],
    secondaryModuleKeys: ['finance', 'admissions', 'parenttrust', 'communication', 'documents', 'academy'],
    restrictedModuleKeys: [],
    permissionRules: [
      'Vue portefeuille et réussite client avec signaux de risque et adoption.',
      'Support et déploiement pilotés par tickets, checks et preuves.',
      'Accès gouverné aux données client selon rôle AngelCare.',
      'Surface pensée pour un déploiement multi-villes au Maroc.',
    ],
    mobileActions: [
      { key: 'health-score', label: 'Score client', moduleKey: 'onboarding-success', intent: 'Calculer / inspecter santé compte', guardSignal: 'Interne AngelCare', tone: 'blue' },
      { key: 'support', label: 'Ticket', moduleKey: 'workflows', intent: 'Ouvrir une action support', guardSignal: 'SLA visible', tone: 'amber' },
      { key: 'billing', label: 'Compte', moduleKey: 'billing-growth', intent: 'Voir restrictions / plan', guardSignal: 'Gouvernance compte', tone: 'violet' },
    ],
    cockpitKpis: [
      { label: 'Comptes', value: '24', detail: 'portefeuille actif', tone: 'blue' },
      { label: 'Risques', value: '5', detail: 'à escalader', tone: 'amber' },
      { label: 'Onboarding', value: '78%', detail: 'avancement moyen', tone: 'emerald' },
      { label: 'Support', value: '9', detail: 'tickets ouverts', tone: 'rose' },
    ],
    navigationPromise: 'La vue AngelCare Success regroupe gouvernance client, adoption, support et expansion.',
    auditPromise: 'Chaque intervention AngelCare garde un événement, un ticket ou une preuve.',
    billingPromise: 'Les décisions de plan, restriction, add-on et renouvellement restent visibles et explicables.',
  },
]

export function getAc360RolePortalByLabel(label?: string) {
  const normalized = (label || '').toLowerCase()
  return ac360CustomerRolePortals.find((portal) => portal.label.toLowerCase() === normalized || portal.shortLabel.toLowerCase() === normalized) || ac360CustomerRolePortals[0]
}

export function getAc360RolePortalForModule(moduleKey: string) {
  return ac360CustomerRolePortals.find((portal) => portal.primaryModuleKeys.includes(moduleKey)) || ac360CustomerRolePortals[0]
}

export function getAc360RoleHomeHref(portal: Ac360RolePortal) {
  return moduleHref(portal.homeModuleKey)
}

export function getAc360RoleModulePermission(portal: Ac360RolePortal, moduleKey: string): Ac360PermissionLevel {
  if (portal.restrictedModuleKeys.includes(moduleKey)) return 'limite'
  if (portal.primaryModuleKeys.includes(moduleKey)) return 'principal'
  if (portal.secondaryModuleKeys.includes(moduleKey)) return 'visible'
  return 'verrouille'
}

export function getAc360RolePermissionLabel(level: Ac360PermissionLevel) {
  if (level === 'principal') return 'accès principal'
  if (level === 'visible') return 'visible'
  if (level === 'limite') return 'limité'
  return 'masqué / verrouillé'
}

export function getAc360RolePermissionTone(level: Ac360PermissionLevel): Ac360MobileActionTone {
  if (level === 'principal') return 'emerald'
  if (level === 'visible') return 'blue'
  if (level === 'limite') return 'amber'
  return 'slate'
}

export function getAc360RoleVisibleModules(portal: Ac360RolePortal): Array<Ac360CustomerModule & { permission: Ac360PermissionLevel; href: string }> {
  return ac360CustomerModules
    .map((module) => ({ ...module, permission: getAc360RoleModulePermission(portal, module.key), href: moduleHref(module.key) }))
    .filter((module) => module.permission !== 'verrouille')
    .sort((a, b) => {
      const order: Record<Ac360PermissionLevel, number> = { principal: 0, visible: 1, limite: 2, verrouille: 3 }
      return order[a.permission] - order[b.permission]
    })
}

export function getAc360RoleMobileActions(portal: Ac360RolePortal, activeModuleKey?: string) {
  const activeActions = portal.mobileActions.filter((action) => !activeModuleKey || action.moduleKey === activeModuleKey)
  const actions = activeActions.length >= 2 ? activeActions : portal.mobileActions
  return actions.map((action) => ({ ...action, href: moduleHref(action.moduleKey) }))
}

export function getAc360RoleExperienceCoverage() {
  return ac360RoleExperiences.map((role) => {
    const portal = getAc360RolePortalByLabel(role.label)
    return {
      role: role.label,
      portal: portal.shortLabel,
      home: portal.homeModuleKey,
      primaryModules: portal.primaryModuleKeys.length,
      mobileActions: portal.mobileActions.length,
      permissionRules: portal.permissionRules.length,
    }
  })
}
