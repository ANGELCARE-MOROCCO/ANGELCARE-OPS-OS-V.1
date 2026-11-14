import { assertAdminLoginSameOrigin } from "@/angelcare-marketplace/auth/admin/admin-auth";
import { requireMarketplaceApiContext } from "@/angelcare-marketplace/auth/context";
import { apiFailure, apiSuccess, requestId, parseJsonObject } from "@/angelcare-marketplace/server/request";
import { MarketplaceError } from "@/angelcare-marketplace/server/errors";
import { archiveCommerceResource } from "@/angelcare-marketplace/commerce-studio/repository";
import { listMediaUsageReferences } from "@/angelcare-marketplace/total-commerce-control/repository";
import { writeMarketplaceAudit } from "@/angelcare-marketplace/audit/write-audit";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const UUID=/^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const privateResponse=(response:Response)=>{response.headers.set("Cache-Control","private, no-store");response.headers.set("Vary","Cookie");return response};
export async function POST(request:Request){
 const rid=requestId(request);
 try{
  const ctx=await requireMarketplaceApiContext("marketplace.media.manage");
  if(!request.headers.get("origin")||!assertAdminLoginSameOrigin(request)||request.headers.get("sec-fetch-site")==="cross-site")
   throw new MarketplaceError("FORBIDDEN","Cross-origin media mutation rejected.");
  const body=await parseJsonObject(request);
  const ids=body.ids;
  if(!Array.isArray(ids)||ids.length===0||ids.length>50||ids.some(id=>typeof id!=="string"||!UUID.test(id))||new Set(ids).size!==ids.length)
   throw new MarketplaceError("VALIDATION_ERROR","Select 1–50 unique valid native media IDs.");
  const result:{id:string;state:"archived"|"blocked"|"failed";reason:string;usageCount?:number}[]=[];
  // Sequential preflight and mutation preserve meaningful partial results and
  // avoid unbounded fanout across commerce publication/usage registries.
  for(const id of ids){
   try{
    const refs=await listMediaUsageReferences(id);
    if(refs.length){
      result.push({id,state:"blocked",reason:"Media is referenced by native placements; archive refused.",usageCount:refs.length});
      continue;
    }
    const record=await archiveCommerceResource({resource:"media",id,context:ctx});
    await writeMarketplaceAudit({context:ctx,requestId:rid,action:"marketplace.media.vault360.archived",objectType:"media_asset",objectId:id,result:"success",severity:"info",afterValue:{status:record.record.status},source:"media-import-vault360",request});
    result.push({id,state:"archived",reason:"Archived with zero confirmed references"});
   }catch(e){
    result.push({id,state:"failed",reason:e instanceof Error?e.message:"Archive could not be verified"});
   }
  }
  return privateResponse(apiSuccess({results:result,archived:result.filter(x=>x.state==="archived").length,blocked:result.filter(x=>x.state==="blocked").length,failed:result.filter(x=>x.state==="failed").length},{requestId:rid}));
 }catch(e){return privateResponse(apiFailure(e,rid))}
}
