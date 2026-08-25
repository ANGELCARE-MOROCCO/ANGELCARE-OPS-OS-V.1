import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {listPublicInquiries} from '@/angelcare-marketplace/public-universe/repository'
import {InquiryCommandCenter} from '@/angelcare-marketplace/total-commerce-control/components/InquiryCommandCenter'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.public.inquiries.view');return <InquiryCommandCenter initial={await listPublicInquiries() as any}/>}
