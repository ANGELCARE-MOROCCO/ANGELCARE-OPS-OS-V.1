import 'server-only'
import { getAngelcare360RouteBinding } from '@/data/angelcare360/product-constitution'
import { resolveSanilaReleaseRouteAuthority } from '@/lib/angelcare360/release-route-constitution.generated'
import { Angelcare360AccessError, requireAngelcare360Permission } from '@/lib/angelcare360/server/context'

/**
 * SANILA server-first route gate.
 *
 * The original product shell applied entitlement state in a client component.
 * This gate is intentionally invoked inside every protected Command Center page
 * before the page's own business loader. It therefore makes authorization,
 * entitlement and tenant context a server-side precondition rather than a
 * presentation concern.
 */
export async function requireAngelcare360RouteAccess(pathname: string) {
  const binding = getAngelcare360RouteBinding(pathname)
  const releaseAuthority = resolveSanilaReleaseRouteAuthority(pathname)

  if (!binding && !releaseAuthority) {
    throw new Angelcare360AccessError(
      `La route SANILA ${pathname} n’est pas reliée à la constitution produit publiée.`,
      500,
    )
  }

  const permissionKey = binding?.permissionKey || releaseAuthority!.permissionKey
  const operation = permissionKey
  const context = await requireAngelcare360Permission(permissionKey, { operation })

  if (!context.school) {
    throw new Angelcare360AccessError('Aucun établissement actif n’est disponible.', 404)
  }

  return { context, binding, releaseAuthority }
}
