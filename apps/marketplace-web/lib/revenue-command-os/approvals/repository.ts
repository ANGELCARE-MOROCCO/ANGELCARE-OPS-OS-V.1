import 'server-only'

import { listStudioStrategies, loadStudioDossier } from '../strategy-studio/repository'
import type { ApprovalDeskItem, ApprovalDeskResponse } from './types'
import type { StrategyStudioDossier } from '../strategy-studio/types'

function finiteNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
function findRevenueValue(value: unknown, path = ''): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && /revenue|revenu|ca|turnover/i.test(path)) return value
  if (!value || typeof value !== 'object') return undefined
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const found = findRevenueValue(nested, `${path}.${key}`)
    if (found !== undefined) return found
  }
  return undefined
}
function money(value: number | undefined): string { return value === undefined ? 'Impact non chiffré' : `${Math.round(value).toLocaleString('fr-FR')} Dh` }
function riskLabel(probability: number, impact: number): string { const score=probability*impact; return score>=.55?'Élevé':score>=.25?'Moyen':'Maîtrisé' }

export async function readApprovalDesk(tenantId: string): Promise<ApprovalDeskResponse> {
  const strategyRows = await listStudioStrategies(tenantId)
  const warnings: string[] = []
  const dossiers: PromiseSettledResult<StrategyStudioDossier>[] = await Promise.allSettled(
    strategyRows.slice(0, 80).map((entry: { id: string }) => loadStudioDossier(entry.id, tenantId)),
  )
  const data: ApprovalDeskItem[] = []
  dossiers.forEach((result, index) => {
    if (result.status === 'rejected') { warnings.push(`Le dossier ${strategyRows[index]?.id || index} n'a pas pu être chargé.`); return }
    const dossier=result.value; const strategy=dossier.strategy
    const maximumRisk = strategy.risks.reduce((best,current)=>{const probability=finiteNumber(current.probability)??0;const impact=finiteNumber(current.impact)??0;return probability*impact>best.probability*best.impact?{probability,impact}:best},{probability:0,impact:0})
    const blockingEvidence=dossier.evidence.filter((entry)=>entry.blocking).length
    const contradictions=dossier.context.contradictions.length
    const unknowns=dossier.context.unknowns.length
    const completeness=Math.max(0,Math.min(100,Math.round(100-blockingEvidence*6-contradictions*3-unknowns)))
    const revenue=findRevenueValue(strategy.predictedResults)??finiteNumber(dossier.objective.revenueTarget)
    data.push({
      strategyId:strategy.id,strategyVersion:strategy.version,requestId:dossier.approval?.id,
      code:strategy.code,title:dossier.objective.title||strategy.thesis||strategy.code,
      category:'Décision opérateur directe',status:dossier.status,approvalClass:'none',impact:money(revenue),
      deadline:dossier.objective.deadline||dossier.objective.timeHorizon||'Sans échéance formelle',
      risk:riskLabel(maximumRisk.probability,maximumRisk.impact),completeness,
      whyNow:dossier.objective.businessReason||strategy.businessProblem||'Décision stratégique disponible pour action immédiate.',
      authorizedScope:strategy.thesis||strategy.valueProposition||'Périmètre complet du dossier.',
      alternative:strategy.fallbackPlan[0]||'Modifier ou combiner la stratégie directement.',
      exitCondition:strategy.stopConditions[0]||'L’opérateur peut suspendre, modifier ou archiver à tout moment.',
      conditionsText:'Instructions opérateur facultatives. Elles documentent l’exécution sans créer de gate.',
      traceId:`decision:${strategy.id}`,canDecide:true,externalActions:0,
    })
  })
  data.sort((a,b)=>b.completeness-a.completeness)
  return {ok:true,data,warnings,mode:'live',externalActions:0}
}
