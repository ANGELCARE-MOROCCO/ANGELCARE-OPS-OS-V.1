import type { Ac360DedicatedModuleRoute } from './customer-module-routes'
import type { Ac360CustomerLiveRecord } from './customer-live-records-model'

export type Ac360RecordTimelineEvent = {
  label: string
  detail: string
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'
}

export type Ac360RecordContextualAction = {
  label: string
  detail: string
  commandHint: string
  guardSignal: string
  billingSignal: string
  priority: 'immédiate' | 'haute' | 'normale' | 'automatisable'
}

export type Ac360RecordIntelligence = {
  recordRef: string
  title: string
  executiveSummary: string
  healthLabel: string
  riskLevel: string
  nextBestAction: string
  proofReference: string
  relatedRecords: string[]
  timeline: Ac360RecordTimelineEvent[]
  actions: Ac360RecordContextualAction[]
  governance: string[]
  billingImpact: string[]
  auditSignals: string[]
}

function moduleSentence(moduleKey: string) {
  const map: Record<string, string> = {
    finance: 'impact trésorerie, recouvrement, facture, paiement, promesse et relance parent',
    admissions: 'conversion admissions, visite, offre, dossier, relance et revenu prévisionnel',
    attendance: 'présence du jour, absence, retard, sortie, correction et preuve daybook',
    students: 'dossier enfant/famille, documents, santé, facturation, classe et timeline',
    parenttrust: 'confiance parent, réclamation, rendez-vous, enquête, réputation et rétention',
    billing: 'plan, add-on, crédits, restriction, activation, préservation données et upgrade',
    communication: 'message parent, campagne, consentement, livraison, crédits et preuve',
    documents: 'document, version, revue, stockage, export, rapport et accès audité',
    workflows: 'tâche, validation, workflow, ticket, propriétaire et exécution',
    hr: 'staff, contrat, planning, congé, couverture et conformité',
    safety: 'santé, incident, médicament, pickup autorisé et contrôle sécurité',
    transport: 'circuit, véhicule, chauffeur, élève, retard, sécurité et facturation transport',
  }
  return map[moduleKey] || 'pilotage opérationnel, statut, propriétaire, preuve, action et gouvernance'
}

function priorityFromRecord(record: Ac360CustomerLiveRecord): Ac360RecordContextualAction['priority'] {
  const haystack = `${record.status} ${record.risk} ${record.due}`.toLowerCase()
  if (/(critique|urgent|overdue|impayé|retard|bloqué|incident|immédiat)/.test(haystack)) return 'immédiate'
  if (/(haute|à valider|à vérifier|en retard|pending|attente)/.test(haystack)) return 'haute'
  if (/(automatisation|relance|campagne|workflow|récurrent)/.test(haystack)) return 'automatisable'
  return 'normale'
}

function toneFromPriority(priority: Ac360RecordContextualAction['priority']): Ac360RecordTimelineEvent['tone'] {
  if (priority === 'immédiate') return 'rose'
  if (priority === 'haute') return 'amber'
  if (priority === 'automatisable') return 'violet'
  return 'blue'
}

export function buildAc360CustomerRecordIntelligence(route: Ac360DedicatedModuleRoute, record: Ac360CustomerLiveRecord): Ac360RecordIntelligence {
  const priority = priorityFromRecord(record)
  const tone = toneFromPriority(priority)
  const context = moduleSentence(route.moduleKey)
  const proof = record.proof || `PREUVE-${record.reference}`
  const risk = record.risk || 'normal'

  return {
    recordRef: record.reference,
    title: `${record.primary} · lecture 360`,
    executiveSummary: `Ce dossier est lu dans le contexte ${context}. Le système doit clarifier le statut, le risque, le propriétaire, la preuve disponible, l’impact facturation et la prochaine action recommandée avant toute exécution.`,
    healthLabel: record.source === 'live' ? 'Donnée live connectée' : 'Fallback structuré sécurisé',
    riskLevel: risk,
    nextBestAction: priority === 'immédiate'
      ? 'Traiter immédiatement avec pré-vol AC360, preuve et escalade si blocage.'
      : priority === 'haute'
        ? 'Corriger ou valider le dossier avant la prochaine clôture opérationnelle.'
        : priority === 'automatisable'
          ? 'Convertir ce traitement en automatisation ou vue enregistrée si le volume se répète.'
          : 'Suivre le dossier, confirmer la preuve et garder l’historique complet.',
    proofReference: proof,
    relatedRecords: [
      `Module : ${route.label}`,
      `Owner : ${record.owner || 'Non assigné'}`,
      `Échéance : ${record.due || 'Non définie'}`,
      `Montant / volume : ${record.amount || '—'}`,
    ],
    timeline: [
      { label: 'Record détecté', detail: `${record.reference} extrait depuis ${record.source === 'live' ? 'endpoint live' : 'fallback sécurisé'}.`, tone: 'blue' },
      { label: 'Contexte métier qualifié', detail: record.secondary || 'Signal métier rattaché au module client.', tone: 'violet' },
      { label: 'Risque évalué', detail: `Risque actuel : ${risk}. Statut : ${record.status}.`, tone },
      { label: 'Preuve disponible', detail: `Référence preuve : ${proof}.`, tone: 'emerald' },
      { label: 'Action recommandée', detail: priority === 'immédiate' ? 'Escalade et commande gardée recommandées.' : 'Traitement contrôlé avec audit recommandé.', tone },
    ],
    actions: [
      {
        label: 'Ouvrir commande gardée',
        detail: 'Préparer une action sur ce dossier avec pré-vol AC360, payload contrôlé et résultat/preuve.',
        commandHint: route.primaryCommand,
        guardSignal: 'org → abonnement → droits → policy → usage → audit',
        billingSignal: 'impact crédits / add-on vérifié avant exécution',
        priority,
      },
      {
        label: 'Créer suivi opérationnel',
        detail: 'Transformer le dossier en tâche, relance, validation ou alerte selon le module.',
        commandHint: route.secondaryCommand,
        guardSignal: 'propriétaire, échéance et preuve requis',
        billingSignal: 'aucun coût caché sans pré-vol visible',
        priority: priority === 'normale' ? 'automatisable' : 'haute',
      },
      {
        label: 'Voir audit & preuve',
        detail: 'Contrôler l’historique, la source, la preuve, les signaux liés et la décision suivante.',
        commandHint: route.tertiaryCommand,
        guardSignal: 'journal et traçabilité',
        billingSignal: 'préservation données gouvernée',
        priority: 'normale',
      },
    ],
    governance: [
      'Aucune action sensible sans pré-vol AC360.',
      'Les données fallback ne cassent jamais l’expérience client.',
      'Le statut plan/add-on/crédits reste visible avant exécution.',
      'Toute preuve doit rester consultable pour audit direction et support AngelCare.',
    ],
    billingImpact: [
      `Plan requis : ${route.monetization[0] || 'selon module et droits actifs'}`,
      `Usage : ${route.monetization[1] || 'crédit ou quota vérifié en pré-vol'}`,
      `Restriction : ${route.monetization[2] || 'blocage expliqué avec recovery client'}`,
    ],
    auditSignals: [
      `Source : ${record.source}`,
      `Référence : ${record.reference}`,
      `Statut : ${record.status}`,
      `Preuve : ${proof}`,
    ],
  }
}
