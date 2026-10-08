import { createUserClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { apiFailure, apiSuccess, parseJsonObject, requestId } from '../server/request'
import { MarketplaceError } from '../server/errors'
import { customerCallbackUrl, customerPublicOrigin, syncCustomerConfirmation } from './customer-auth-links'
import { claimGuestCommerce, getCustomerContext } from './customer-auth'
import { emailValue, localeValue } from './validation'

export function requireCustomerSameOrigin(request: Request): void {
  const origin = request.headers.get('origin')
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(request.url).origin && origin !== customerPublicOrigin(request))) throw new MarketplaceError('FORBIDDEN', 'Origine de la requête non autorisée.')
}
export async function handleCustomerResend(request: Request): Promise<Response> {
  const id = requestId(request)
  try {
    requireCustomerSameOrigin(request)
    const body = await parseJsonObject(request), locale = localeValue(body.locale)
    const client = await createUserClient()
    const { error } = await client.auth.resend({ type: 'signup', email: emailValue(body.email), options: { emailRedirectTo: customerCallbackUrl(request, locale, 'signup', body.returnTo) } })
    if (error) throw new MarketplaceError(error.status === 429 ? 'RATE_LIMITED' : 'INTERNAL_ERROR', 'Impossible de renvoyer le lien.', { cause: error })
    return apiSuccess({ sent: true }, { requestId: id })
  } catch (error) { return apiFailure(error, id) }
}
export async function handleCustomerSessionBridge(request: Request): Promise<Response> {
  const id = requestId(request)
  try {
    requireCustomerSameOrigin(request)
    const body = await parseJsonObject(request)
    if (typeof body.accessToken !== 'string' || typeof body.refreshToken !== 'string' || body.accessToken.length > 16000 || body.refreshToken.length > 4000) throw new MarketplaceError('VALIDATION_ERROR', 'Lien incomplet.')
    const client = await createUserClient()
    const { error } = await client.auth.setSession({ access_token: body.accessToken, refresh_token: body.refreshToken })
    if (error) throw new MarketplaceError('AUTHENTICATION_REQUIRED', 'Lien invalide ou expiré.', { cause: error })
    const { data: { user }, error: userError } = await client.auth.getUser()
    if (userError || !user || !await syncCustomerConfirmation(user) || !await getCustomerContext()) {
      await client.auth.signOut({ scope: 'local' })
      throw new MarketplaceError('AUTHENTICATION_REQUIRED', 'Accès client indisponible.')
    }
    const context = await getCustomerContext()
    const visitor = (await cookies()).get('ac_marketplace_visitor')?.value
    if (context && visitor && /^[a-f\d-]{36}$/i.test(visitor)) await claimGuestCommerce({ visitorReference: visitor, account: context.account })
    return apiSuccess({ authenticated: true }, { requestId: id })
  } catch (error) { return apiFailure(error, id) }
}
