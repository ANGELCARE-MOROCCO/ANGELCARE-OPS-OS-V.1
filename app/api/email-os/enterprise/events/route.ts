
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    ok: true,
    events: [],
    message: "Enterprise event stream placeholder. Connect this to Supabase realtime or websocket broker."
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  return NextResponse.json({
    ok: true,
    event: body,
    acceptedAt: new Date().toISOString()
  })
}
