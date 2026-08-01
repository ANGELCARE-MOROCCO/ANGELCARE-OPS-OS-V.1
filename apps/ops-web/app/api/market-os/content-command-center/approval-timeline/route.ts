import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { canonicalComments } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export async function GET(request:Request){try{await requireContentHeadquartersUser("view");const id=new URL(request.url).searchParams.get("entity_id")||undefined;const rows=await canonicalComments({dossierId:id});return NextResponse.json({ok:true,timeline:rows.filter((row:any)=>String(row.note_type||row.type||"").includes("approval")),source:"market_content_notes"})}catch(error){return contentHeadquartersApiError(error)}}
