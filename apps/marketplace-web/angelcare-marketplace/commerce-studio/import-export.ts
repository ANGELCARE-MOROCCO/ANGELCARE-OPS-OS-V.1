import { requireMarketplaceApiContext } from '../auth/context'
import { writeMarketplaceAudit } from '../audit/write-audit'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import { MarketplaceError } from '../server/errors'
import type { CommerceResource, CommerceRecord } from './types'
import { commerceResource } from './validation'
import { createCommerceResource, listCommerceResource, updateCommerceResource } from './repository'

const IMPORTABLE = new Set<CommerceResource>([
  'catalog-items',
  'catalog-variants',
  'catalog-categories',
  'catalog-item-categories',
  'homepage-collections',
  'homepage-collection-items',
  'homepage-placements',
  'navigation-items',
  'price-rules',
  'catalog-availability',
  'merchandising-rules',
])

function csvEscape(value: unknown): string {
  const text = value === null || value === undefined
    ? ''
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value)

  return /[",\n]/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text
}

function toCsv(records: CommerceRecord[]): string {
  const headers = [...new Set(records.flatMap((entry) => Object.keys(entry)))].sort()

  return [
    headers.join(','),
    ...records.map((entry) => headers.map((header) => csvEscape(entry[header])).join(',')),
  ].join('\n')
}


function parseCsv(source: string): Record<string, unknown>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') { field += '"'; index += 1 }
      else if (character === '"') quoted = false
      else field += character
    } else if (character === '"') quoted = true
    else if (character === ',') { row.push(field); field = '' }
    else if (character === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = '' }
    else field += character
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row) }
  const headers = rows.shift()?.map((value) => value.trim()) || []
  return rows.filter((values) => values.some((value) => value.trim())).map((values) => Object.fromEntries(headers.map((header, index) => {
    const raw = values[index] ?? ''
    if (!raw) return [header, '']
    if (raw === 'true') return [header, true]
    if (raw === 'false') return [header, false]
    if (/^-?\d+(?:\.\d+)?$/.test(raw)) return [header, Number(raw)]
    if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
      try { return [header, JSON.parse(raw)] } catch { return [header, raw] }
    }
    return [header, raw]
  })))
}

async function importPayload(request: Request): Promise<{ records: Record<string, unknown>[]; dryRun: boolean }> {
  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw new MarketplaceError('VALIDATION_ERROR', 'Un fichier CSV ou JSON est requis.')
    const source = await file.text()
    const records = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv')
      ? parseCsv(source)
      : JSON.parse(source) as Record<string, unknown>[]
    return { records: Array.isArray(records) ? records : [], dryRun: form.get('dry_run') !== 'false' }
  }
  if (contentType.includes('text/csv')) {
    return { records: parseCsv(await request.text()), dryRun: new URL(request.url).searchParams.get('dry_run') !== 'false' }
  }
  const body = await parseJsonObject(request)
  return {
    records: Array.isArray(body.records) ? body.records.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry)) : [],
    dryRun: body.dry_run !== false,
  }
}

export async function handleCommerceExport(
  request: Request,
  rawResource: string,
): Promise<Response> {
  const rid = requestId(request)

  try {
    const resource = commerceResource(rawResource)

    if (!IMPORTABLE.has(resource)) {
      throw new MarketplaceError(
        'VALIDATION_ERROR',
        'Export non pris en charge pour cette ressource.',
      )
    }

    await requireMarketplaceApiContext('marketplace.commerce.export')
    const records = await listCommerceResource(resource)
    const url = new URL(request.url)

    if (url.searchParams.get('format') === 'json') {
      return apiSuccess(records, { requestId: rid })
    }

    return new Response(toCsv(records), {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename=angelcare-${resource}.csv`,
        'x-request-id': rid,
      },
    })
  } catch (error) {
    return apiFailure(error, rid)
  }
}

export async function handleCommerceImport(
  request: Request,
  rawResource: string,
): Promise<Response> {
  const rid = requestId(request)

  try {
    const resource = commerceResource(rawResource)

    if (!IMPORTABLE.has(resource)) {
      throw new MarketplaceError(
        'VALIDATION_ERROR',
        'Import non pris en charge pour cette ressource.',
      )
    }

    const context = await requireMarketplaceApiContext('marketplace.commerce.import')
    const { records, dryRun } = await importPayload(request)

    if (!records.length) {
      throw new MarketplaceError('VALIDATION_ERROR', 'Aucune ligne à importer.')
    }

    const errors: Array<{ row: number; message: string }> = []
    const results: CommerceRecord[] = []

    for (const [index, entry] of records.entries()) {
      try {
        if (dryRun) {
          results.push({
            ...entry,
            id: typeof entry.id === 'string' && entry.id
              ? entry.id
              : `preview-${index + 1}`,
          })
          continue
        }

        const identifier = typeof entry.id === 'string' && entry.id
          ? entry.id
          : null
        const result = identifier
          ? await updateCommerceResource({
              resource,
              id: identifier,
              payload: entry,
              context,
            })
          : await createCommerceResource({
              resource,
              payload: entry,
              context,
            })

        results.push(result.record)
      } catch (error) {
        errors.push({
          row: index + 1,
          message: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    }

    await writeMarketplaceAudit({
      context,
      requestId: rid,
      action: dryRun
        ? 'marketplace.commerce.import.previewed'
        : 'marketplace.commerce.import.executed',
      objectType: resource,
      objectId: 'bulk-import',
      afterValue: { count: results.length, errors },
      source: 'complete-commerce-administration',
      request,
    })

    return apiSuccess(
      {
        dryRun,
        imported: results.length,
        errors,
        records: results,
      },
      { requestId: rid },
    )
  } catch (error) {
    return apiFailure(error, rid)
  }
}
