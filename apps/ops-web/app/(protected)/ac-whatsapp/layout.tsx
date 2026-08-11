import './apex.css'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/getUser'
import { createServiceClient } from '@/lib/supabase/server'
import { hasAcWhatsAppPermission, isAcWhatsAppPrivilegedUser } from '@/lib/ac-whatsapp/permissions'
import ACWhatsAppShell from '@/components/ac-whatsapp/ACWhatsAppShell'

export default async function ACWhatsAppLayout({children}:{children:React.ReactNode}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  let membership:any = null
  if (!isAcWhatsAppPrivilegedUser(user)) {
    const supabase = await createServiceClient()
    const result = await supabase.from('ac_whatsapp_memberships').select('*').eq('user_id',user.id).maybeSingle()
    if (result.error) redirect('/unauthorized')
    membership = result.data
  }
  if (!hasAcWhatsAppPermission(user,membership,'ac-whatsapp.view')) redirect('/unauthorized')
  return <ACWhatsAppShell>{children}</ACWhatsAppShell>
}
