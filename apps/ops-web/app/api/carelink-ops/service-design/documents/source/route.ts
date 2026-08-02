import { NextResponse } from 'next/server'
import { getCurrentAppUser } from '@/lib/auth/session'
import { canUseServiceDesignDocuments } from '@/components/carelink/service-design/documents/server/access'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveServiceDocumentSource } from '@/components/carelink/service-design/documents/server/sourceResolver'
import type { ServiceDocumentSourceKind } from '@/components/carelink/service-design/documents/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const kinds = new Set<ServiceDocumentSourceKind>(['plan', 'sellable', 'handoff', 'executive', 'custom'])

export async function GET(request: Request) {
  const user = await getCurrentAppUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Authentification ANGELCARE requise.' }, { status: 401 })
  if (!canUseServiceDesignDocuments(user as Record<string, unknown>)) return NextResponse.json({ ok: false, error: 'Autorité Service Design insuffisante pour produire ce document.' }, { status: 403 })
  const url = new URL(request.url)
  const rawKind = url.searchParams.get('kind') || 'custom'
  const id = url.searchParams.get('id') || ''
  if (!kinds.has(rawKind as ServiceDocumentSourceKind)) return NextResponse.json({ ok: false, error: 'Type de source document non supporté.' }, { status: 400 })
  if (!id) return NextResponse.json({ ok: false, error: 'Identifiant de source requis.' }, { status: 400 })
  try {
    const client = await createServiceClient()
    const resolved = await resolveServiceDocumentSource(client, rawKind as ServiceDocumentSourceKind, id)
    if (!resolved) return NextResponse.json({ ok: false, error: 'La source demandée est absente ou inaccessible. Aucun contenu n’a été inventé.' }, { status: 404 })
    return NextResponse.json({ ok: true, source: resolved.source, resolution: { table: resolved.table, relatedTables: resolved.relatedTables, actorId: String((user as Record<string, unknown>).id || '') } })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Résolution documentaire impossible.' }, { status: 500 })
  }
}
