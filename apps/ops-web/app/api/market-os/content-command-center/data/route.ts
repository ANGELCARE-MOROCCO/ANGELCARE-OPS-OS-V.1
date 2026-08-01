import { NextResponse } from 'next/server'
import { contentHeadquartersApiError, requireContentHeadquartersUser } from '@/lib/market-os/content-command-headquarters/auth'
import { getCanonicalCompatibilityStore } from '@/lib/market-os/content-command-headquarters/canonical-compatibility-service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    await requireContentHeadquartersUser('view')
    const store = await getCanonicalCompatibilityStore()
    return NextResponse.json({
      ok: true,
      source: 'market_content_canonical',
      store,
      items: store.items,
      tasks: store.tasks,
      assets: store.assets,
      briefs: store.briefs,
      rules: store.rules,
      logs: store.logs,
      loadedAt: new Date().toISOString(),
      message: 'Content Command canonical compatibility contract active.',
    })
  } catch (error) {
    return contentHeadquartersApiError(error)
  }
}
