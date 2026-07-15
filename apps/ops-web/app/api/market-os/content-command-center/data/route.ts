import { NextResponse } from "next/server"

type ContentCommandDataResponse = {
  ok: boolean
  source: "live-contract"
  tasks: unknown[]
  assets: unknown[]
  briefs: unknown[]
  rules: unknown[]
  logs: unknown[]
  items: unknown[]
  loadedAt: string
  message: string
}

/*
  Content Command Center live-data contract.

  This endpoint intentionally returns empty arrays until the real database
  repository is wired. This is production-safer than rendering fake seed
  business records as if they were live operational data.
*/
export async function GET() {
  const response: ContentCommandDataResponse = {
    ok: true,
    source: "live-contract",
    tasks: [],
    assets: [],
    briefs: [],
    rules: [],
    logs: [],
    items: [],
    loadedAt: new Date().toISOString(),
    message: "Content Command live-data contract active. No production records returned yet.",
  }

  return NextResponse.json(response)
}
