import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { listLegacyTasks, upsertLegacyTask } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export const dynamic = "force-dynamic"
export async function GET(){try{await requireContentHeadquartersUser("view");return NextResponse.json({ok:true,tasks:await listLegacyTasks(),source:"market_content_canonical"})}catch(error){return contentHeadquartersApiError(error)}}
export async function POST(request:Request){try{const actor=await requireContentHeadquartersUser("operate");const record=await upsertLegacyTask(actor,await request.json());return NextResponse.json({ok:true,record,task:record,persisted:true,source:"market_content_canonical"})}catch(error){return contentHeadquartersApiError(error)}}
