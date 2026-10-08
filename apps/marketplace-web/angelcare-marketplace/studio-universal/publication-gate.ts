import type { ComponentData, Data } from '@puckeditor/core'
import { isStudioWorkflowReference } from '@/angelcare-marketplace/studio-workflows/reference'

export interface StudioPublicationGate {
  pass: boolean
  reviewRequiredBlocks: string[]
  controlledIslands: string[]
  blockers: string[]
}

function walk(content: unknown, out: ComponentData[]) {
  if(!Array.isArray(content)) return
  for(const row of content){
    if(!row || typeof row!=='object') continue
    const component=row as ComponentData
    out.push(component)
    const nested=(component.props as Record<string,unknown>|undefined)?.content
    walk(nested,out)
  }
}

export function studioPublicationGate(data: Data): StudioPublicationGate {
  const components:ComponentData[]=[]
  walk(data.content,components)
  const reviewRequiredBlocks=components.filter(row=>{const props=(row.props as Record<string,unknown>|undefined)||{};if(!props.__studioReviewRequired)return false;if(row.type==='studio_form'&&isStudioWorkflowReference(props.__studioWorkflow))return false;return true}).map(row=>String((row.props as Record<string,unknown>|undefined)?.id||row.type))
  const controlledIslands=components.filter(row=>row.type==='studio_island').map(row=>String((row.props as Record<string,unknown>|undefined)?.id||row.type))
  const blockers:string[]=[]
  if(controlledIslands.length) blockers.push('CONTROLLED_ISLAND_REVIEW')
  if(reviewRequiredBlocks.some(id=>!controlledIslands.includes(id))) blockers.push('REVIEW_REQUIRED_BLOCKS')
  return {pass:blockers.length===0,reviewRequiredBlocks,controlledIslands,blockers}
}
