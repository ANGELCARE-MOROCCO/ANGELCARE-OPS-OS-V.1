import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from '@/lib/supabase/env'

export async function refreshCustomerSession(request: NextRequest) {
  const env = getSupabaseEnv()
  const next = () => {
    const forwarded = new Headers(request.headers)
    // Overwrite any client-supplied value with the path actually requested.
    forwarded.set('x-angelcare-customer-path', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.next({ request: { headers: forwarded } })
  }
  let response = next()
  if (env.url && env.anonKey && request.cookies.getAll().some(cookie => cookie.name.startsWith('sb-'))) {
    const client = createServerClient(env.url, env.anonKey, { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value))
        response = next()
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    } })
    // The page/API remains the authorization authority. Refresh failures never grant access.
    await client.auth.getUser().catch(() => undefined)
  }
  response.headers.set('Cache-Control', 'private, no-store, max-age=0')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
