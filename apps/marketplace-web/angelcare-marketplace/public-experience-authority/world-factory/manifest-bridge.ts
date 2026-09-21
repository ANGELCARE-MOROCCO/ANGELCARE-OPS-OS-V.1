import type {PublicExperienceThemeManifest,PublicExperienceThemeSlot} from '../types'
import type {PublicExperienceWorldFactoryRecord,WorldFactorySemanticRole} from './types'

const legacySlot=(role:WorldFactorySemanticRole,index:number):PublicExperienceThemeSlot['slot']=>{
 if(role==='hero'||role==='storefront_hero')return'hero'
 if(role==='trust')return'trust'
 if(role==='storefront_facets'||role==='navigation')return'facets'
 if(role==='primary_conversion'||role==='secondary_conversion'||role==='footer')return'final_cta'
 if(role==='storefront_collection')return index%3===0?'collection_1':index%2===0?'collection_2':'collection_0'
 if(['storefront_inventory','recommendations','accessories','bundle','related','storefront_campaigns'].includes(role))return index%2===0?'featured_items':'inventory_items'
 return'featured_items'
}
export function worldFactoryLegacySlots(record:PublicExperienceWorldFactoryRecord):PublicExperienceThemeSlot[]{return record.semanticSlots.filter(row=>row.role!=='unknown').map((row,index)=>({blockId:row.blockId,slot:legacySlot(row.role,index),confidence:row.confidence,reason:`World Factory ${row.role}: ${row.evidence.join(', ')||'semantic inference'}`}))}
export function worldFactoryManifestFields(record:PublicExperienceWorldFactoryRecord):Pick<PublicExperienceThemeManifest,'requiredBindings'|'optionalBindings'|'requiredActions'|'optionalActions'|'requiredWorkflows'|'requiredCapabilities'|'slots'|'structuralFingerprint'|'visualFingerprint'|'factory'>{
 const requiredBindings=[...new Set(record.bindingPlan.filter(row=>row.required&&row.status==='RESOLVED').map(row=>row.bindingKey))],optionalBindings=[...new Set(record.bindingPlan.filter(row=>!row.required&&row.status==='RESOLVED').map(row=>row.bindingKey))],requiredActions=[...new Set(record.actionPlan.filter(row=>row.required&&row.actionId).map(row=>row.actionId!))],optionalActions=[...new Set(record.actionPlan.filter(row=>!row.required&&row.actionId).map(row=>row.actionId!))]
 return{requiredBindings,optionalBindings,requiredActions,optionalActions,requiredWorkflows:[],requiredCapabilities:[...new Set(['public-experience-360','canonical-route','native-fallback','world-factory-v2','truth-firewall','capability-negotiation',...record.capabilities.filter(row=>row.status==='SUPPORTED').map(row=>row.capability)])],slots:worldFactoryLegacySlots(record),structuralFingerprint:record.compiledFingerprint,visualFingerprint:record.visualReferences.length?record.visualReferences.map(row=>`${row.kind}:${row.sha256}`).join('|'):record.compiledFingerprint,factory:record}
}
