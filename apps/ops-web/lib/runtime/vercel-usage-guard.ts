export const isProductionRuntime =
  process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'

/**
 * Server policy:
 * - do not disable heavy sync by default
 * - only disable when explicit env brake is enabled
 * - use cache headers to reduce repeated Vercel work
 */
export const disableHeavySync =
  process.env.DISABLE_HEAVY_SYNC === '1' ||
  process.env.DISABLE_LIVE_POLLING === '1' ||
  process.env.CARELINK_SYNC_DISABLED === '1' ||
  process.env.EMAIL_OS_AUTO_SYNC_DISABLED === '1'

export function guardedJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)

  if (!headers.has('Cache-Control')) {
    headers.set(
      'Cache-Control',
      isProductionRuntime
        ? 'public, s-maxage=120, stale-while-revalidate=600'
        : 'no-store',
    )
  }

  return Response.json(data, {
    ...init,
    headers,
  })
}

export function syncDisabledResponse(reason = 'Automatic heavy sync disabled by production usage brake') {
  return guardedJson(
    {
      ok: true,
      disabled: true,
      source: 'usage-guard',
      message: reason,
      data: [],
      generatedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=900',
      },
    },
  )
}
