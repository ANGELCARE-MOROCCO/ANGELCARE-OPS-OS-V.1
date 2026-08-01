import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { canonicalSearch } from "@/lib/market-os/content-command-headquarters/canonical-legacy-api-service"
export async function POST(request:Request){try{await requireContentHeadquartersUser("view");const body=await request.json();const query=String(body.query||body.q||"");return NextResponse.json({ok:true,query,results:await canonicalSearch(query),source:"market_content_canonical"})}catch(error){return contentHeadquartersApiError(error)}}
