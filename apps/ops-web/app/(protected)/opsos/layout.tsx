import { requireInfrastructureAdmin } from "@/lib/opsos/windows-node"

export const dynamic = "force-dynamic"

export default async function OpsosProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireInfrastructureAdmin()
  return <>{children}</>
}

