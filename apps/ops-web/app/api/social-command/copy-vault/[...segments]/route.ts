import { requireSocialCommandActor, requireSocialCommandRoutePermission, socialError, socialOk } from "@/lib/social-command/auth"
import { cleanString, jsonObject } from "@/lib/social-command/db"
import {
  approveCopyVersion, archiveCopyItem, bulkCopyAction, commitCopyCsv, createCopyCategory,
  createCopyItem, createCopyRevision, findSimilarCopy, getCopyItem, listCopyVault,
  pickerCopy, previewCopyCsv, purgeCopyCategory, purgeCopyItem, recordCopyUsage,
  rejectCopyVersion, restoreCopyItem, setCopyCategoryLifecycle, submitCopyVersion,
  trashCopyItem, updateCopyCategory,
} from "@/lib/social-command/copy-vault"
import type { CopyVaultImportMapping } from "@/lib/social-command/copy-vault-types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type RouteContext = { params: Promise<{ segments: string[] }> }
function key(segments:string[]){return segments.join("/")}
async function actorOrResponse(){const auth=await requireSocialCommandActor();return auth}
async function bodyJson(request:Request){return request.json().catch(()=>({})) as Promise<Record<string,unknown>>}
function inputFromUrl(request:Request){const url=new URL(request.url);const out:Record<string,unknown>={};url.searchParams.forEach((value,name)=>{out[name]=value});return out}

export async function GET(request:Request,context:RouteContext){
  const {segments=[]}=await context.params; const route=key(segments)
  try{
    const auth=await actorOrResponse(); if(!auth.ok)return auth.response
    const access=requireSocialCommandRoutePermission(auth.actor,"GET",`copy-vault/${route}`); if(!access.ok)return access.response
    if(route==="library")return socialOk(await listCopyVault(inputFromUrl(request),auth.actor))
    if(route==="picker")return socialOk(await pickerCopy(inputFromUrl(request),auth.actor))
    if(route.startsWith("items/")){const id=cleanString(segments[1],120);if(!id)throw new Error("Copy Vault item id required");return socialOk(await getCopyItem(id,auth.actor))}
    return socialError(new Error("COPY_VAULT_ROUTE_NOT_FOUND"),404)
  }catch(error){return socialError(error,400)}
}

export async function POST(request:Request,context:RouteContext){
  const {segments=[]}=await context.params; const route=key(segments)
  try{
    const auth=await actorOrResponse(); if(!auth.ok)return auth.response
    const access=requireSocialCommandRoutePermission(auth.actor,"POST",`copy-vault/${route}`); if(!access.ok)return access.response
    const body=await bodyJson(request)
    if(route==="items")return socialOk(await createCopyItem(body,auth.actor),{status:201})
    if(route==="similar")return socialOk(await findSimilarCopy(cleanString(body.body,30000),auth.actor,cleanString(body.excludeItemId,120)||undefined))
    if(route==="categories")return socialOk(await createCopyCategory(body,auth.actor),{status:201})
    if(/^categories\/[^/]+$/.test(route))return socialOk(await updateCopyCategory(segments[1],body,auth.actor))
    if(/^categories\/[^/]+\/(archive|restore|trash)$/.test(route)){
      const action=segments[2] as "archive"|"restore"|"trash"
      return socialOk(await setCopyCategoryLifecycle(segments[1],action==="restore"?"active":action==="archive"?"archived":"trashed",auth.actor))
    }
    if(/^categories\/[^/]+\/purge$/.test(route))return socialOk(await purgeCopyCategory(segments[1],cleanString(body.confirmation,80),auth.actor))
    if(/^items\/[^/]+\/revisions$/.test(route))return socialOk(await createCopyRevision(segments[1],body,auth.actor),{status:201})
    if(/^items\/[^/]+\/submit$/.test(route))return socialOk(await submitCopyVersion(segments[1],Math.max(1,Number(body.versionNo||body.version_no||1)),auth.actor))
    if(/^items\/[^/]+\/approve$/.test(route))return socialOk(await approveCopyVersion(segments[1],Math.max(1,Number(body.versionNo||body.version_no||1)),cleanString(body.note,2000),auth.actor))
    if(/^items\/[^/]+\/reject$/.test(route))return socialOk(await rejectCopyVersion(segments[1],Math.max(1,Number(body.versionNo||body.version_no||1)),cleanString(body.note,2000),auth.actor))
    if(/^items\/[^/]+\/archive$/.test(route))return socialOk(await archiveCopyItem(segments[1],auth.actor))
    if(/^items\/[^/]+\/restore$/.test(route))return socialOk(await restoreCopyItem(segments[1],auth.actor))
    if(/^items\/[^/]+\/trash$/.test(route))return socialOk(await trashCopyItem(segments[1],auth.actor))
    if(/^items\/[^/]+\/purge$/.test(route))return socialOk(await purgeCopyItem(segments[1],cleanString(body.confirmation,80),auth.actor))
    if(route==="import/preview")return socialOk(await previewCopyCsv(cleanString(body.csv,2_000_000),jsonObject(body.mapping) as CopyVaultImportMapping,auth.actor))
    if(route==="import/commit")return socialOk(await commitCopyCsv(
      cleanString(body.csv,2_000_000),
      jsonObject(body.mapping) as CopyVaultImportMapping,
      cleanString(body.filename,260),
      auth.actor,
      {
        duplicatePolicy:cleanString(body.duplicatePolicy,20)==="import"?"import":"skip",
        importState:["draft","in_review","approved"].includes(cleanString(body.importState??body.import_state,40).toLowerCase())
          ?cleanString(body.importState??body.import_state,40).toLowerCase() as "draft"|"in_review"|"approved"
          :undefined,
      },
    ))
    if(route==="usage")return socialOk(await recordCopyUsage(body,auth.actor),{status:201})
    if(route==="bulk-action")return socialOk(await bulkCopyAction(body,auth.actor))
    return socialError(new Error("COPY_VAULT_ROUTE_NOT_FOUND"),404)
  }catch(error){return socialError(error,400)}
}
