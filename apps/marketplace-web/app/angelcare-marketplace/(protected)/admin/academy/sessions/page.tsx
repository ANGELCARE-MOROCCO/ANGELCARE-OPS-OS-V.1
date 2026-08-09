import { requireMarketplacePageContext } from '@/angelcare-marketplace/auth/context'
import { AttendanceCommand } from '@/angelcare-marketplace/academy-engine/components/AttendanceCommand'
export default async function Page(){const context=await requireMarketplacePageContext('marketplace.academy.view');void context;return <AttendanceCommand />}
