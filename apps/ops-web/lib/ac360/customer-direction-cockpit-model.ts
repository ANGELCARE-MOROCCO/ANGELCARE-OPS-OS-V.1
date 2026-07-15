
export type DirectionViewKey =
  | 'synthese'
  | 'operations'
  | 'finance'
  | 'admissions'
  | 'equipe'
  | 'securite'
  | 'parents'
  | 'rapports'
  | 'aujourdhui'
  | 'risques'
  | 'decisions'
  | 'transport'
  | 'automatisations'
  | 'gouvernance'

export type DirectionTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'cyan' | 'slate' | 'orange'

export type DirectionNavItem = {
  key: DirectionViewKey
  label: string
  shortLabel: string
  route: string
  signal: string
}

export type DirectionMetric = {
  label: string
  value: string
  trend: string
  tone: DirectionTone
  spark: number[]
  helper?: string
}

export type DirectionTableColumn = {
  key: string
  label: string
}

export type DirectionTableRow = {
  id: string
  cells: Record<string, string>
  tone?: DirectionTone
  status?: string
}

export type DirectionPanel = {
  title: string
  subtitle?: string
  action?: string
}

export const directionViews: DirectionNavItem[] = [
  { key: 'synthese', label: 'Vue exécutive', shortLabel: 'Vue exécutive', route: '/angelcare-360/customer/cockpit-direction', signal: 'Vision consolidée Direction' },
  { key: 'operations', label: 'Opérations & multi-sites', shortLabel: 'Opérations', route: '/angelcare-360/customer/cockpit-direction/operations', signal: 'Sites, capacité, transport et SLA' },
  { key: 'finance', label: 'Finance & rentabilité', shortLabel: 'Finance', route: '/angelcare-360/customer/cockpit-direction/finance', signal: 'CA, encaissements, impayés, marges' },
  { key: 'admissions', label: 'Admissions & croissance', shortLabel: 'Croissance', route: '/angelcare-360/customer/cockpit-direction/admissions', signal: 'Pipeline, campagnes, visites, inscriptions' },
  { key: 'equipe', label: 'RH & capacité', shortLabel: 'Équipe', route: '/angelcare-360/customer/cockpit-direction/equipe', signal: 'Staff, capacité, formation, recrutement' },
  { key: 'securite', label: 'Qualité, risques & conformité', shortLabel: 'Risque', route: '/angelcare-360/customer/cockpit-direction/securite', signal: 'Incidents, audits, plans d’action' },
  { key: 'parents', label: 'ParentTrust & expérience familles', shortLabel: 'Parents', route: '/angelcare-360/customer/cockpit-direction/parents', signal: 'Satisfaction, réclamations, réputation' },
  { key: 'rapports', label: 'Décisions, rapports & exports', shortLabel: 'Rapports', route: '/angelcare-360/customer/cockpit-direction/rapports', signal: 'Validations, exports et board packs' },
  { key: 'gouvernance', label: 'Gouvernance compte', shortLabel: 'Gouvernance', route: '/angelcare-360/customer/cockpit-direction/gouvernance', signal: 'Plan, crédits, restrictions, add-ons' },
]

export const directionSubRouteAliases: Record<string, DirectionViewKey> = {
  synthese: 'synthese',
  operations: 'operations',
  aujourdhui: 'operations',
  transport: 'operations',
  finance: 'finance',
  admissions: 'admissions',
  croissance: 'admissions',
  equipe: 'equipe',
  rh: 'equipe',
  securite: 'securite',
  risques: 'securite',
  parents: 'parents',
  parenttrust: 'parents',
  rapports: 'rapports',
  decisions: 'rapports',
  automatisations: 'gouvernance',
  gouvernance: 'gouvernance',
}

export function resolveDirectionView(view?: string): DirectionViewKey {
  if (!view) return 'synthese'
  return directionSubRouteAliases[view] || 'synthese'
}

export const directionSidebar = [
  {
    label: 'Cockpit de direction',
    route: '/angelcare-360/customer/cockpit-direction',
    icon: '◇',
    active: true,
    children: [
      { label: 'Vue exécutive', route: '/angelcare-360/customer/cockpit-direction' },
      { label: 'Opérations & multi-sites', route: '/angelcare-360/customer/cockpit-direction/operations' },
      { label: 'Finance & rentabilité', route: '/angelcare-360/customer/cockpit-direction/finance' },
      { label: 'Admissions & croissance', route: '/angelcare-360/customer/cockpit-direction/admissions' },
      { label: 'RH & capacité', route: '/angelcare-360/customer/cockpit-direction/equipe' },
      { label: 'Qualité, risques & conformité', route: '/angelcare-360/customer/cockpit-direction/securite' },
      { label: 'ParentTrust & expérience familles', route: '/angelcare-360/customer/cockpit-direction/parents' },
      { label: 'Décisions, rapports & exports', route: '/angelcare-360/customer/cockpit-direction/rapports' },
    ],
  },
  { label: 'Opérations', route: '/angelcare-360/customer/operations/aujourdhui', icon: '▦' },
  { label: 'Finance', route: '/angelcare-360/customer/finance-creances', icon: '◫' },
  { label: 'Admissions', route: '/angelcare-360/customer/admissions-crm', icon: '▣' },
  { label: 'RH', route: '/angelcare-360/customer/rh-planning', icon: '♙' },
  { label: 'Qualité & sécurité', route: '/angelcare-360/customer/sante-securite', icon: '♢' },
  { label: 'ParentTrust', route: '/angelcare-360/customer/parenttrust', icon: '♡' },
  { label: 'Transport', route: '/angelcare-360/customer/transport-circuits', icon: '▭' },
  { label: 'Rapports', route: '/angelcare-360/customer/documents-rapports', icon: '▤' },
  { label: 'Paramètres', route: '/angelcare-360/customer/facturation-growth-menu', icon: '⚙' },
]

export const executiveMetrics: DirectionMetric[] = [
  { label: "Chiffre d’affaires", value: '12,48 M MAD', trend: '▲ 12,6% vs avr. 2025', tone: 'blue', spark: [18, 24, 21, 29, 25, 34, 27, 39, 35, 43, 38, 48] },
  { label: 'Encaissements', value: '11,21 M MAD', trend: '▲ 10,3% vs avr. 2025', tone: 'emerald', spark: [16, 19, 26, 22, 31, 25, 35, 30, 37, 33, 42, 39] },
  { label: 'Impayés', value: '1,27 M MAD', trend: '▼ 8,5% vs avr. 2025', tone: 'rose', spark: [45, 42, 46, 39, 41, 34, 37, 30, 28, 32, 25, 23] },
  { label: "Taux d’occupation", value: '91,2%', trend: '▲ 2,4 pts vs avr. 2025', tone: 'violet', spark: [78, 82, 79, 85, 88, 84, 90, 86, 91, 88, 93, 91] },
  { label: 'Inscriptions (ce mois)', value: '186', trend: '▲ 14,1% vs avr. 2025', tone: 'cyan', spark: [20, 28, 25, 34, 31, 41, 37, 48, 43, 54, 50, 60] },
  { label: 'Satisfaction parents', value: '4,6 / 5', trend: '▲ 0,2 vs avr. 2025', tone: 'emerald', spark: [72, 74, 73, 76, 78, 77, 80, 79, 82, 83, 84, 86] },
  { label: 'Incidents critiques', value: '3', trend: '▼ 2 vs avr. 2025', tone: 'rose', spark: [42, 38, 40, 36, 32, 28, 30, 25, 22, 20, 19, 17] },
  { label: 'Disponibilité équipes', value: '95,4%', trend: '▲ 1,8 pts vs avr. 2025', tone: 'blue', spark: [78, 80, 79, 84, 83, 87, 85, 90, 89, 92, 94, 95] },
]

export const sitePerformanceRows: DirectionTableRow[] = [
  { id: 'casa-anfa', tone: 'emerald', status: 'Excellent', cells: { site: 'Casablanca Anfa', occupation: '95%', ca: '2,48 M', encaissements: '2,31 M', impayes: '170 K', satisfaction: '4,7' } },
  { id: 'rabat-agdal', tone: 'emerald', status: 'Bon', cells: { site: 'Rabat Agdal', occupation: '92%', ca: '1,86 M', encaissements: '1,67 M', impayes: '190 K', satisfaction: '4,6' } },
  { id: 'marrakech-gueliz', tone: 'amber', status: 'À surveiller', cells: { site: 'Marrakech Guéliz', occupation: '89%', ca: '1,42 M', encaissements: '1,26 M', impayes: '160 K', satisfaction: '4,5' } },
  { id: 'tanger-malabata', tone: 'amber', status: 'À surveiller', cells: { site: 'Tanger Malabata', occupation: '88%', ca: '1,18 M', encaissements: '1,02 M', impayes: '160 K', satisfaction: '4,4' } },
  { id: 'fes-atlas', tone: 'amber', status: 'Correct', cells: { site: 'Fès Atlas', occupation: '86%', ca: '0,98 M', encaissements: '0,86 M', impayes: '120 K', satisfaction: '4,4' } },
  { id: 'agadir-hay', tone: 'orange', status: 'Sous tension', cells: { site: 'Agadir Hay Mohammadi', occupation: '84%', ca: '0,88 M', encaissements: '0,75 M', impayes: '130 K', satisfaction: '4,3' } },
  { id: 'meknes-hamria', tone: 'rose', status: 'Prioritaire', cells: { site: 'Meknès Hamria', occupation: '82%', ca: '0,76 M', encaissements: '0,63 M', impayes: '130 K', satisfaction: '4,2' } },
]

export const operationMetrics: DirectionMetric[] = [
  { label: 'Taux occupation global', value: '91,2%', trend: '▲ 2,4 pts vs avr. 2025', tone: 'emerald', spark: [66, 68, 71, 69, 72, 74, 73, 77, 81, 78, 76, 80] },
  { label: 'Personnel présent', value: '186 / 204', trend: '91,2%', tone: 'blue', spark: [70, 74, 76, 72, 75, 78, 80, 79, 81, 83, 82, 84] },
  { label: 'Exécution services', value: '94,1%', trend: '▲ 2,3 pts vs avr. 2025', tone: 'emerald', spark: [72, 75, 78, 76, 80, 81, 79, 84, 86, 85, 88, 90] },
  { label: 'Ponctualité transport', value: '92,6%', trend: '▲ 1,8 pts vs avr. 2025', tone: 'blue', spark: [74, 76, 73, 78, 80, 79, 82, 84, 83, 87, 86, 89] },
  { label: 'Incidents ouverts', value: '28', trend: '▲ 6 vs avr. 2025', tone: 'rose', spark: [25, 22, 30, 28, 35, 31, 40, 36, 42, 38, 44, 46] },
  { label: 'Tâches en retard', value: '37', trend: '▲ 12 vs avr. 2025', tone: 'amber', spark: [18, 22, 20, 28, 24, 31, 30, 35, 39, 37, 42, 45] },
  { label: 'SLA respectés', value: '96,7%', trend: '▲ 2,1 pts vs avr. 2025', tone: 'emerald', spark: [76, 78, 79, 82, 81, 84, 86, 85, 90, 89, 92, 95] },
]

export const financeMetrics: DirectionMetric[] = [
  { label: "Chiffre d’affaires", value: '12,48 M MAD', trend: '▲ 14,3% vs avr. 2025', tone: 'blue', spark: [12, 19, 23, 29, 35, 42, 47, 56, 62, 70, 78, 86] },
  { label: 'Encaissements', value: '11,21 M MAD', trend: '▲ 10,3% vs avr. 2025', tone: 'emerald', spark: [14, 20, 25, 32, 38, 45, 51, 58, 66, 74, 82, 88] },
  { label: 'EBITDA', value: '2,34 M MAD', trend: '▲ 15,6% vs avr. 2025', tone: 'violet', spark: [28, 32, 30, 39, 35, 44, 43, 49, 54, 51, 58, 63] },
  { label: 'Marge EBITDA', value: '18,8%', trend: '▲ 1,8 pt vs avr. 2025', tone: 'violet', spark: [46, 50, 49, 55, 53, 58, 60, 57, 62, 64, 63, 66] },
  { label: 'Résultat net', value: '1,37 M MAD', trend: '▲ 12,1% vs avr. 2025', tone: 'emerald', spark: [20, 25, 24, 32, 30, 38, 35, 43, 45, 48, 50, 56] },
  { label: 'Trésorerie disponible', value: '8,72 M MAD', trend: '▲ 8,2% vs avr. 2025', tone: 'amber', spark: [62, 60, 64, 63, 66, 61, 65, 67, 64, 70, 68, 71] },
  { label: 'DSO (jours)', value: '26 jours', trend: '▼ 3 jours vs avr. 2025', tone: 'blue', spark: [56, 54, 50, 52, 48, 45, 42, 44, 40, 37, 35, 33] },
  { label: 'Impayés > 90 j', value: '1,27 M MAD', trend: '▲ 8,5% vs avr. 2025', tone: 'rose', spark: [24, 28, 27, 31, 35, 34, 39, 41, 45, 44, 48, 52] },
]

export const admissionsMetrics: DirectionMetric[] = [
  { label: 'Nouveaux leads', value: '512', trend: '+12,5% vs avr. 2025', tone: 'blue', spark: [50, 48, 52, 49, 51, 56, 53, 58, 55, 60, 62, 64] },
  { label: 'Contactés', value: '312', trend: '+8,4% vs avr. 2025', tone: 'cyan', spark: [36, 38, 40, 39, 43, 44, 46, 48, 47, 50, 52, 51] },
  { label: 'Visites planifiées', value: '186', trend: '+14,2% vs avr. 2025', tone: 'amber', spark: [22, 26, 25, 31, 28, 35, 34, 39, 41, 40, 44, 46] },
  { label: 'Visites réalisées', value: '132', trend: '+9,1% vs avr. 2025', tone: 'orange', spark: [20, 23, 21, 26, 24, 29, 31, 28, 33, 35, 37, 39] },
  { label: 'Offres envoyées', value: '98', trend: '+7,3% vs avr. 2025', tone: 'rose', spark: [15, 18, 17, 20, 22, 21, 24, 26, 25, 28, 29, 31] },
  { label: 'Inscriptions', value: '74', trend: '+15,6% vs avr. 2025', tone: 'emerald', spark: [10, 14, 13, 16, 19, 18, 22, 25, 23, 28, 30, 32] },
]

export const hrMetrics: DirectionMetric[] = [
  { label: 'Effectif total', value: '1 247', trend: '+32 vs avr. 2025', tone: 'blue', spark: [60, 62, 61, 64, 66, 63, 68, 67, 70, 71, 70, 73] },
  { label: 'Taux de couverture', value: '92,6%', trend: '+2,8 pts vs avr. 2025', tone: 'emerald', spark: [70, 72, 74, 73, 76, 78, 79, 77, 82, 84, 83, 86] },
  { label: 'Postes vacants', value: '86', trend: '-12 vs avr. 2025', tone: 'rose', spark: [50, 47, 45, 42, 40, 39, 36, 34, 32, 30, 28, 26] },
  { label: 'En recrutement', value: '47', trend: '+5 vs avr. 2025', tone: 'amber', spark: [22, 24, 25, 27, 29, 28, 31, 33, 34, 36, 37, 39] },
  { label: 'Absentéisme global', value: '4,8%', trend: '-0,6 pt vs avr. 2025', tone: 'emerald', spark: [45, 42, 40, 38, 37, 35, 32, 31, 30, 28, 27, 25] },
  { label: 'Heures sup. (mois)', value: '1 246 h', trend: '+8% vs avr. 2025', tone: 'rose', spark: [20, 22, 24, 26, 30, 32, 34, 33, 38, 40, 42, 45] },
  { label: 'Taux formation', value: '78,4%', trend: '+6,1 pts vs avr. 2025', tone: 'violet', spark: [48, 50, 52, 54, 55, 58, 57, 60, 62, 64, 65, 68] },
]

export const qualityMetrics: DirectionMetric[] = [
  { label: 'Indice risque global', value: 'Moyen', trend: '58/100 · -5 pts', tone: 'amber', spark: [60, 62, 64, 61, 58, 56, 54, 53, 55, 52, 50, 49] },
  { label: 'Incidents ce mois', value: '27', trend: '-10% vs avr. 2025', tone: 'emerald', spark: [40, 38, 35, 33, 31, 30, 28, 27, 25, 24, 23, 22] },
  { label: 'Incidents critiques', value: '3', trend: '+50% vs avr. 2025', tone: 'rose', spark: [10, 14, 12, 18, 15, 22, 20, 25, 21, 28, 26, 30] },
  { label: 'Taux conformité', value: '92,1%', trend: '+3,4 pts vs avr. 2025', tone: 'emerald', spark: [70, 72, 74, 76, 75, 78, 80, 82, 81, 84, 86, 88] },
  { label: 'Audits réalisés', value: '16', trend: '+2 vs avr. 2025', tone: 'blue', spark: [22, 25, 24, 28, 30, 32, 31, 35, 36, 38, 40, 41] },
  { label: 'Non-conformités', value: '21', trend: '-12 vs avr. 2025', tone: 'amber', spark: [48, 45, 43, 41, 38, 35, 33, 31, 30, 28, 27, 25] },
  { label: "Plans d’action", value: '38', trend: '+7 vs avr. 2025', tone: 'rose', spark: [20, 24, 26, 25, 30, 33, 32, 36, 39, 41, 43, 45] },
  { label: 'Actions en retard', value: '9', trend: '-4 vs avr. 2025', tone: 'emerald', spark: [25, 24, 22, 20, 18, 17, 15, 14, 12, 10, 9, 8] },
]

export const parentMetrics: DirectionMetric[] = [
  { label: 'NPS global', value: '68', trend: '+6 pts vs avr. 2025', tone: 'emerald', spark: [35, 38, 40, 42, 45, 44, 48, 50, 52, 55, 58, 62] },
  { label: 'Satisfaction globale', value: '4,6 / 5', trend: '+0,2 pt vs avr. 2025', tone: 'emerald', spark: [70, 71, 72, 74, 73, 75, 76, 77, 78, 79, 80, 82] },
  { label: 'Réponses enquête', value: '1 248', trend: 'Taux réponse 24,8%', tone: 'blue', spark: [40, 44, 42, 48, 50, 52, 51, 55, 58, 60, 61, 64] },
  { label: 'Tickets ouverts', value: '128', trend: '-18 vs avr. 2025', tone: 'amber', spark: [55, 52, 50, 48, 45, 43, 40, 39, 36, 35, 32, 30] },
  { label: 'Temps réponse médian', value: '2,4 h', trend: '-1,1 h vs avr. 2025', tone: 'emerald', spark: [40, 38, 35, 32, 31, 28, 27, 25, 23, 22, 20, 18] },
]

export const reportMetrics: DirectionMetric[] = [
  { label: 'Décisions à approuver', value: '12', trend: 'dont 3 urgentes', tone: 'blue', spark: [10, 12, 13, 15, 16, 18, 20, 24, 28, 32, 30, 36] },
  { label: 'Arbitrages en attente', value: '5', trend: '2 en dépassement', tone: 'amber', spark: [5, 6, 8, 7, 9, 10, 8, 11, 13, 12, 14, 15] },
  { label: 'Comités programmés', value: '3', trend: 'cette semaine', tone: 'violet', spark: [2, 4, 3, 5, 4, 6, 7, 6, 8, 9, 11, 12] },
  { label: 'Exports planifiés', value: '18', trend: '100% réussis', tone: 'emerald', spark: [4, 6, 8, 10, 12, 14, 13, 16, 18, 20, 22, 24] },
  { label: 'Packs conseil prêts', value: '4', trend: 'prêts au téléchargement', tone: 'blue', spark: [1, 2, 3, 2, 3, 4, 5, 4, 6, 7, 8, 9] },
]
