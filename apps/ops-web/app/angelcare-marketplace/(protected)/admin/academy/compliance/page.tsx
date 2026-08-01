import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { CertificateAuthority } from '@/angelcare-marketplace/academy-engine/components/CertificateAuthority'
import { listCertificates } from '@/angelcare-marketplace/academy-engine/repository'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.academy.view');void context;return <CertificateAuthority certificates={await listCertificates(context)}/>}
