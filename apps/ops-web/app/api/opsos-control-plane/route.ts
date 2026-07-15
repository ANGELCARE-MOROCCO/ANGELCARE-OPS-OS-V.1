import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildOpsosRuntimeSnapshot } from '@/lib/opsos-control-plane/data'
import { mergeLiveTelemetryIntoSnapshot } from '@/lib/opsos-control-plane/live-telemetry'

export const dynamic = 'force-dynamic'

type StoredSnapshotRow = {
  id?: string
  snapshot?: unknown
  created_at?: string
}

async function readSupabaseSnapshot() {
  try {
    const supabase = await createClient()
    const result = await supabase
      .from('opsos_runtime_snapshots')
      .select('id,snapshot,created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const row = result.data as StoredSnapshotRow | null
    if (!result.error && row?.snapshot) {
      return row.snapshot
    }
  } catch {
    // The control plane is designed to boot before the migration is installed.
  }

  return null
}

export async function GET() {
  const stored = await readSupabaseSnapshot()
  const baseSnapshot = (stored || buildOpsosRuntimeSnapshot()) as ReturnType<typeof buildOpsosRuntimeSnapshot>
  const snapshot = await mergeLiveTelemetryIntoSnapshot(baseSnapshot)

  return NextResponse.json({
    ok: true,
    source: stored ? 'supabase+live-telemetry' : 'seed-runtime+live-telemetry',
    snapshot,
  }, {
    headers: {
      'cache-control': 'no-store',
    },
  })
}
