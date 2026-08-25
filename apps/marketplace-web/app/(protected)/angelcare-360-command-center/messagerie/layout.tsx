import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { requireSanilaCommunicationContext } from './_utils'
export const metadata:Metadata={title:'Communication Command · SANILA Operating System',description:'Conversations, audiences, campagnes et gouvernance de communication SANILA.'}
export const dynamic='force-dynamic'
export default async function Layout({children}:{children:ReactNode}){await requireSanilaCommunicationContext();return children}
