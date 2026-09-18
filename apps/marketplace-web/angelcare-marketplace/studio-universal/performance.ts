import type { Data } from '@puckeditor/core'

export interface StudioPerformanceReport {
  blocks: number
  importedBlocks: number
  interactiveBlocks: number
  controlledIslands: number
  reviewRequiredBlocks: number
  itemRows: number
  importedRuleCount: number
  serializedBytes: number
  score: number
  warnings: string[]
}

const arr = (value: unknown) => Array.isArray(value) ? value : []

export function auditStudioPerformance(data: Data): StudioPerformanceReport {
  const blocks = arr(data.content) as Array<{type?:string;props?:Record<string,unknown>}>
  let importedBlocks=0,interactiveBlocks=0,controlledIslands=0,reviewRequiredBlocks=0,itemRows=0,importedRuleCount=0
  for(const block of blocks){
    const props=block.props||{}
    if(props.__studioImported) importedBlocks++
    if(String(block.type||'').startsWith('studio_') && ['studio_tabs','studio_dialog','studio_carousel','studio_menu','studio_form','studio_accordion'].includes(String(block.type))) interactiveBlocks++
    if(block.type==='studio_island') controlledIslands++
    if(props.__studioReviewRequired) reviewRequiredBlocks++
    itemRows += arr(props.items).length
    importedRuleCount += arr(props.__studioImportedRules).length
  }
  const serializedBytes = new TextEncoder().encode(JSON.stringify(data)).length
  const warnings:string[]=[]
  if(blocks.length>180) warnings.push('La page contient plus de 180 blocs : simplifiez ou factorisez la composition.')
  if(itemRows>1000) warnings.push('La page contient plus de 1000 éléments répétés : privilégiez des sources de données réelles.')
  if(importedRuleCount>500) warnings.push('Le volume de règles CSS importées est élevé : une normalisation supplémentaire est recommandée.')
  if(serializedBytes>1_500_000) warnings.push('Le document dépasse 1,5 Mo sérialisé : optimisez médias, listes et styles importés.')
  if(controlledIslands>0) warnings.push(`${controlledIslands} îlot(s) contrôlé(s) requièrent une décision avant publication.`)
  if(reviewRequiredBlocks>controlledIslands) warnings.push(`${reviewRequiredBlocks-controlledIslands} autre(s) bloc(s) requièrent une revue explicite.`)
  const deductions = Math.min(55,Math.max(0,blocks.length-80)*0.12 + Math.max(0,itemRows-300)*0.015 + Math.max(0,importedRuleCount-150)*0.03 + controlledIslands*5 + Math.max(0,serializedBytes-500_000)/100_000)
  return {blocks:blocks.length,importedBlocks,interactiveBlocks,controlledIslands,reviewRequiredBlocks,itemRows,importedRuleCount,serializedBytes,score:Math.max(0,Math.round(100-deductions)),warnings}
}
