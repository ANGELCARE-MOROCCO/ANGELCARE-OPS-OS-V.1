import { requireInfrastructureAdmin } from '@/lib/opsos/windows-node'
import { extensionDb, loadUserAccess } from '@/lib/browser-extension/runtime'
import { B2B_EXTENSION_CONTRACT, BROWSER_EXTENSION_MODULES } from '@/lib/browser-extension/catalog'
import BrowserExtensionAdminConsole from '@/components/browser-extension/BrowserExtensionAdminConsole'
export const dynamic='force-dynamic'
export default async function BrowserExtensionAdminPage(){ await requireInfrastructureAdmin(); const db=await extensionDb(); const [{data:users},{data:devices}]=await Promise.all([db.from('app_users').select('id,full_name,name,email,role,role_key,status').order('full_name'),db.from('browser_extension_devices').select('*').order('created_at',{ascending:false})]); const snapshots=[]; for(const user of users||[]) snapshots.push({user,access:await loadUserAccess(db,user.id)}); return <BrowserExtensionAdminConsole initial={{users:snapshots,devices:devices||[],modules:BROWSER_EXTENSION_MODULES,b2bContract:B2B_EXTENSION_CONTRACT}} /> }
