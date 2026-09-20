import { apiFailure,apiSuccess,parseJsonObject,requestId } from '@/angelcare-marketplace/server/request'
import { executeStudioWorkflow } from '@/angelcare-marketplace/studio-workflows/executor'
import { MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { getStudioWorkflowDescriptor } from '@/angelcare-marketplace/studio-workflows/registry'
import type { StudioWorkflowSubmissionInput } from '@/angelcare-marketplace/studio-workflows/types'

export const runtime='nodejs'
export const dynamic='force-dynamic'

export async function POST(request:Request,{params}:{params:Promise<{workflowId:string}>}){
  const id=requestId(request)
  try{
    const {workflowId}=await params
    if(!getStudioWorkflowDescriptor(workflowId))throw new MarketplaceError('NOT_FOUND','Workflow Studio inconnu.')
    const body=await parseJsonObject(request)
    const locale=String(body.locale||'fr');if(!['fr','en','ar'].includes(locale))throw new MarketplaceError('VALIDATION_ERROR','Langue invalide.')
    const reference=body.reference&&typeof body.reference==='object'&&!Array.isArray(body.reference)?body.reference as StudioWorkflowSubmissionInput['reference']:{version:1,workflowId}
    if(reference.workflowId!==workflowId)throw new MarketplaceError('VALIDATION_ERROR','Référence workflow incohérente.')
    const values=body.values&&typeof body.values==='object'&&!Array.isArray(body.values)?body.values as StudioWorkflowSubmissionInput['values']:{}
    const result=await executeStudioWorkflow({reference,locale:locale as 'fr'|'en'|'ar',sourceRoute:String(body.sourceRoute||'/').slice(0,500),territoryCode:body.territoryCode?String(body.territoryCode).slice(0,80):null,visitorReference:body.visitorReference?String(body.visitorReference).slice(0,180):null,idempotencyKey:body.idempotencyKey?String(body.idempotencyKey).slice(0,220):null,attribution:body.attribution&&typeof body.attribution==='object'&&!Array.isArray(body.attribution)?body.attribution as StudioWorkflowSubmissionInput['attribution']:undefined,values},request,id)
    return apiSuccess(result,{requestId:id,status:201})
  }catch(error){return apiFailure(error,id)}
}
