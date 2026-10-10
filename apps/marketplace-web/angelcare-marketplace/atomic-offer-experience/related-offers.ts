import type { DiscoveryItem } from '../catalog-discovery/types'
import type { PublicExperience360Relation } from '../public-experience-authority/types'

/** Canonical published discovery reads; unknown targets and territory mismatches cannot create cards. */
export async function loadAtomicRelatedOffers(input:{itemId:string;territoryId:string|null;relations:PublicExperience360Relation[];read:(id:string)=>Promise<DiscoveryItem|null>}):Promise<DiscoveryItem[]>{
  const ids=[...new Set(input.relations.filter(r=>['cross_sell','bundle','upsell','alternative'].includes(r.kind)).map(r=>r.entityId).filter((id):id is string=>!!id&&id!==input.itemId))].slice(0,24)
  const result:DiscoveryItem[]=[]
  for(let start=0;start<ids.length;start+=8){
    const batch=ids.slice(start,start+8),items=await Promise.all(batch.map(id=>input.read(id)))
    items.forEach((item,index)=>{const status=(item as (DiscoveryItem&{status?:unknown})|null)?.status;if(item&&item.id===batch[index]&&(status===undefined||status==='published')&&(!input.territoryId||!item.territory_id||item.territory_id===input.territoryId))result.push(item)})
  }
  return result
}
