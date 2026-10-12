import {requireMarketplacePageContext} from '@/angelcare-marketplace/auth/context'
import {HotlineChatDesk} from '@/angelcare-marketplace/hotline-os/components/HotlineChatDesk'
export const dynamic='force-dynamic'
export default async function Page(){await requireMarketplacePageContext('marketplace.hotline.view');return <HotlineChatDesk/>}
