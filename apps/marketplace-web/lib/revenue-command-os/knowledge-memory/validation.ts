import type {
  RevenueDoctrine,
  RevenueKnowledgeBootstrap,
  RevenueKnowledgeReadiness,
  RevenueKnowledgeStatus,
  RevenueKnowledgeValidationIssue,
} from '../types'

const allowedTransitions: Record<RevenueKnowledgeStatus, RevenueKnowledgeStatus[]> = {
  draft: ['in-review', 'retired'],
  'in-review': ['approved', 'rejected', 'draft'],
  approved: ['effective', 'suspended', 'retired'],
  effective: ['suspended', 'retired'],
  suspended: ['effective', 'retired'],
  retired: [],
  rejected: ['draft', 'retired'],
}

export function canTransitionKnowledgeStatus(from: RevenueKnowledgeStatus, to: RevenueKnowledgeStatus) {
  return allowedTransitions[from]?.includes(to) || false
}

export function assertKnowledgeStatusTransition(from: RevenueKnowledgeStatus, to: RevenueKnowledgeStatus) {
  if (!canTransitionKnowledgeStatus(from, to)) {
    throw new Error(`Transition doctrinale interdite: ${from} → ${to}`)
  }
}

export function calculateKnowledgeReadiness(input: Pick<RevenueKnowledgeBootstrap,
  'doctrines' | 'assets' | 'conflicts' | 'validationIssues' | 'approvals' | 'versions'>): RevenueKnowledgeReadiness {
  const doctrines = input.doctrines
  const assets = input.assets
  const effective = doctrines.filter((item) => item.status === 'effective' || item.status === 'approved').length
  const withAuthority = doctrines.filter((item) => item.sourceAuthority && item.ownerRole).length
  const withVersion = doctrines.filter((item) => item.version && input.versions.some((v) => v.resourceCode === item.code && v.version === item.version)).length
  const fresh = doctrines.filter((item) => !item.nextReviewAt || new Date(item.nextReviewAt).getTime() >= Date.now()).length
  const indexed = assets.filter((item) => item.indexStatus === 'indexed').length
  const unresolved = input.conflicts.filter((item) => item.status === 'open' || item.status === 'under-review')
  const critical = unresolved.filter((item) => item.severity === 'critical').length + input.validationIssues.filter((item) => item.status === 'open' && item.severity === 'critical').length
  const percent = (value: number, total: number) => total ? Math.round((value / total) * 100) : 100
  const conflictSafety = Math.max(0, 100 - unresolved.length * 12 - critical * 18)
  const approvedDoctrineCoverage = percent(effective, doctrines.length)
  const provenanceCoverage = percent(withAuthority, doctrines.length)
  const versionIntegrity = percent(withVersion, doctrines.length)
  const indexingReadiness = percent(indexed, assets.length)
  const authorityCoverage = percent(withAuthority, doctrines.length)
  const reviewFreshness = percent(fresh, doctrines.length)
  const overall = Math.round((approvedDoctrineCoverage * 2 + provenanceCoverage + versionIntegrity + conflictSafety * 2 + indexingReadiness + authorityCoverage + reviewFreshness) / 9)
  return { overall, approvedDoctrineCoverage, provenanceCoverage, versionIntegrity, conflictSafety, indexingReadiness, authorityCoverage, reviewFreshness }
}

function issue(code: string, resourceType: string, resourceCode: string, category: RevenueKnowledgeValidationIssue['category'], severity: RevenueKnowledgeValidationIssue['severity'], title: string, detail: string, recommendedAction: string): RevenueKnowledgeValidationIssue {
  return { id: `${code}:${resourceCode}`, code, resourceType, resourceCode, category, severity, title, detail, recommendedAction, status: 'open', detectedAt: new Date().toISOString() }
}

export function validateRevenueKnowledgeModel(input: RevenueKnowledgeBootstrap): RevenueKnowledgeValidationIssue[] {
  const issues: RevenueKnowledgeValidationIssue[] = []
  const activeCodes = new Set(input.doctrines.filter((item) => item.status === 'approved' || item.status === 'effective').map((item) => item.code))
  for (const doctrine of input.doctrines) {
    if (!doctrine.ownerRole || !doctrine.sourceAuthority) issues.push(issue('KNW-MISSING-AUTHORITY', 'doctrine', doctrine.code, 'authority', 'high', 'Autorité doctrinale absente', 'Le propriétaire ou la source d’autorité n’est pas renseigné.', 'Renseigner le propriétaire et la source officielle avant approbation.'))
    if (!doctrine.contentBlocks.length || !doctrine.rules.length) issues.push(issue('KNW-INCOMPLETE-DOCTRINE', 'doctrine', doctrine.code, 'completeness', 'high', 'Doctrine incomplète', 'La doctrine ne contient pas assez de contenu ou de règles exécutables.', 'Ajouter principes, règles et contrôles avant soumission.'))
    if ((doctrine.status === 'approved' || doctrine.status === 'effective') && !doctrine.effectiveFrom) issues.push(issue('KNW-MISSING-EFFECTIVE-DATE', 'doctrine', doctrine.code, 'lifecycle', 'medium', 'Date d’effet manquante', 'Une doctrine approuvée ou effective doit être datée.', 'Renseigner la date d’effet et la prochaine revue.'))
    if (doctrine.supersedesCode && !input.doctrines.some((item) => item.code === doctrine.supersedesCode)) issues.push(issue('KNW-BROKEN-SUPERSESSION', 'doctrine', doctrine.code, 'versioning', 'high', 'Référence supersession introuvable', 'La doctrine déclare remplacer une ressource inexistante.', 'Corriger la référence ou restaurer la version précédente.'))
    if (doctrine.nextReviewAt && new Date(doctrine.nextReviewAt).getTime() < Date.now() && doctrine.status === 'effective') issues.push(issue('KNW-OVERDUE-REVIEW', 'doctrine', doctrine.code, 'lifecycle', 'medium', 'Revue doctrinale échue', 'La doctrine effective dépasse sa date de revue.', 'Ouvrir une nouvelle version et soumettre une revue.'))
    if (!input.versions.some((item) => item.resourceCode === doctrine.code && item.version === doctrine.version)) issues.push(issue('KNW-MISSING-VERSION', 'doctrine', doctrine.code, 'versioning', 'high', 'Version non historisée', 'La version active ne possède pas de snapshot de version.', 'Créer une entrée de version immuable.'))
  }
  for (const asset of input.assets) {
    if ((asset.status === 'approved' || asset.status === 'effective') && !asset.checksum) issues.push(issue('KNW-ASSET-NO-CHECKSUM', 'asset', asset.code, 'provenance', 'high', 'Empreinte absente', 'Un actif approuvé doit avoir une empreinte permettant de détecter les changements.', 'Calculer et enregistrer le checksum.'))
    if ((asset.status === 'approved' || asset.status === 'effective') && asset.indexStatus === 'not-indexed') issues.push(issue('KNW-ASSET-NOT-INDEXED', 'asset', asset.code, 'indexing', 'medium', 'Actif approuvé non préparé', 'La recherche future ne pourra pas retrouver cette source.', 'Contrôler la confidentialité puis créer un job d’indexation.'))
    for (const code of asset.linkedDoctrineCodes) if (!input.doctrines.some((item) => item.code === code)) issues.push(issue('KNW-ASSET-BROKEN-LINK', 'asset', asset.code, 'provenance', 'medium', 'Doctrine liée introuvable', `La doctrine ${code} n’existe pas.`, 'Corriger la relation de preuve.'))
  }
  for (const conflict of input.conflicts.filter((item) => item.status === 'open' || item.status === 'under-review')) {
    issues.push(issue('KNW-OPEN-CONFLICT', 'conflict', conflict.code, 'conflict', conflict.severity, 'Conflit institutionnel ouvert', conflict.summary, conflict.recommendedResolution))
  }
  for (const approval of input.approvals.filter((item) => item.decision === 'pending')) {
    if (!activeCodes.has(approval.resourceCode) && approval.checklist.some((item) => !item.passed)) issues.push(issue('KNW-APPROVAL-INCOMPLETE', 'approval', approval.code, 'authority', 'medium', 'Approbation incomplète', 'Au moins un contrôle obligatoire du dossier est en échec.', 'Compléter la checklist avant décision.'))
  }
  return issues
}

export function resolveEffectiveDoctrine(doctrines: RevenueDoctrine[], code: string, at = new Date()) {
  return doctrines
    .filter((item) => item.code === code && item.status === 'effective' && (!item.effectiveFrom || new Date(item.effectiveFrom) <= at) && (!item.effectiveTo || new Date(item.effectiveTo) >= at))
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))[0]
}
