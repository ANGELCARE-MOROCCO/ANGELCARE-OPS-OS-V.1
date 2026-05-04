import { ManagementPage } from "@/components/market-os/advanced-management-suite"
import { partnersNetworkConfig } from "@/lib/market-os/partners-network-data"
export default function Page() { return <ManagementPage config={partnersNetworkConfig} view="analytics" /> }
