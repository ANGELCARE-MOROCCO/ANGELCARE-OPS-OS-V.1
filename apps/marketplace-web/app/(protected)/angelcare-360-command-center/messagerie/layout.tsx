import type { Metadata } from 'next'
import { requireSanilaCommunicationContext } from './_utils'
export const metadata:Metadata={title:'Communication Command · SANILA Operating System',description:'Conversations, audiences, campagnes et gouvernance de communication SANILA.'}
export const dynamic='force-dynamic'
export default async function Layout({children}:{children:React.ReactNode}){await requireSanilaCommunicationContext();return children}
