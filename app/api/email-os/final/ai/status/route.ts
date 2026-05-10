import { NextResponse } from "next/server"
import { emailOSAIEnvStatus } from "@/lib/email-os-core/final-ai"

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: emailOSAIEnvStatus()
  })
}
