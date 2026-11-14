import { requireMarketplaceApiContext } from "@/angelcare-marketplace/auth/context";
import { apiFailure, apiSuccess } from "@/angelcare-marketplace/server/request";
import { MarketplaceError } from "@/angelcare-marketplace/server/errors";
import { vaultFolders, vaultMedia } from "@/angelcare-marketplace/digital-customer-experience/media-vault-authority";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
function privateResponse(response:Response) {
  response.headers.set("Cache-Control","private, no-store");
  response.headers.set("Vary","Cookie");
  return response;
}
/**
 * Native, full-inventory media exploration, restricted to the canonical
 * marketplace.media.view permission. The DCE picker retains its stricter dual
 * permission requirement. This endpoint never writes or publishes media.
 */
export async function GET(request:Request){
  try {
    const ctx=await requireMarketplaceApiContext("marketplace.media.view");
    const url=new URL(request.url);
    const input=Object.fromEntries(url.searchParams);
    const op=String(input.op||"media");
    if(op!=="media"&&op!=="folders")
      throw new MarketplaceError("VALIDATION_ERROR","Unknown media vault operation.");
    const result=op==="folders"
      ?await vaultFolders(ctx,input,"media-import")
      :await vaultMedia(ctx,input,"media-import");
    return privateResponse(apiSuccess(result));
  }catch(error){return privateResponse(apiFailure(error))}
}
