import { governRoute } from '@/lib/runtime/governor/route'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/session'
import { OPERATION_AREAS, runOperationEnterpriseScan, summarizeModules, type OperationArea } from '@/lib/operation-completion/autonomous-core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function splitParam(value: string | null) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function sanitizeAreas(values: string[]) {
  const allowed = new Set<string>(OPERATION_AREAS)
  return values.filter((item) => allowed.has(item)) as OperationArea[]
}

async function GET__angelcareGovernedImpl(request: NextRequest) {
  await requireRole(['ceo', 'manager', 'admin'])

  const selectedModules = splitParam(request.nextUrl.searchParams.get('modules'))
  const selectedAreas = sanitizeAreas(splitParam(request.nextUrl.searchParams.get('areas')))
  const maxFiles = Number(request.nextUrl.searchParams.get('maxFiles') || '1600')

  const scan = await runOperationEnterpriseScan({ selectedModules, selectedAreas, maxFiles })

  return NextResponse.json({
    ...scan,
    registry: {
      modules: summarizeModules(),
      areas: OPERATION_AREAS,
    },
  })
}

async function POST__angelcareGovernedImpl(request: NextRequest) {
  await requireRole(['ceo', 'manager', 'admin'])

  const body = await request.json().catch(() => ({}))
  const selectedModules = Array.isArray(body.selectedModules) ? body.selectedModules.map(String) : []
  const selectedAreas = sanitizeAreas(Array.isArray(body.selectedAreas) ? body.selectedAreas.map(String) : [])
  const maxFiles = Number(body.maxFiles || 1600)

  const scan = await runOperationEnterpriseScan({ selectedModules, selectedAreas, maxFiles })

  return NextResponse.json({
    ...scan,
    registry: {
      modules: summarizeModules(),
      areas: OPERATION_AREAS,
    },
  })
}

export const GET = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'GET:/api/operation-completion/scan',
  },
  GET__angelcareGovernedImpl,
)

export const POST = governRoute(
  {
    workloadClass: 'heavy',
    operation: 'POST:/api/operation-completion/scan',
  },
  POST__angelcareGovernedImpl,
)
