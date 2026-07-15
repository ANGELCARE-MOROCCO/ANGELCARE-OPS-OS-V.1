import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { mode } = body

  if (mode === "overdue_sweep") {
    const { data, error } = await supabase.rpc("revenue_overdue_sweep")
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, inserted: data })
  }

  return NextResponse.json({ ok: true })
}
