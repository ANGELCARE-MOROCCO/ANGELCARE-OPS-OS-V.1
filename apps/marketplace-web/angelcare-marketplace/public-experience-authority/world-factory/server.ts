import 'server-only'
import type {Data} from '@puckeditor/core'
import {createServiceClient} from '@/lib/supabase/server'
import {MarketplaceError} from '@/angelcare-marketplace/server/errors'
import {buildWorldFactoryRecord} from './compiler'
import {materializeWorldFactoryData} from './materializer'
import {validateStudioPageJson} from '@/angelcare-marketplace/studio-universal/page-json'
import type {BuildWorldFactoryInput} from './types'
export async function analyzeExistingWorldFactoryTemplate(templateId:string,input:BuildWorldFactoryInput){const db=await createServiceClient();const template=await db.from('angelcare_marketplace_cms_templates').select('id,status,published_revision_id,current_revision_id').eq('id',templateId).neq('status','archived').maybeSingle();if(template.error||!template.data)throw new MarketplaceError('NOT_FOUND','Template Experience Core introuvable.');const revisionId=String(template.data.published_revision_id||template.data.current_revision_id||'');if(!revisionId)throw new MarketplaceError('VALIDATION_ERROR','Template sans révision exploitable.');const revision=await db.from('angelcare_marketplace_cms_template_revisions').select('document').eq('id',revisionId).maybeSingle();if(revision.error||!revision.data?.document)throw new MarketplaceError('NOT_FOUND','Révision Experience Core introuvable.');const data=validateStudioPageJson(revision.data.document);return buildWorldFactoryRecord(data,input)}

export function compileWorldFactoryCandidate(data:unknown,input:BuildWorldFactoryInput){const source=validateStudioPageJson(data),record=buildWorldFactoryRecord(source,input),materialized=validateStudioPageJson(materializeWorldFactoryData(source,record));return{record,data:materialized}}
