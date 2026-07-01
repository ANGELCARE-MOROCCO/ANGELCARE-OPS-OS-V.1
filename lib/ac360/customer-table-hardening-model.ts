import type { Ac360WorkspaceRecord, Ac360WorkspaceTemplate } from './customer-workspace-model'

export type Ac360CustomerBulkAction = {
  key: string
  label: string
  description: string
  guardSignal: string
  billingSignal: string
  outcomeSignal: string
  tone: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'violet'
}

export type Ac360CustomerSavedView = {
  key: string
  label: string
  description: string
  countLabel: string
  guard: string
}

export type Ac360CustomerOutcome = {
  title: string
  subtitle: string
  proofReference: string
  status: 'préparé' | 'pré-vol' | 'exécuté' | 'bloqué'
  nextSteps: string[]
  proofSignals: string[]
  auditTrail: string[]
  billingImpacts: string[]
}

export type Ac360CustomerTableHardening = {
  moduleKey: string
  savedViews: Ac360CustomerSavedView[]
  bulkActions: Ac360CustomerBulkAction[]
  quickFilters: string[]
  densityModes: string[]
  outcomeTemplate: Ac360CustomerOutcome
}

const defaultBulkActions: Ac360CustomerBulkAction[] = [
  {
    key: 'bulk.preflight',
    label: 'Pré-vol groupé',
    description: 'Contrôler les droits, restrictions, limites et crédits avant toute action en masse.',
    guardSignal: 'Guard AC360 requis avant exécution',
    billingSignal: 'Aucun débit sans exécution confirmée',
    outcomeSignal: 'Retour avec preuve, blocage ou recommandation',
    tone: 'blue',
  },
  {
    key: 'bulk.task',
    label: 'Créer tâches',
    description: 'Transformer les lignes sélectionnées en tâches opérationnelles assignables.',
    guardSignal: 'Action workflow contrôlée',
    billingSignal: 'Usage opérationnel journalisé',
    outcomeSignal: 'Tâches créées avec owner et échéance',
    tone: 'emerald',
  },
  {
    key: 'bulk.export',
    label: 'Exporter vue',
    description: 'Préparer un export gouverné de la vue actuelle avec audit d’accès.',
    guardSignal: 'Export soumis au plan et rôle utilisateur',
    billingSignal: 'Peut consommer crédit export/rapport',
    outcomeSignal: 'Export mis en file avec preuve',
    tone: 'amber',
  },
  {
    key: 'bulk.escalate',
    label: 'Escalader risque',
    description: 'Créer une alerte ou validation direction sur les dossiers à risque.',
    guardSignal: 'Escalade soumise aux permissions',
    billingSignal: 'Aucune donnée supprimée, preuve conservée',
    outcomeSignal: 'Alerte direction ou validation créée',
    tone: 'rose',
  },
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildSavedViews(workspace: Ac360WorkspaceTemplate): Ac360CustomerSavedView[] {
  const records = workspace.records.length || 1
  return workspace.savedViews.slice(0, 6).map((label, index) => ({
    key: slugify(label),
    label,
    description: index === 0
      ? 'Vue prioritaire pour pilotage quotidien et exécution immédiate.'
      : `Vue sauvegardée ${index + 1} avec filtres, tri, owners et preuves conservés.`,
    countLabel: `${Math.max(1, records + index * 2)} signaux`,
    guard: index % 2 === 0 ? 'Droits + plan vérifiés' : 'Usage + audit visibles',
  }))
}

export function getAc360CustomerTableHardening(moduleKey: string, workspace: Ac360WorkspaceTemplate): Ac360CustomerTableHardening {
  const moduleSpecific: Record<string, Partial<Ac360CustomerTableHardening>> = {
    finance: {
      quickFilters: ['Créances > 7 jours', 'Promesses ouvertes', 'Relance WhatsApp', 'Ajustements à valider', 'Risque cash-flow'],
      outcomeTemplate: {
        title: 'Résultat finance gouverné',
        subtitle: 'Action finance préparée avec créances, relance, crédit, preuve et suivi cash-flow.',
        proofReference: 'AC360-FIN-PROOF',
        status: 'pré-vol',
        nextSteps: ['Envoyer relance gardée', 'Créer promesse paiement', 'Générer rapport créances', 'Proposer Finance Power'],
        proofSignals: ['Montant MAD conservé', 'Famille liée', 'Historique facture visible', 'Crédits message estimés'],
        auditTrail: ['Pré-vol entitlement', 'Capacité/usage vérifié', 'Payload finance préparé', 'Preuve prête pour audit'],
        billingImpacts: ['Relance WhatsApp/SMS créditée', 'Rapport PDF selon plan', 'Finance Power recommandé si risque récurrent'],
      },
    },
    admissions: {
      quickFilters: ['Leads chauds', 'Visite < 48h', 'Offres en attente', 'Doublons', 'Valeur pipeline'],
      outcomeTemplate: {
        title: 'Résultat admissions gouverné',
        subtitle: 'Prospects, visites, suivis et offres structurés avec valeur pipeline et conversion.',
        proofReference: 'AC360-ADM-PROOF',
        status: 'pré-vol',
        nextSteps: ['Créer suivi 48h', 'Planifier visite', 'Générer offre', 'Convertir en élève'],
        proofSignals: ['Source lead conservée', 'Parent contactable', 'Pipeline visible', 'Valeur mensuelle estimée'],
        auditTrail: ['Lead contrôlé', 'Stage pipeline vérifié', 'Action propriétaire assignée', 'Conversion journalisée'],
        billingImpacts: ['Admissions avancé peut être add-on', 'Campagnes de relance créditées', 'Import leads gouverné'],
      },
    },
    attendance: {
      quickFilters: ['Absents non justifiés', 'Sorties ouvertes', 'Corrections à valider', 'Staff en retard', 'Session non clôturée'],
      outcomeTemplate: {
        title: 'Résultat présence sécurisé',
        subtitle: 'Daybook, corrections, absences et sorties traités avec preuve quotidienne.',
        proofReference: 'AC360-PRS-PROOF',
        status: 'pré-vol',
        nextSteps: ['Valider correction', 'Notifier parent', 'Clôturer session', 'Créer incident si nécessaire'],
        proofSignals: ['Session active', 'Heure événement conservée', 'Responsable identifié', 'Correction auditée'],
        auditTrail: ['Session contrôlée', 'Événement enregistré', 'Correction soumise', 'Clôture horodatée'],
        billingImpacts: ['Notifications consomment crédits', 'Rapports présence selon plan', 'Blocage si restriction politique'],
      },
    },
    parenttrust: {
      quickFilters: ['Réclamations critiques', 'RDV à confirmer', 'Surveys faibles', 'Risque rétention', 'Témoignages prêts'],
      outcomeTemplate: {
        title: 'Résultat ParentTrust suivi',
        subtitle: 'Réclamation, satisfaction, rendez-vous et réputation pilotés avec preuve relation parent.',
        proofReference: 'AC360-TRUST-PROOF',
        status: 'pré-vol',
        nextSteps: ['Assigner owner', 'Planifier rendez-vous', 'Lancer survey', 'Créer suivi rétention'],
        proofSignals: ['Parent lié', 'Niveau sévérité', 'Timeline relation', 'Satisfaction mesurée'],
        auditTrail: ['Cas ouvert', 'Événement relation enregistré', 'Décision tracée', 'Clôture confirmée'],
        billingImpacts: ['ParentTrust peut être add-on', 'Surveys et messages crédités', 'Rapport mensuel premium'],
      },
    },
    'billing-growth': {
      quickFilters: ['Modules verrouillés', 'Crédits faibles', 'Add-ons actifs', 'Restrictions', 'Sérénité recommandée'],
      outcomeTemplate: {
        title: 'Résultat Growth Menu',
        subtitle: 'Activation, limites, crédits, restrictions et data preservation visibles avant décision.',
        proofReference: 'AC360-BILLING-PROOF',
        status: 'pré-vol',
        nextSteps: ['Activer add-on', 'Acheter crédits', 'Comparer plans', 'Créer recommandation Sérénité'],
        proofSignals: ['Plan actuel visible', 'Prix MAD affiché', 'Annulation expliquée', 'Données préservées'],
        auditTrail: ['Pré-vol billing', 'Entitlement inspecté', 'Activation préparée', 'Usage journalisé'],
        billingImpacts: ['Revenu add-on mensuel', 'Usage crédité', 'Sérénité pour paix d’esprit'],
      },
    },
  }

  const fallback: Ac360CustomerOutcome = {
    title: 'Résultat opérationnel gouverné',
    subtitle: 'Action préparée avec droits, usage, preuve, owner et suite recommandée.',
    proofReference: 'AC360-OPS-PROOF',
    status: 'pré-vol',
    nextSteps: ['Pré-vol action', 'Créer tâche', 'Notifier owner', 'Journaliser preuve'],
    proofSignals: ['Owner visible', 'Priorité lue', 'Deadline conservée', 'Signal métier disponible'],
    auditTrail: ['Sélection enregistrée', 'Guard vérifié', 'Payload préparé', 'Résultat prêt à tracer'],
    billingImpacts: ['Usage mesuré selon action', 'Add-on recommandé si verrouillé', 'Aucune suppression automatique'],
  }

  const specific = moduleSpecific[moduleKey] || {}

  return {
    moduleKey,
    savedViews: buildSavedViews(workspace),
    bulkActions: defaultBulkActions,
    quickFilters: specific.quickFilters || [...workspace.filters.slice(0, 4), 'À traiter', 'Risque ouvert'],
    densityModes: ['Dense', 'Confort', 'Audit', 'Direction'],
    outcomeTemplate: specific.outcomeTemplate || fallback,
  }
}

export function buildAc360CustomerOutcome(
  hardening: Ac360CustomerTableHardening,
  selectedRecords: Ac360WorkspaceRecord[],
  source: 'row' | 'bulk' | 'view',
  actionLabel?: string,
): Ac360CustomerOutcome {
  const count = selectedRecords.length
  const first = selectedRecords[0]
  return {
    ...hardening.outcomeTemplate,
    title: actionLabel || hardening.outcomeTemplate.title,
    subtitle: count > 1
      ? `${count} dossiers sélectionnés · traitement groupé préparé avec garde AC360, preuve et suite recommandée.`
      : first
        ? `${first.id} · ${first.title} · ${first.signal}`
        : hardening.outcomeTemplate.subtitle,
    proofReference: `${hardening.outcomeTemplate.proofReference}-${new Date().toISOString().slice(0, 10)}`,
    status: source === 'bulk' ? 'pré-vol' : 'préparé',
    proofSignals: [
      count > 1 ? `${count} lignes sélectionnées` : first ? `Dossier ${first.id}` : 'Vue active',
      ...(first ? [`Responsable : ${first.owner}`, `Priorité : ${first.priority}`, `Échéance : ${first.due || 'non définie'}`] : []),
      ...hardening.outcomeTemplate.proofSignals,
    ].slice(0, 8),
  }
}
