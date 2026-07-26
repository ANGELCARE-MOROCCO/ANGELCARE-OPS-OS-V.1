import { NextResponse } from "next/server"
import { requireContentHeadquartersUser, contentHeadquartersApiError } from "@/lib/market-os/content-command-headquarters/auth"
import { getContentHeadquartersSnapshot } from "@/lib/market-os/content-command-headquarters/repository"

export const dynamic = "force-dynamic"
export async function GET() {
  try { await requireContentHeadquartersUser("view"); return NextResponse.json({ ok: true, snapshot: await getContentHeadquartersSnapshot() }) }
  catch (error) { return contentHeadquartersApiError(error) }
}
