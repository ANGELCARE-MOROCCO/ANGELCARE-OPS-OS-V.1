import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { canonicalComments, saveCanonicalComment } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export const dynamic = "force-dynamic"
export async function GET(request:Request){try{await requireContentHeadquartersUser("view");const params=new URL(request.url).searchParams;return NextResponse.json({ok:true,comments:await canonicalComments({dossierId:params.get("entity_id")||undefined,taskId:params.get("task_id")||undefined,templateId:params.get("template_id")||undefined}),source:"market_content_canonical"})}catch(error){return contentHeadquartersApiError(error)}}
export async function POST(request:Request){try{const actor=await requireContentHeadquartersUser("operate");const record=await saveCanonicalComment(actor,await request.json());return NextResponse.json({ok:true,record,comment:record,persisted:true,source:"market_content_canonical"})}catch(error){return contentHeadquartersApiError(error)}}
