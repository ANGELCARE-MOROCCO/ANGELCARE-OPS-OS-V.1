import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listCertificates } from '@/angelcare-marketplace/academy-engine/repository'
import { CertificateAuthority } from '@/angelcare-marketplace/academy-engine/components/CertificateAuthority'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.academy.view');return <CertificateAuthority certificates={await listCertificates(context)}/>}
