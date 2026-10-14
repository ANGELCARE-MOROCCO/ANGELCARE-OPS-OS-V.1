import { requireMarketplaceApiContext,hasMarketplacePermission } from '../auth/context'
import { apiFailure,apiSuccess,parseJsonObject,requestId } from '../server/request'
import { MarketplaceError } from '../server/errors'
import type { MarketplacePermission,MarketplaceRequestContext } from '../domain/types'
import { text,type Row } from '../catalogue-population/model'
import * as repo from './repository'
function requirePermission(context:MarketplaceRequestContext,key:MarketplacePermission){if(!hasMarketplacePermission(context,key))throw new MarketplaceError('FORBIDDEN','Permission requise : '+key)}
export async function handleCatalogueImport(request:Request){const rid=requestId(request);try{
 const context=await requireMarketplaceApiContext('marketplace.category_native_import.view');requirePermission(context,'marketplace.catalog.view')
 const url=new URL(request.url),part=url.searchParams.get('part')||'bootstrap',id=text(url.searchParams.get('id')),page=Math.max(1,Math.min(100000,Number(url.searchParams.get('page'))||1))
 if(request.method==='GET'){
  if(part==='bootstrap')return apiSuccess(await repo.bootstrap(),{requestId:rid})
  if(part==='runs')return apiSuccess(await repo.runPage(context,page),{requestId:rid})
  if(part==='run')return apiSuccess({run:await repo.readRun(id,context),counts:await repo.counts(id,context)},{requestId:rid})
  if(part==='lines')return apiSuccess(await repo.linesPage(id,context,page,text(url.searchParams.get('status'))),{requestId:rid})
  if(part==='export'){requirePermission(context,'marketplace.catalog.export');return apiSuccess(await repo.exportRun(id,context),{requestId:rid})}
  throw new MarketplaceError('VALIDATION_ERROR','Lecture d’import inconnue.')
 }
 if(request.method!=='POST')throw new MarketplaceError('VALIDATION_ERROR','Méthode inconnue.')
 requirePermission(context,'marketplace.category_native_import.manage');requirePermission(context,'marketplace.catalog.manage')
 const body=await parseJsonObject(request) as Row,action=text(body.action),runId=text(body.id)
 if(action==='create'){
  return apiSuccess(await repo.createRun(body,context),{requestId:rid,status:201})
 }
 if(action==='asset'){requirePermission(context,'marketplace.media.manage');return apiSuccess(await repo.registerAsset(runId,body,context),{requestId:rid})}
 if(action==='prepare')return apiSuccess(await repo.prepareNext(runId,context),{requestId:rid})
 if(action==='execute'||action==='rollback'){
  const run=await repo.assertRunRights(runId,context)
  if(await repo.requiresPublication(runId,context))requirePermission(context,'marketplace.catalog.publish')
  return apiSuccess(action==='execute'?await repo.executeNext(runId,body,context):await repo.rollbackNext(runId,body,context),{requestId:rid})
 }
 throw new MarketplaceError('VALIDATION_ERROR','Action d’import inconnue.')
}catch(error){return apiFailure(error,rid)}}
