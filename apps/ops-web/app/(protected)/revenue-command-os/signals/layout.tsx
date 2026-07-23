import { requireAccess } from '@/lib/auth/requireAccess'
import { readRevenueSignalFabric } from '@/lib/revenue-command-os/signal-fabric/repository'
import { SignalFabricProvider } from './_components/SignalFabricContext'
import SignalFabricFrame from './_components/SignalFabricFrame'

export const dynamic='force-dynamic'
export default async function RevenueSignalLayout({children}:{children:React.ReactNode}){
  await requireAccess(['revenue_os.signals.manage','revenue_os.view','revenue.view'])
  const {bootstrap,warnings}=await readRevenueSignalFabric()
  return <SignalFabricProvider initialFabric={bootstrap} initialWarnings={warnings}><SignalFabricFrame>{children}</SignalFabricFrame></SignalFabricProvider>
}
