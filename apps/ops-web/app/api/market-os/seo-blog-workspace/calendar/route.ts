import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      note: "Editorial calendar API ready for Supabase-backed production scheduling.",
      mode: "local-first",
    },
  })
}
