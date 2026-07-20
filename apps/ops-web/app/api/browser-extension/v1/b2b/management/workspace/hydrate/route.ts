import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtensionRequest } from '@/lib/browser-extension/runtime'
import { authorizeManagementWorkspaceHydration } from '@/lib/browser-extension/b2b-management-command/authorization'
import { hydrateB2BManagementWorkspace } from '@/lib/browser-extension/b2b-management-command/workspace'

export async function POST(req: NextRequest) {
  const auth = await authenticateExtensionRequest(req)
  if (!auth.ok) return auth.response
  const decision = await authorizeManagementWorkspaceHydration(auth.db, auth.context.user.id)
  if (!decision.ok) return NextResponse.json({ ok: false, error: decision.error }, { status: decision.status })
  const body = await req.json().catch(() => ({}))
  try {
    const data = await hydrateB2BManagementWorkspace({ db: auth.db, actor: auth.context.user, access: decision.access, activeIds: body.activeIds || {} })
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: String(error?.message || 'MANAGEMENT_WORKSPACE_HYDRATION_FAILED'), details: error?.details || null }, { status: Number(error?.status || 500) })
  }
}
