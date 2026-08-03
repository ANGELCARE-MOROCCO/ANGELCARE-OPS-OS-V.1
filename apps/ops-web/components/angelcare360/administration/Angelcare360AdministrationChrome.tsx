'use client'
import type { ReactNode } from 'react'
import FoundationRouteChrome from '@/components/angelcare360/customer-foundation/FoundationRouteChrome'
import type { Angelcare360AccessProfile, Angelcare360SessionUser } from '@/types/angelcare360/module'
export default function Angelcare360AdministrationChrome({children,user,access}:{children:ReactNode;user:Angelcare360SessionUser;access:Angelcare360AccessProfile}){return <FoundationRouteChrome domain="governance" meta={`${access.roleLabel} · ${user.email||'Session protégée'} · ${access.scopeLabel}`}>{children}</FoundationRouteChrome>}
