import { NextResponse } from 'next/server'
import { loadCarelinkMobileWorkspace } from '@/lib/carelink/mobile-adapter'
import { loadAgentDocuments } from '@/lib/carelink/mobile-persistence'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workspace = await loadCarelinkMobileWorkspace()
    const documents = await loadAgentDocuments(workspace.agent?.id ? Number(workspace.agent.id) : null)
    if (documents.length) {
      return NextResponse.json({ ok: true, data: documents })
    }
    return NextResponse.json({ ok: true, data: [
      { name: 'CIN', status: 'valid' },
      { name: 'Contrat', status: 'valid' },
      { name: 'Certificat Academy', status: 'valid' },
    ] })
  } catch (error) {
    return NextResponse.json({ ok: false, data: [], error: error instanceof Error ? error.message : 'Load CareLink documents failed' }, { status: 500 })
  }
}
