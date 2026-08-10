const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'accept-encoding',
])

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  'connection',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-encoding',
])

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function resolveOpsBaseUrl() {
  const raw = String(process.env.AC360_OPS_BRIDGE_BASE_URL || '').trim()
  if (!raw) return null

  try {
    const url = new URL(raw)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.pathname = '/'
    url.search = ''
    url.hash = ''
    return url
  } catch {
    return null
  }
}

export async function proxyAc360RequestToOps(
  request: Request,
  upstreamPath: string,
) {
  const base = resolveOpsBaseUrl()

  if (!base) {
    return json(
      {
        ok: false,
        error: 'AC360_OPS_BRIDGE_BASE_URL is not configured.',
        bridge: 'ac360_ops_runtime',
      },
      503,
    )
  }

  const incoming = new URL(request.url)

  if (incoming.origin === base.origin) {
    return json(
      {
        ok: false,
        error: 'AC360 Ops bridge loop prevented.',
        bridge: 'ac360_ops_runtime',
      },
      508,
    )
  }

  const target = new URL(base)
  target.pathname = upstreamPath.startsWith('/') ? upstreamPath : `/${upstreamPath}`
  target.search = incoming.search

  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  headers.set('x-ac360-bridge-origin', incoming.origin)
  headers.set('x-ac360-bridge-path', incoming.pathname)

  const protectionBypass = String(
    process.env.AC360_OPS_BRIDGE_BYPASS_TOKEN || '',
  ).trim()

  if (protectionBypass) {
    headers.set('x-vercel-protection-bypass', protectionBypass)
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  }

  if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
    const body = await request.arrayBuffer()
    if (body.byteLength) init.body = body
  }

  try {
    const upstream = await fetch(target, init)
    const responseHeaders = new Headers()

    upstream.headers.forEach((value, key) => {
      if (!HOP_BY_HOP_RESPONSE_HEADERS.has(key.toLowerCase())) {
        responseHeaders.set(key, value)
      }
    })

    responseHeaders.set('x-ac360-bridge-upstream-status', String(upstream.status))
    responseHeaders.set('cache-control', responseHeaders.get('cache-control') || 'no-store')

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'AC360 Ops bridge request failed.',
        bridge: 'ac360_ops_runtime',
        upstreamPath,
      },
      502,
    )
  }
}
