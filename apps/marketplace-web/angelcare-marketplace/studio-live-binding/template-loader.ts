import 'server-only'
import type { Data } from '@puckeditor/core'
import { createServiceClient } from '@/lib/supabase/server'
import type { CmsBlock } from '@/angelcare-marketplace/experience-builder/types'
import { cmsBlocksToPuckData } from '@/angelcare-marketplace/studio-universal/puck-bridge'
import type { AdaptiveExperienceData } from '@/angelcare-marketplace/category-native-experience/types'
import type { StudioResolvedTemplate } from '@/angelcare-marketplace/studio-template-assignment/types'
import { createCatalogItemLiveBindingContext } from './context'
import { applyStudioLiveBindings } from './engine'
import type { StudioBoundTemplateResult } from './types'
import { cachedTemplateRevision } from '@/angelcare-marketplace/studio-dependency-invalidation/public-cache'

const MAX_BOUND_TEMPLATE_BYTES=2*1024*1024
const object=(value:unknown):Record<string,unknown>=>value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{}
const blocks=(value:unknown):CmsBlock[]=>Array.isArray(value)?value.filter((row):row is CmsBlock=>Boolean(row)&&typeof row==='object'&&!Array.isArray(row)):[]

function templateData(document:unknown,experience:AdaptiveExperienceData):Data{
  const doc=object(document)
  if(Array.isArray(doc.content))return doc as unknown as Data
  return cmsBlocksToPuckData(blocks(doc.blocks),{title:experience.item.name,locale:experience.locale,itemId:experience.item.id,schemaKey:experience.schema.schema_key})
}

export async function loadBoundStudioTemplate(input:{resolution:StudioResolvedTemplate;experience:AdaptiveExperienceData;visibility?:'admin_preview'|'public_runtime'}):Promise<StudioBoundTemplateResult>{
  if(input.resolution.status!=='RESOLVED'||!input.resolution.templateId||!input.resolution.templateRevisionId)return{status:'FALLBACK_NATIVE',data:null,report:{bindingCount:0,boundCount:0,missingCount:0,blockerCount:0,blocksTouched:0,entries:[]},context:null,template:null}
  const loadRevision=async()=>{const db=await createServiceClient();const result=await db.from('angelcare_marketplace_cms_template_revisions').select('id,template_id,document,checksum').eq('id',input.resolution.templateRevisionId!).eq('template_id',input.resolution.templateId!).maybeSingle();return result.error||!result.data?null:result.data}
  const row=input.visibility==='public_runtime'?await cachedTemplateRevision({templateId:input.resolution.templateId,revisionId:input.resolution.templateRevisionId,load:loadRevision}):await loadRevision()
  if(!row)return{status:'FALLBACK_NATIVE',data:null,report:{bindingCount:0,boundCount:0,missingCount:0,blockerCount:1,blocksTouched:0,entries:[]},context:null,template:null}
  const raw=templateData(row.document,input.experience)
  if(Buffer.byteLength(JSON.stringify(raw),'utf8')>MAX_BOUND_TEMPLATE_BYTES)throw new Error('Le template publié dépasse la limite de 2 Mo pour le binding live.')
  const context=createCatalogItemLiveBindingContext(input.experience)
  const bound=applyStudioLiveBindings(raw,context)
  return{status:'BOUND',data:bound.data,report:bound.report,context:context.summary,template:{id:input.resolution.templateId,key:input.resolution.templateKey||'',revisionId:String(row.id),checksum:typeof row.checksum==='string'?row.checksum:null}}
}

export const STUDIO_BOUND_TEMPLATE_MAX_BYTES=MAX_BOUND_TEMPLATE_BYTES
