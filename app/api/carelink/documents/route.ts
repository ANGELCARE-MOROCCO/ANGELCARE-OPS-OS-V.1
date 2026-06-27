import { NextResponse } from 'next/server'
import { carelinkMobileErrorResponse } from '@/lib/carelink/mobile-auth'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { loadAgentDocuments } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    const documents = await loadAgentDocuments(workspace.agent?.id ? Number(workspace.agent.id) : null)
    return NextResponse.json({ ok: true, data: documents })
  } catch (error) {
    return carelinkMobileErrorResponse(error, 'Load CareLink documents failed')
  }
}
