import { ManagementPage } from "@/app/components/market-os/advanced-management-suite"
import { ambassadorProgramConfig } from "@/lib/market-os/ambassador-program-data"
export default function Page() { return <ManagementPage config={ambassadorProgramConfig} view="training" /> }
