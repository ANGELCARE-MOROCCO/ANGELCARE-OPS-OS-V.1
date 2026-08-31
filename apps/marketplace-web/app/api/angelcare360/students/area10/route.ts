import { publicAngelcare360Error } from '@/lib/angelcare360/server/public-error'
import { NextRequest, NextResponse } from 'next/server'
import { Angelcare360AccessError } from '@/lib/angelcare360/server/context'
import {
  executeAngelcare360Area10Operation,
  loadAngelcare360Area10StudentCommand,
} from '@/lib/angelcare360/server/student360-area10'
import type { Angelcare360Area10MutationRequest } from '@/types/angelcare360/student360-area10'

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
    const data = await loadAngelcare360Area10StudentCommand({
      view: request.nextUrl.searchParams.get('view'),
      studentId: request.nextUrl.searchParams.get('student'),
    })
    return NextResponse.json({ ok: true, data }, { status: 200 })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Angelcare360Area10MutationRequest | null
    if (!body?.operation || !body.studentId || !body.idempotencyKey) {
      return NextResponse.json({ ok: false, error: 'Opération, élève et clé d’intégrité sont obligatoires.' }, { status: 422 })
    }
    const result = await executeAngelcare360Area10Operation(body)
    return NextResponse.json(result, { status: result.ok ? 200 : 409 })
  } catch (error) {
    return errorResponse(error)
  }
}
