import type { Ac360CustomerLiveCockpit } from './customer-live-data'
import { ac360CustomerModules } from './customer-ui-model'

type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'

export type Ac360CustomerBoardPack = {
  id: string
  title: string
  audience: string
  cadence: string
  format: string
  readiness: number
  status: 'pret' | 'a_completer' | 'verrouille' | 'recommande'
  proof: string
  sections: string[]
}

export type Ac360CustomerExportItem = {
  id: string
  label: string
  module: string
  format: 'PDF' | 'XLSX' | 'CSV' | 'Board Pack'
  frequency: string
  owner: string
  governance: string
  billable: string
  tone: Tone
}

export type Ac360CustomerPrintView = {
  id: string
  title: string
  purpose: string
  pageFormat: string
  watermark: string
  sections: string[]
  printRisk: string
}

export type Ac360CustomerReportingProfile = {
  executiveTitle: string
  executiveSummary: string
  exportScore: number
  reportingStatus: string
  boardPacks: Ac360CustomerBoardPack[]
  exportCenter: Ac360CustomerExportItem[]
  printViews: Ac360CustomerPrintView[]
  boardPackSignals: Array<{ label: string; value: string; detail: string; tone: Tone }>
  governanceProof: string[]
  commercialSignals: string[]
  recommendedActions: string[]
}

function connectedCount(live: Ac360CustomerLiveCockpit | null) {
  if (!live) return 0
  return Object.values(live.moduleSignals || {}).filter((signal) => signal.connected).length
}

function moduleLabel(moduleKey: string) {
  return ac360CustomerModules.find((module) => module.key === moduleKey)?.label || 'Cockpit Direction'
}

function statusFromScore(score: number): Ac360CustomerBoardPack['status'] {
  if (score >= 86) return 'pret'
  if (score >= 68) return 'a_completer'
  if (score >= 52) return 'recommande'
  return 'verrouille'
}

function readinessBase(live: Ac360CustomerLiveCockpit | null, moduleKey: string) {
  const connected = connectedCount(live)
  const credits = live?.billing.creditPercent ?? 82
  const restrictions = live?.billing.restrictionCount ?? 0
  const moduleConnected = Boolean(live?.moduleSignals?.[moduleKey]?.connected)
  return Math.max(45, Math.min(98, 62 + Math.min(18, connected) + (moduleConnected ? 8 : 0) + Math.round(credits / 10) - restrictions * 4))
}

export function getAc360CustomerReportingProfile({ live, moduleKey, roleLabel }: { live: Ac360CustomerLiveCockpit | null; moduleKey: string; roleLabel: string }): Ac360CustomerReportingProfile {
  const base = readinessBase(live, moduleKey)
  const currentModule = moduleLabel(moduleKey)
  const plan = live?.context.planName || 'Command'
  const campus = live?.context.campusName || 'Campus principal'
  const connected = connectedCount(live)
  const restrictions = live?.billing.restrictionCount ?? 0
  const credits = live?.billing.creditPercent ?? 82
  const exportScore = Math.max(40, Math.min(99, base - (restrictions > 0 ? 5 : 0)))

  const boardPacks: Ac360CustomerBoardPack[] = [
    {
      id: 'direction-weekly-board-pack',
      title: 'Board Pack Direction · Hebdomadaire',
      audience: 'Direction, propriétaires, comité interne',
      cadence: 'Chaque lundi 08:00',
      format: 'PDF exécutif + annexes XLSX',
      readiness: exportScore,
      status: statusFromScore(exportScore),
      proof: 'Référence pack, horodatage, modules couverts, signaux restrictions et crédits.',
      sections: ['Brief direction', 'Santé école', 'Finance & créances', 'ParentTrust', 'Présence', 'Admissions', 'Risques & décisions'],
    },
    {
      id: 'finance-receivables-pack',
      title: 'Pack Finance & Créances',
      audience: 'Direction + responsable finance',
      cadence: 'Mensuel + relance hebdomadaire',
      format: 'PDF A4 + export créances CSV/XLSX',
      readiness: Math.max(45, exportScore - 4),
      status: statusFromScore(exportScore - 4),
      proof: 'Factures, paiements, promesses, impayés, statut relances et audit de décision.',
      sections: ['Cash-flow', 'Impayés', 'Promesses', 'Familles à risque', 'Actions recommandées', 'Preuve export'],
    },
    {
      id: 'parenttrust-reputation-pack',
      title: 'Pack ParentTrust & Réputation',
      audience: 'Direction + relation parents',
      cadence: 'Bi-mensuel',
      format: 'PDF relation parents + synthèse satisfaction',
      readiness: Math.max(45, exportScore - 8),
      status: statusFromScore(exportScore - 8),
      proof: 'Réclamations, rendez-vous, surveys, témoignages, risques rétention et actions correctives.',
      sections: ['Trust score', 'Réclamations critiques', 'RDV parents', 'Témoignages', 'Rétention', 'Plan correction'],
    },
  ]

  const exportCenter: Ac360CustomerExportItem[] = [
    { id: 'export-students', label: 'Export élèves & familles', module: 'Élèves & Familles', format: 'XLSX', frequency: 'à la demande', owner: 'Administration', governance: 'Données personnelles · accès contrôlé', billable: 'Inclus Pro/Command · audit requis', tone: 'blue' },
    { id: 'export-attendance', label: 'Rapport présence du jour', module: 'Présence', format: 'PDF', frequency: 'quotidien', owner: 'Direction pédagogique', governance: 'Preuve daybook + corrections', billable: 'Inclus selon plan · stockage rapport', tone: 'emerald' },
    { id: 'export-finance', label: 'Créances & relances', module: 'Finance', format: 'XLSX', frequency: 'hebdomadaire', owner: 'Finance', governance: 'Montants sensibles · preuve export', billable: 'Finance Power recommandé', tone: 'rose' },
    { id: 'export-admissions', label: 'Pipeline admissions', module: 'Admissions CRM', format: 'CSV', frequency: 'hebdomadaire', owner: 'Admissions', governance: 'Leads, sources et conversion', billable: 'Growth Menu admissions', tone: 'violet' },
    { id: 'export-board-pack', label: 'Pack comité direction', module: currentModule, format: 'Board Pack', frequency: 'mensuel', owner: roleLabel, governance: 'Compilation multi-modules signée', billable: 'Command / Entreprise', tone: 'amber' },
  ]

  const printViews: Ac360CustomerPrintView[] = [
    {
      id: 'print-executive-a4',
      title: 'Vue A4 Direction Premium',
      purpose: 'Imprimer un résumé lisible pour comité, banque, partenaire ou réunion interne.',
      pageFormat: 'A4 portrait · en-tête AngelCare 360 · horodatage Maroc',
      watermark: 'AngelCare 360 · Document client gouverné',
      sections: ['Synthèse', 'KPI', 'Risques', 'Actions', 'Preuves', 'Restrictions'],
      printRisk: restrictions > 0 ? 'Inclure une mention restrictions compte avant partage externe.' : 'Prêt pour partage direction interne.',
    },
    {
      id: 'print-module-a4',
      title: `Vue A4 Module · ${currentModule}`,
      purpose: 'Transformer l’espace opérationnel courant en rapport lisible, signé et exploitable.',
      pageFormat: 'A4 paysage · table dense · annexes export',
      watermark: 'Préparé depuis cockpit client AC360',
      sections: ['Contexte module', 'Records clés', 'Timeline', 'Actions recommandées', 'Impact facturation'],
      printRisk: 'Vérifier droits utilisateur et confidentialité avant impression.',
    },
    {
      id: 'print-parent-facing',
      title: 'Vue parent / externe contrôlée',
      purpose: 'Préparer une version propre, limitée et non sensible pour échange parent ou partenaire.',
      pageFormat: 'A4 portrait · données minimisées',
      watermark: 'Version contrôlée · non exhaustive',
      sections: ['Message', 'État', 'Preuve autorisée', 'Prochaine étape'],
      printRisk: 'Masquer finance, santé ou données staff si non autorisé.',
    },
  ]

  const boardPackSignals = [
    { label: 'Readiness export', value: `${exportScore}%`, detail: `${connected}/20 endpoints connectés ou fallback sécurisé`, tone: exportScore >= 80 ? 'emerald' as Tone : 'amber' as Tone },
    { label: 'Crédits disponibles', value: `${credits}%`, detail: 'Impact exports PDF, rapports et automatisations', tone: credits > 50 ? 'blue' as Tone : 'rose' as Tone },
    { label: 'Restrictions', value: String(restrictions), detail: 'À mentionner dans packs si impact fonctionnel', tone: restrictions ? 'rose' as Tone : 'emerald' as Tone },
    { label: 'Plan', value: plan, detail: 'Conditionne exports avancés et board packs', tone: 'violet' as Tone },
  ]

  return {
    executiveTitle: 'Reporting exécutif, exports et board packs prêts direction.',
    executiveSummary: `Le cockpit transforme les modules AC360 de ${campus} en rapports gouvernés : exports actionnables, vues A4 propres, packs comité et preuves d’exécution sans quitter l’expérience client française premium.`,
    exportScore,
    reportingStatus: exportScore >= 82 ? 'prêt direction' : exportScore >= 65 ? 'à compléter avant partage externe' : 'à sécuriser avant export',
    boardPacks,
    exportCenter,
    printViews,
    boardPackSignals,
    governanceProof: [
      'Chaque export doit afficher module source, horodatage, rôle utilisateur et statut plan.',
      'Les packs direction doivent mentionner restrictions, crédits faibles et endpoints fallback.',
      'Les vues parent/externe minimisent les données sensibles et gardent une preuve de partage.',
      'Les exports finance, santé, staff et familles restent gouvernés par droits et audit.',
    ],
    commercialSignals: [
      'Exports avancés et board packs peuvent devenir un levier Command / Entreprise.',
      'Rapports PDF récurrents consomment stockage, crédits automation ou add-on reporting.',
      'Pack Sérénité peut inclure préparation mensuelle AngelCare Success.',
      'Les écoles à forte gouvernance peuvent payer pour rapports banque, comité et conformité.',
    ],
    recommendedActions: [
      'Préparer le pack direction hebdomadaire avec Finance, Présence et ParentTrust.',
      'Activer un export créances XLSX si impayés ou promesses dépassent le seuil direction.',
      'Créer une vue A4 parent contrôlée avant toute communication sensible.',
      'Vérifier restrictions et crédits avant génération de rapports récurrents.',
    ],
  }
}
