/** Fail-closed OAuth URL validation; never permit a legacy OPS callback. */
export const JOBKIX_PRODUCTION_ORIGIN = 'https://my.angelcarehub.com'
export const JOBKIX_GOOGLE_CALLBACK_PATH = '/api/jobkix/auth/google/callback'

export function jobkixOAuthOrigin(environment: string | undefined, production: boolean, requestOrigin: string): string {
  if (!production) return requestOrigin
  if (environment && environment !== JOBKIX_PRODUCTION_ORIGIN) throw Error('JOBKIX_PUBLIC_ORIGIN_INVALID')
  return JOBKIX_PRODUCTION_ORIGIN
}

export function ensureJobkixOAuthAuthorizeUrl(authorizeUrl: string, callbackUrl: string, supabaseUrl: string): string {
  const provider = new URL(authorizeUrl)
  const auth = new URL(supabaseUrl)
  const callback = new URL(callbackUrl)
  if (provider.protocol !== 'https:' || auth.protocol !== 'https:' || callback.protocol !== 'https:')
    throw Error('JOBKIX_OAUTH_URL_UNSAFE')
  if (provider.username || provider.password || callback.username || callback.password)
    throw Error('JOBKIX_OAUTH_URL_UNSAFE')
  if (provider.origin !== auth.origin || !provider.pathname.endsWith('/auth/v1/authorize'))
    throw Error('JOBKIX_OAUTH_PROVIDER_MISMATCH')
  if (provider.searchParams.get('provider') !== 'google')
    throw Error('JOBKIX_OAUTH_PROVIDER_MISMATCH')
  // GoTrue's redirect_to is distinct from Google's registered callback URI.
  if (provider.searchParams.get('redirect_to') !== callback.href)
    throw Error('JOBKIX_OAUTH_REDIRECT_MISMATCH')
  if (callback.pathname !== JOBKIX_GOOGLE_CALLBACK_PATH || callback.search || callback.hash)
    throw Error('JOBKIX_OAUTH_REDIRECT_MISMATCH')
  if (callback.origin !== JOBKIX_PRODUCTION_ORIGIN)
    throw Error('JOBKIX_OAUTH_REDIRECT_MISMATCH')
  return provider.href
}
