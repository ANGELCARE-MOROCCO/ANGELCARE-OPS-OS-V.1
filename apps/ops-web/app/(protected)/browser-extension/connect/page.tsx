import { requireUser } from '@/lib/auth/session'
import BrowserExtensionConnectClient from '@/components/browser-extension/BrowserExtensionConnectClient'
export const dynamic='force-dynamic'
export default async function BrowserExtensionConnectPage(){ const user=await requireUser(); return <BrowserExtensionConnectClient user={{id:String(user.id),name:String(user.full_name||user.name||user.email||'AngelCare operator'),email:String(user.email||''),role:String(user.role||user.role_key||'')}} /> }
