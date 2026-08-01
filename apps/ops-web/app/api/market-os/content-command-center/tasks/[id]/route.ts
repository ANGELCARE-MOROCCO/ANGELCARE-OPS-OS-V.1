import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { archiveLegacyTask } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export const dynamic = "force-dynamic"
export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){try{const actor=await requireContentHeadquartersUser("cancel");const {id}=await params;await archiveLegacyTask(actor,id);return NextResponse.json({ok:true,persisted:true,action:"archived",source:"market_content_canonical"})}catch(error){return contentHeadquartersApiError(error)}}
