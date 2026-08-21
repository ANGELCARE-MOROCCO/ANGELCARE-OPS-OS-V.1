import { governRoute } from '@/lib/runtime/governor/route'
import { NextResponse } from "next/server"
import { emailOSAIEnvStatus } from "@/lib/email-os-core/final-ai"

async function GET__angelcareGovernedImpl() {
  return NextResponse.json({
    ok: true,
    data: emailOSAIEnvStatus()
  })
}

export const GET = governRoute(
  {
    workloadClass: 'ai',
    operation: 'GET:/api/email-os/final/ai/status',
  },
  GET__angelcareGovernedImpl,
)
