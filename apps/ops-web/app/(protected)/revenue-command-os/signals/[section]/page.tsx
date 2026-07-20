import { notFound } from 'next/navigation'
import { REVENUE_SIGNAL_SECTIONS } from '@/lib/revenue-command-os/signal-fabric/constants'
import type { RevenueSignalSectionKey } from '@/lib/revenue-command-os/types'
import SignalFabricWorkspace from '../_components/SignalFabricWorkspace'
export const dynamic='force-dynamic'
export default async function RevenueSignalSectionPage({params}:{params:Promise<{section:string}>}){const {section}=await params;const found=REVENUE_SIGNAL_SECTIONS.find((x)=>x.key===section&&x.key!=='overview');if(!found)notFound();return <SignalFabricWorkspace sectionKey={found.key as RevenueSignalSectionKey} />}
