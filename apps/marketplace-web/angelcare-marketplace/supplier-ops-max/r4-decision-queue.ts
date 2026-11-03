/** Explainable operational next-action queue; no invented business projections. */
import type {Selection,ProviderState} from './contract'
import type {InventoryOverview} from './inventory-intelligence'
export type Decision={id:string;kind:'risk'|'action'|'opportunity';title:string;detail:string;tab:number;selectionId?:string;importance:number}
export function decideNextActions(selections:Selection[],providers:ProviderState[],inventory:InventoryOverview|null):Decision[]{
 const output:Decision[]=[]
 const cj=providers.find(p=>p.id==='cj')
 if(!cj?.credentialsConfigured)output.push({id:'cj-connect',kind:'risk',title:'CJ connection not configured',detail:'Configure server-side credentials before attempting supplier catalogue and inventory calls.',tab:2,importance:100})
 if(inventory&&!inventory.available)output.push({id:'inventory-migration',kind:'risk',title:'R4 inventory evidence store not installed',detail:'Run read-only preflight and additive inventory migration, then verify Supabase schema.',tab:14,importance:98})
 const staleAfter=30*60*1000
 const observed=inventory?.items||[]
 for(const s of selections){
  if(s.provider==='cj'){
   const sample=observed.filter(x=>x.selection_id===s.id)
   const newest=sample.reduce((m,x)=>Math.max(m,Date.parse(x.checked_at)||0),0)
   if(!sample.length||!newest||Date.now()-newest>staleAfter)output.push({id:'stock-'+s.id,kind:'risk',title:`Stock evidence missing or stale: ${s.title}`,detail:'Refresh actual CJ variant quantities before treating availability as confirmed.',tab:14,selectionId:s.id,importance:s.catalog_item_id?94:77})
  }
  if(!s.category_key||!s.category_keys?.length)output.push({id:'category-'+s.id,kind:'action',title:`Assign storefronts: ${s.title}`,detail:'Select one primary and all appropriate canonical storefront categories.',tab:4,selectionId:s.id,importance:70})
  if(!s.canonical_supplier_id)output.push({id:'supplier-'+s.id,kind:'action',title:`Qualify sourcing: ${s.title}`,detail:'Connect an existing verified AngelCare supplier before Product 360 launch.',tab:4,selectionId:s.id,importance:64})
  if(s.catalog_item_id&&s.status==='imported')output.push({id:'launch-'+s.id,kind:'opportunity',title:`Finish launch review: ${s.title}`,detail:'Confirm Finance approval, category assignment and canonical publication evidence.',tab:9,selectionId:s.id,importance:55})
 }
 if(!selections.length)output.push({id:'discover',kind:'opportunity',title:'Build your first sourcing shortlist',detail:'Browse real CJ categories and add products into the governed Product 360 pipeline.',tab:3,importance:30})
 return output.sort((a,b)=>b.importance-a.importance).slice(0,18)
}
