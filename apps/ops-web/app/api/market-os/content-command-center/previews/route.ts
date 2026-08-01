import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { listLegacyAssets } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export async function GET(){try{await requireContentHeadquartersUser("view");const assets=await listLegacyAssets();return NextResponse.json({ok:true,previews:assets.filter((row:any)=>row.preview_url||row.storage_path),source:"market_content_evidence"})}catch(error){return contentHeadquartersApiError(error)}}
