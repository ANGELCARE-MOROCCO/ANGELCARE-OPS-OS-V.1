import{HandoffDossierWorkspace}from'@/components/carelink/service-design/handoff/workspaces/HandoffDossierWorkspace'
export default async function Page({params}:{params:Promise<{handoffId:string}>}){const{id}= {id:(await params).handoffId};return <HandoffDossierWorkspace id={id}/>}
