import { requireMarketplaceApiContext } from "@/angelcare-marketplace/auth/context";
import { apiFailure, apiSuccess } from "@/angelcare-marketplace/server/request";
import { MarketplaceError } from "@/angelcare-marketplace/server/errors";
import { listMediaUsageReferences } from "@/angelcare-marketplace/total-commerce-control/repository";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const UUID=/^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
export async function GET(_request:Request,{params}:{params:Promise<{assetId:string}>}){
 let response:Response;
 try{
   await requireMarketplaceApiContext("marketplace.media.view");
   const {assetId}=await params;
   if(!UUID.test(assetId))throw new MarketplaceError("VALIDATION_ERROR","Invalid media asset ID.");
   response=apiSuccess(await listMediaUsageReferences(assetId));
 }catch(error){response=apiFailure(error)}
 response.headers.set("Cache-Control","private, no-store");
 response.headers.set("Vary","Cookie");
 return response;
}
