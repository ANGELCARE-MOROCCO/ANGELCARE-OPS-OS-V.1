import{TransmissionControlWorkspace}from'@/components/carelink/service-design/handoff/workspaces/TransmissionControlWorkspace'
export default async function Page({params}:{params:Promise<{handoffId:string}>}){return <TransmissionControlWorkspace handoffId={(await params).handoffId}/>}
