import { redirect } from 'next/navigation'
import { getAngelcare360AccessContext, requireAngelcare360Permission } from '@/lib/angelcare360/server/context'
export async function requireSanilaCommunicationContext(permission='messagerie.view'){const context=await getAngelcare360AccessContext();if(!context?.school)redirect('/angelcare-360-command-center');await requireAngelcare360Permission(permission,{context});return context}
