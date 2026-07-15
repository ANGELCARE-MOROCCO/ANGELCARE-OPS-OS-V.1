import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { loadAuthorizedWorkspaceHub } from '@/lib/workspace-hub/authorized-modules'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireUser()
    const data = await loadAuthorizedWorkspaceHub(user)

    return NextResponse.json({
      ok: true,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to load authorized workspace hub.',
      },
      { status: 500 },
    )
  }
}
