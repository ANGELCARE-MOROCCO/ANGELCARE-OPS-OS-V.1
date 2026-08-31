import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import {
  executeAngelcare360Area9Operation,
  loadAngelcare360Area9AdmissionsCommand,
} from '@/lib/angelcare360/server/admissions-area9'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import type { Angelcare360Area9MutationRequest } from '@/types/angelcare360/admissions-area9'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function errorResponse(error: unknown) {
  if (error instanceof Angelcare360AccessError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status })
  }
  const message = publicAngelcare360Error(error)
  return NextResponse.json({ ok: false, error: message }, { status: 500 })
}

export async function GET(request: NextRequest) {
  try {
    const view = request.nextUrl.searchParams.get('view')
    const selectedId = request.nextUrl.searchParams.get('record')
    const data = await loadAngelcare360Area9AdmissionsCommand({ view, selectedId })
    return NextResponse.json({ ok: true, data }, { status: 200 })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Angelcare360Area9MutationRequest | null
    if (!body?.operation || !body.idempotencyKey) {
      return NextResponse.json(
        { ok: false, error: 'L’opération et sa clé d’intégrité sont obligatoires.' },
        { status: 422 },
      )
    }
    const result = await executeAngelcare360Area9Operation(body)
    return NextResponse.json(result, { status: result.ok ? 200 : 409 })
  } catch (error) {
    return errorResponse(error)
  }
}
