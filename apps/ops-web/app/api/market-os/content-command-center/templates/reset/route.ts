import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
export async function POST(){try{await requireContentHeadquartersUser("govern");return NextResponse.json({ok:false,error:"LEGACY_OPERATION_RETIRED",persisted:false,canonicalRoute:"/market-os/content-command-center"},{status:410})}catch(error){return contentHeadquartersApiError(error)}}
