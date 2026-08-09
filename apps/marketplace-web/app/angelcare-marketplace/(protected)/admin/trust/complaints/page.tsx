import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { listComplaints } from '@/angelcare-marketplace/trust-quality/repository'
import { ComplaintCommand } from '@/angelcare-marketplace/trust-quality/components/ComplaintCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.complaints.view');return <ComplaintCommand items={await listComplaints(context)}/>}