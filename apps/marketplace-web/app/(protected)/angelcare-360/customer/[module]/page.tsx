import { notFound } from 'next/navigation'
import { Ac360CustomerDedicatedModuleScreen } from '@/components/ac360/customer/Ac360CustomerDedicatedModuleScreen'
import { Ac360OperationsWorkspace } from '@/components/ac360/customer/operations/Ac360OperationsWorkspace'
import { ac360DedicatedModuleRoutes, getAc360DedicatedModuleRouteBySlug } from '@/lib/ac360/customer-module-routes'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return ac360DedicatedModuleRoutes.map((route) => ({ module: route.slug }))
}

export default async function Ac360CustomerDedicatedModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  if (module === 'presence-operations') {
    return <Ac360OperationsWorkspace initialSection="aujourdhui" legacyAlias />
  }
  const route = getAc360DedicatedModuleRouteBySlug(module)
  if (!route) notFound()
  return <Ac360CustomerDedicatedModuleScreen route={route} />
}
