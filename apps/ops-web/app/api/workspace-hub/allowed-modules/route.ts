import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/session'
import { loadAuthorizedWorkspaceHub } from '@/lib/workspace-hub/authorized-modules'
import { loadAuthorizedIndependentResources } from '@/lib/workspace-hub/authorized-resources'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireUser()
    const [data, independentResources] = await Promise.all([
      loadAuthorizedWorkspaceHub(user),
      loadAuthorizedIndependentResources(user),
    ])

    return NextResponse.json({
      ok: true,
      data,
      independentResources,
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
