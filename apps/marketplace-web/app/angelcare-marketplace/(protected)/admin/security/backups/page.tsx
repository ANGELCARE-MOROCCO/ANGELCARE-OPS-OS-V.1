import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {BackupRecoveryAuthority} from '@/angelcare-marketplace/analytics-security/components/SecurityRegisters'
import {listBackups,listRecoveryTests} from '@/angelcare-marketplace/analytics-security/repository'
export default async function Page(){await requireMarketplacePageContext('marketplace.security.view');const[backups,tests]=await Promise.all([listBackups(),listRecoveryTests()]);return <BackupRecoveryAuthority backups={backups} tests={tests}/>}
