import RevenueProposalWorkspace from "@/components/revenue-command-center/proposal-enterprise/RevenueProposalWorkspace"
export const dynamic="force-dynamic"
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <RevenueProposalWorkspace experience="negotiation-room" contextId={id} contextType="prospect"/>}
