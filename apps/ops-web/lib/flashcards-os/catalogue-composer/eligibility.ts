import type { CatalogueCollectionCandidate, CatalogueDeliveryMode } from './types'

export type CatalogueEligibilityInput={
  learnerAgesMonths:number[]
  languages:string[]
  deliveryMode:CatalogueDeliveryMode
  usageContexts:string[]
  objectiveKeys:string[]
  painPointKeys:string[]
  outcomeKeys:string[]
  requiredCategoryIds:string[]
  excludedCategoryIds:string[]
  requiredCollectionIds:string[]
  excludedCollectionIds:string[]
  budgetMaxDh:number
  quantity:number
}
export type EligibilityReason=
  |'archived_or_inactive'|'category_not_selected'|'category_excluded'|'collection_excluded'
  |'age_incompatible'|'language_incompatible'|'format_incompatible'|'usage_context_incompatible'
  |'objective_incompatible'|'pain_point_incompatible'|'outcome_incompatible'|'commercial_inactive'
  |'price_missing'|'over_budget'
export type CatalogueEligibilityDecision={collection:CatalogueCollectionCandidate;eligible:boolean;reasons:EligibilityReason[]}
export type CatalogueEligibilityFunnel={
  registered:number;active:number;categoryCompatible:number;ageCompatible:number;languageCompatible:number;
  formatCompatible:number;contextCompatible:number;objectiveCompatible:number;commerciallyActive:number;withinBudget:number;eligible:number
}
export type CatalogueEligibilityResult={eligible:CatalogueCollectionCandidate[];decisions:CatalogueEligibilityDecision[];funnel:CatalogueEligibilityFunnel;reasonCounts:Record<string,number>}

function intersects(left:string[],right:string[]){return !right.length||left.length===0||left.some((item)=>right.includes(item))}
function withinAge(item:CatalogueCollectionCandidate,ages:number[]){return !ages.length||ages.every((age)=>(item.ageMinMonths==null||age>=item.ageMinMonths)&&(item.ageMaxMonths==null||age<=item.ageMaxMonths))}

export function evaluateCatalogueEligibility(all:CatalogueCollectionCandidate[],input:CatalogueEligibilityInput):CatalogueEligibilityResult{
  const requiredCategories=new Set(input.requiredCategoryIds||[]);const excludedCategories=new Set(input.excludedCategoryIds||[]);const excludedCollections=new Set(input.excludedCollectionIds||[])
  const qty=Math.max(1,Number(input.quantity)||1);const budget=Number(input.budgetMaxDh)||0
  const decisions=all.map((item)=>{
    const reasons:EligibilityReason[]=[]
    if(item.status==='archived'||item.lifecycle==='archived'||item.status==='inactive')reasons.push('archived_or_inactive')
    if(requiredCategories.size&&!requiredCategories.has(item.categoryId))reasons.push('category_not_selected')
    if(excludedCategories.has(item.categoryId))reasons.push('category_excluded')
    if(excludedCollections.has(item.id))reasons.push('collection_excluded')
    if(!withinAge(item,input.learnerAgesMonths||[]))reasons.push('age_incompatible')
    if(!intersects(item.languages,input.languages||[]))reasons.push('language_incompatible')
    if(input.deliveryMode!=='hybrid'&&!item.formats.includes(input.deliveryMode))reasons.push('format_incompatible')
    if(!intersects(item.usageContexts,input.usageContexts||[]))reasons.push('usage_context_incompatible')
    if(!intersects(item.objectiveKeys,input.objectiveKeys||[]))reasons.push('objective_incompatible')
    if(!intersects(item.painPointKeys,input.painPointKeys||[]))reasons.push('pain_point_incompatible')
    if(!intersects(item.outcomeKeys,input.outcomeKeys||[]))reasons.push('outcome_incompatible')
    if(item.commercialStatus!=='active')reasons.push('commercial_inactive')
    if(item.priceDh==null||item.priceDh<=0)reasons.push('price_missing')
    if(budget>0&&item.priceDh!=null&&item.priceDh>0&&item.priceDh*qty>budget)reasons.push('over_budget')
    return {collection:item,eligible:reasons.length===0,reasons}
  })
  const countBefore=(reason:EligibilityReason)=>decisions.filter((decision)=>!decision.reasons.includes(reason)).length
  // Funnel is intentionally monotonic and mirrors the exact evaluation order.
  let pool=decisions.slice();const stage=(reason:EligibilityReason)=>{pool=pool.filter((d)=>!d.reasons.includes(reason));return pool.length}
  const funnel:CatalogueEligibilityFunnel={registered:decisions.length,active:stage('archived_or_inactive'),categoryCompatible:0,ageCompatible:0,languageCompatible:0,formatCompatible:0,contextCompatible:0,objectiveCompatible:0,commerciallyActive:0,withinBudget:0,eligible:0}
  pool=pool.filter((d)=>!d.reasons.includes('category_not_selected')&&!d.reasons.includes('category_excluded')&&!d.reasons.includes('collection_excluded'));funnel.categoryCompatible=pool.length
  pool=pool.filter((d)=>!d.reasons.includes('age_incompatible'));funnel.ageCompatible=pool.length
  pool=pool.filter((d)=>!d.reasons.includes('language_incompatible'));funnel.languageCompatible=pool.length
  pool=pool.filter((d)=>!d.reasons.includes('format_incompatible'));funnel.formatCompatible=pool.length
  pool=pool.filter((d)=>!d.reasons.includes('usage_context_incompatible'));funnel.contextCompatible=pool.length
  pool=pool.filter((d)=>!d.reasons.includes('objective_incompatible')&&!d.reasons.includes('pain_point_incompatible')&&!d.reasons.includes('outcome_incompatible'));funnel.objectiveCompatible=pool.length
  pool=pool.filter((d)=>!d.reasons.includes('commercial_inactive')&&!d.reasons.includes('price_missing'));funnel.commerciallyActive=pool.length
  pool=pool.filter((d)=>!d.reasons.includes('over_budget'));funnel.withinBudget=pool.length;funnel.eligible=pool.length
  const reasonCounts:Record<string,number>={};for(const d of decisions)for(const reason of d.reasons)reasonCounts[reason]=(reasonCounts[reason]||0)+1
  return {eligible:pool.map((d)=>d.collection),decisions,funnel,reasonCounts}
}

export function eligibilityFailureMessage(result:CatalogueEligibilityResult){
  const f=result.funnel
  if(f.registered===0)return 'Le catalogue local ne contient aucune collection.'
  if(f.active===0)return 'Aucune collection active n’est disponible.'
  if(f.categoryCompatible===0)return 'Aucune collection ne correspond aux catégories sélectionnées.'
  if(f.ageCompatible===0)return 'Aucune collection ne couvre l’âge sélectionné.'
  if(f.languageCompatible===0)return 'Aucune collection compatible avec la langue sélectionnée.'
  if(f.formatCompatible===0)return 'Aucune collection compatible avec le format sélectionné.'
  if(f.contextCompatible===0)return 'Aucune collection compatible avec le contexte d’usage sélectionné. Modifiez le contexte ou enrichissez les collections concernées.'
  if(f.objectiveCompatible===0)return 'Aucune collection ne couvre les objectifs, pain points et outcomes sélectionnés.'
  if(f.commerciallyActive===0)return 'Des collections correspondent au besoin, mais aucune ne possède un prix commercial actif dans cet univers. Configurez/activez B2C ou B2B depuis le dossier collection.'
  if(f.withinBudget===0)return 'Les collections compatibles dépassent le budget cible. Augmentez le budget ou réduisez la sélection.'
  return 'Aucune collection éligible après application de tous les critères.'
}
