import type { ReactNode } from 'react'
import { HomeServiceDesignShell } from '@/components/carelink/service-design/HomeServiceDesignShell'
import { requireHomeServiceAccess } from '@/lib/homeservice-design/server/auth'
import { getServiceDesignSnapshot } from '@/lib/homeservice-design/server/repository'
export const dynamic = 'force-dynamic'
export default async function Layout({children}:{children:ReactNode}){ await requireHomeServiceAccess('homeservice_design.view'); const snapshot=await getServiceDesignSnapshot(); return <HomeServiceDesignShell databaseReady={snapshot.databaseReady} pendingApprovals={snapshot.metrics.pendingApprovals}>{children}</HomeServiceDesignShell> }
