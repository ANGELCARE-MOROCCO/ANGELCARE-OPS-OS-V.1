import CommandKernelWorkspace from '../_components/CommandKernelWorkspace'
export default async function Page({params}:{params:Promise<{section:string}>}){const{section}=await params;return <CommandKernelWorkspace section={section}/>}
