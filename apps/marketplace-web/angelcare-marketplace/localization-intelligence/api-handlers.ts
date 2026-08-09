import path from 'node:path'

import { requireMarketplaceApiContext } from '../auth/context'
import {
  apiFailure,
  apiSuccess,
  parseJsonObject,
  requestId,
} from '../server/request'
import {
  createScan,
  listInventory,
  localizationSummary,
} from './repository'
import type {
  FreshnessState,
  ScanRequest,
  ScanType,
  SourceAdapterType,
  TranslationStatus,
} from './types'

const scanTypes = new Set<string>([
  'full',
  'incremental',
  'source',
  'route',
  'prepublication',
  'prerelease',
  'territory',
])

const sourceAdapters = new Set<string>([
  'source_ast',
  'backend_api',
  'database_registry',
  'runtime_render',
  'communication_template',
  'seo_metadata',
  'export_header',
  'content_file',
])

const freshnessStates = new Set<string>([
  'current',
  'new',
  'changed',
  'translation_stale',
  'missing',
  'orphaned',
  'unresolved',
  'blocked',
  'ignored_with_reason',
])

const translationStatuses = new Set<string>([
  'discovered',
  'triaged',
  'keyed',
  'translation_required',
  'draft',
  'translated',
  'in_review',
  'reviewed',
  'approved',
  'published',
  'stale',
  'rejected',
  'archived',
])

function parseScanType(value: unknown): ScanType {
  const candidate = typeof value === 'string' ? value : 'full'
  return scanTypes.has(candidate) ? (candidate as ScanType) : 'full'
}

function parseSourceAdapters(
  value: unknown,
): SourceAdapterType[] | undefined {
  if (!Array.isArray(value)) return undefined

  return value
    .map(String)
    .filter(
      (candidate): candidate is SourceAdapterType =>
        sourceAdapters.has(candidate),
    )
}

function parseFreshnessState(
  value: string | null,
): FreshnessState | undefined {
  return value && freshnessStates.has(value)
    ? (value as FreshnessState)
    : undefined
}

function parseTranslationStatus(
  value: string | null,
): TranslationStatus | undefined {
  return value && translationStatuses.has(value)
    ? (value as TranslationStatus)
    : undefined
}

function parseSourceAdapter(
  value: string | null,
): SourceAdapterType | undefined {
  return value && sourceAdapters.has(value)
    ? (value as SourceAdapterType)
    : undefined
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export async function handleLocalizationSummary(
  request: Request,
) {
  const id = requestId(request)

  try {
    await requireMarketplaceApiContext(
      'marketplace.localization.access',
    )

    return apiSuccess(await localizationSummary(), {
      requestId: id,
    })
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleCreateScan(
  request: Request,
) {
  const id = requestId(request)

  try {
    const context = await requireMarketplaceApiContext(
      'marketplace.localization.scans.run',
    )

    const body = await parseJsonObject(request)

    const scanRequest: ScanRequest = {
      type: parseScanType(body.type),
      adapters: parseSourceAdapters(body.adapters),
      changedPaths: Array.isArray(body.changedPaths)
        ? body.changedPaths.map(String)
        : undefined,
      routePrefix: body.routePrefix
        ? String(body.routePrefix)
        : undefined,
      territoryCode: body.territoryCode
        ? String(body.territoryCode)
        : undefined,
    }

    return apiSuccess(
      await createScan({
        request: scanRequest,
        context,
        requestId: id,
        httpRequest: request,
        appRoot: path.resolve(process.cwd()),
      }),
      {
        requestId: id,
        status: 201,
      },
    )
  } catch (error) {
    return apiFailure(error, id)
  }
}

export async function handleInventory(
  request: Request,
) {
  const id = requestId(request)

  try {
    await requireMarketplaceApiContext(
      'marketplace.localization.inventory.view',
    )

    const url = new URL(request.url)

    const result = await listInventory({
      q: url.searchParams.get('q') || undefined,
      domain: url.searchParams.get('domain') || undefined,
      route: url.searchParams.get('route') || undefined,
      territoryId:
        url.searchParams.get('territoryId') || undefined,
      freshness: parseFreshnessState(
        url.searchParams.get('freshness'),
      ),
      status: parseTranslationStatus(
        url.searchParams.get('status'),
      ),
      sensitivity:
        url.searchParams.get('sensitivity') || undefined,
      adapter: parseSourceAdapter(
        url.searchParams.get('adapter'),
      ),
      page: parsePositiveInteger(
        url.searchParams.get('page'),
        1,
      ),
      pageSize: parsePositiveInteger(
        url.searchParams.get('pageSize'),
        50,
      ),
    })

    return apiSuccess(result.rows, {
      requestId: id,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.count,
      },
    })
  } catch (error) {
    return apiFailure(error, id)
  }
}
