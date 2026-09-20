import type { MarketplacePermission } from '@/angelcare-marketplace/domain/types'
import type { StudioPolicyMode,StudioPolicyRuleId } from './types'

export const STUDIO_POLICY_RULES:{id:StudioPolicyRuleId;label:string;modes:StudioPolicyMode[];source:string}[]=[
  {id:'RBAC_PERMISSION',label:'Permission RBAC',modes:['draft','preview','publish','template_assignment'],source:'Marketplace RBAC'},
  {id:'MUTATION_AUTHORITY',label:'Autorité de mutation',modes:['draft','preview','publish','template_assignment'],source:'Marketplace permissions'},
  {id:'DOCUMENT_INTEGRITY',label:'Intégrité document Studio',modes:['draft','preview','publish','public_runtime'],source:'Studio page JSON'},
  {id:'SOURCE_REFERENCE_VALIDITY',label:'Références canoniques',modes:['preview','publish'],source:'P01 Source Registry'},
  {id:'PAGE_LIFECYCLE',label:'Cycle de publication',modes:['preview','publish'],source:'Experience Core'},
  {id:'TEMPLATE_INTEGRITY',label:'Template publié / résolution',modes:['template_assignment','public_runtime'],source:'P04 + Experience Core'},
  {id:'BINDING_INTEGRITY',label:'Données live',modes:['preview','publish','public_runtime'],source:'P05'},
  {id:'DYNAMIC_SOURCE_INTEGRITY',label:'Sources dynamiques',modes:['preview','publish','public_runtime'],source:'P06'},
  {id:'ACTION_INTEGRITY',label:'Actions structurées',modes:['preview','publish','public_runtime'],source:'P03'},
  {id:'WORKFLOW_INTEGRITY',label:'Workflows natifs',modes:['preview','publish','public_runtime'],source:'P07'},
  {id:'ROUTE_SAFETY',label:'Sécurité routes / URL',modes:['draft','preview','publish','public_runtime'],source:'Studio JSON + P03'},
  {id:'TERRITORY_SCOPE',label:'Périmètre territorial',modes:['draft','preview','publish','template_assignment','public_runtime'],source:'Marketplace request context'},
]
export const STUDIO_POLICY_MODE_PERMISSION:Partial<Record<StudioPolicyMode,MarketplacePermission>>={draft:'marketplace.cms.blocks.manage',preview:'marketplace.cms.preview',publish:'marketplace.cms.publish'}
export const STUDIO_ASSIGNMENT_SCOPE_PERMISSION={exact_item:'marketplace.catalog.manage',placement:'marketplace.homepage.manage',collection:'marketplace.homepage.manage',experience_schema:'marketplace.experience_schema.manage',category:'marketplace.catalog.manage',family:'marketplace.configuration.manage',marketplace_default:'marketplace.configuration.manage'} as const
