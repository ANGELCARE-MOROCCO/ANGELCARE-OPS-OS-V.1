import { NextResponse } from 'next/server'
import { contentHeadquartersApiError, requireContentHeadquartersUser } from '@/lib/market-os/content-command-headquarters/auth'
import { applyCanonicalCompatibilityCommit } from '@/lib/market-os/content-command-headquarters/canonical-compatibility-service'
import { auditContentHeadquarters } from '@/lib/market-os/content-command-headquarters/repository'
import type { CanonicalCommitPayload } from '@/lib/market-os/content-command-headquarters/canonical-compatibility-types'

export const dynamic = 'force-dynamic'

const clean = (value: unknown) => String(value || '').trim()

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as { action?: string; payload?: Record<string, unknown>; source?: string }
    const action = clean(body.action).toLowerCase()
    if (!action) throw new Error('ACTION_REQUIRED')

    if (action === 'canonical_store_commit') {
      const actor = await requireContentHeadquartersUser('operate')
      const payload = (body.payload || {}) as unknown as CanonicalCommitPayload
      if (!payload.before || !payload.after) throw new Error('CANONICAL_COMMIT_PAYLOAD_REQUIRED')
      const store = await applyCanonicalCompatibilityCommit({
        ...payload,
        actorId: actor.id,
        actorName: actor.name,
      })
      return NextResponse.json({ ok: true, persisted: true, source: 'market_content_canonical', store })
    }

    const actor = await requireContentHeadquartersUser('operate')
    await auditContentHeadquarters({
      actorId: actor.id,
      actorName: actor.name,
      action: `compatibility.command.${action}`,
      entityType: 'content_command',
      detail: { source: clean(body.source), payload: body.payload || {} },
    })
    return NextResponse.json({
      ok: false,
      persisted: false,
      error: 'ACTION_NOT_MIGRATED',
      action,
      canonicalRoute: '/market-os/content-command-center',
      message: 'This compatibility command has no canonical mutation. Use the linked canonical workspace.',
    }, { status: 409 })
  } catch (error) {
    return contentHeadquartersApiError(error)
  }
}
