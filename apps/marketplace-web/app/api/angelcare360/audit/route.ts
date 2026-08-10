import { NextRequest, NextResponse } from 'next/server'
import { angelcare360AuditEventSchema } from '@/lib/angelcare360/validation'
import {
  Angelcare360AccessError,
  requireAngelcare360Permission,
} from '@/lib/angelcare360/server'
import { recordAngelcare360AuditEventServer } from '@/lib/angelcare360/server/audit'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = angelcare360AuditEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Le payload d’audit est invalide.',
          details: parsed.errors,
        },
        { status: 422 },
      )
    }

    const context = await requireAngelcare360Permission('audit.log.create', {
      schoolId: parsed.data.schoolId || null,
    })

    const result = await recordAngelcare360AuditEventServer({
      ...parsed.data,
      schoolId: context.school?.id || parsed.data.schoolId || null,
    })

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || 'Impossible d’enregistrer l’audit.',
        },
        { status: result.error?.includes('Aucun établissement actif') ? 503 : 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      record: result.record,
    })
  } catch (error) {
    if (error instanceof Angelcare360AccessError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: error.status },
      )
    }

    const message = error instanceof Error ? error.message : 'Erreur inattendue'
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    )
  }
}

