import RevenueContractWorkspace from "@/components/revenue-command-center/contract-enterprise/RevenueContractWorkspace"
export const dynamic="force-dynamic"
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <RevenueContractWorkspace experience="contract-studio" contextId={id} contextType="partnership"/>}
