import type { RevenueSignalBootstrap, RevenueSignalReadiness, RevenueSignalValidationIssue } from '../types'

function pct(value: number, total: number) { return total ? Math.round((value / total) * 100) : 0 }

export function calculateRevenueSignalReadiness(input: Omit<RevenueSignalBootstrap, 'readiness'|'counters'>): RevenueSignalReadiness {
  const enabled=input.sources.filter((x)=>x.enabled)
  const healthy=enabled.filter((x)=>x.status==='healthy')
  const fresh=enabled.filter((x)=>x.status!=='stale' && x.status!=='offline')
  const classified=input.signals.filter((x)=>x.category && x.signalType && x.confidence!=='unknown')
  const uniqueRaw=new Set(input.rawEvents.filter((x)=>x.processingStatus==='normalized').map((x)=>x.deduplicationKey)).size
  const normalizedRaw=input.rawEvents.filter((x)=>x.processingStatus==='normalized').length
  const contexts=input.contextSnapshots.filter((x)=>x.status==='ready')
  const safeSources=enabled.filter((x)=>x.minimumPermission && (!x.containsSensitiveData || x.minimumPermission.includes('signals')))
  const reliableScans=input.scheduledScans.filter((x)=>x.status==='active' && x.consecutiveFailures<3)
  const sourceCoverage=Math.min(100,pct(enabled.length,15))
  const sourceHealth=pct(healthy.length,enabled.length)
  const freshness=pct(fresh.length,enabled.length)
  const classificationCoverage=pct(classified.length,input.signals.length)
  const deduplicationSafety=normalizedRaw ? Math.min(100,Math.round(uniqueRaw/normalizedRaw*100)) : 100
  const contextReadiness=input.signals.length ? Math.min(100,Math.round(contexts.length/Math.max(1,input.signals.filter((x)=>['critical','high'].includes(x.severity)).length)*100)) : 0
  const privacySafety=pct(safeSources.length,enabled.length)
  const scheduleReliability=pct(reliableScans.length,input.scheduledScans.length)
  const overall=Math.round(sourceCoverage*.12+sourceHealth*.14+freshness*.14+classificationCoverage*.14+deduplicationSafety*.12+contextReadiness*.14+privacySafety*.1+scheduleReliability*.1)
  return {overall,sourceCoverage,sourceHealth,freshness,classificationCoverage,deduplicationSafety,contextReadiness,privacySafety,scheduleReliability}
}

export function validateRevenueSignalFabric(input: Omit<RevenueSignalBootstrap, 'validationIssues'|'readiness'|'counters'>): RevenueSignalValidationIssue[] {
  const issues: RevenueSignalValidationIssue[]=[]
  const at='2026-07-20T08:00:00.000Z'
  const add=(code:string,resourceType:string,resourceCode:string,category:RevenueSignalValidationIssue['category'],severity:RevenueSignalValidationIssue['severity'],title:string,detail:string,recommendedAction:string)=>issues.push({id:`issue-${code.toLowerCase()}`,code,resourceType,resourceCode,category,severity,title,detail,recommendedAction,status:'open',detectedAt:at})
  for(const source of input.sources) {
    if(!source.enabled) continue
    if(source.status==='offline') add(`SIG-SRC-OFF-${source.code}`,'signal_source',source.code,'source','critical','Source revenue hors ligne',`${source.name} est indisponible.`,'Réparer la source ou la retirer explicitement du périmètre.')
    if(source.status==='stale') add(`SIG-SRC-STALE-${source.code}`,'signal_source',source.code,'freshness','high','Source trop ancienne',`${source.name} dépasse son seuil de fraîcheur de ${source.staleAfterMinutes} minutes.`,'Exécuter un scan, vérifier le curseur et restaurer la fraîcheur.')
    if(source.errorCount24h>=3) add(`SIG-SRC-ERR-${source.code}`,'signal_source',source.code,'source','high','Erreurs source répétées',`${source.errorCount24h} erreurs observées sur 24 heures.`,'Inspecter le diagnostic et le contrat de l’adaptateur.')
    if(source.containsSensitiveData && !source.minimumPermission) add(`SIG-SRC-PRIV-${source.code}`,'signal_source',source.code,'privacy','critical','Source sensible sans permission minimale','La source contient des données sensibles mais ne définit pas de permission minimale.','Bloquer la source et définir une politique de visibilité.')
  }
  const criticalHigh=input.signals.filter((x)=>['critical','high'].includes(x.severity))
  for(const signal of criticalHigh) {
    if(!input.contextSnapshots.some((x)=>x.signalCode===signal.code && x.status==='ready')) add(`SIG-CTX-${signal.code}`,'signal',signal.code,'context',signal.severity==='critical'?'critical':'high','Contexte prioritaire manquant',`Le signal ${signal.code} ne dispose pas d’un snapshot prêt.`,'Construire un contexte minimisé avant recommandation stratégique.')
    if(signal.confidence==='low'||signal.confidence==='unknown') add(`SIG-CONF-${signal.code}`,'signal',signal.code,'classification','high','Confiance insuffisante',`Le signal ${signal.code} est prioritaire mais sa confiance est ${signal.confidence}.`,'Recouper avec une source primaire.')
  }
  const keys=new Map<string,number>()
  for(const event of input.rawEvents) keys.set(event.deduplicationKey,(keys.get(event.deduplicationKey)||0)+1)
  if([...keys.values()].some((x)=>x>3)) add('SIG-DEDUP-PRESSURE','raw_event','fabric','deduplication','medium','Pression de doublons élevée','Une même empreinte apparaît plus de trois fois.','Vérifier le webhook, le curseur ou la répétition du scan.')
  for(const scan of input.scheduledScans) if(scan.consecutiveFailures>=3) add(`SIG-SCAN-${scan.code}`,'scheduled_scan',scan.code,'schedule','high','Scan en échec répété',`${scan.consecutiveFailures} échecs consécutifs.`,'Suspendre, diagnostiquer puis relancer le scan en mode contrôlé.')
  if(input.rules.filter((x)=>x.enabled).length<12) add('SIG-RULE-COVERAGE','signal_rule','fabric','coverage','high','Couverture de classification insuffisante','Moins de 12 règles gouvernées sont actives.','Compléter les règles avant activation des futures commandes.')
  if(!input.subscriptions.some((x)=>x.active && x.severities.includes('critical'))) add('SIG-SUB-CRITICAL','signal_subscription','fabric','governance','critical','Aucun abonnement critique','Les signaux critiques ne disposent pas de routage interne.','Créer un abonnement Direction Revenue.')
  return issues
}

export function mergeRevenueSignalValidationStatus(current: RevenueSignalValidationIssue[], generated: RevenueSignalValidationIssue[]) {
  const statuses=new Map(current.map((x)=>[`${x.code}:${x.resourceCode}`,x.status]))
  return generated.map((x)=>({...x,status:statuses.get(`${x.code}:${x.resourceCode}`) || x.status}))
}
