import {handleRealityRecordCommand} from '@/angelcare-marketplace/reality-completion/api-handlers'
type Context={params:Promise<{domain:string;recordId:string}>}
export async function PATCH(request:Request,context:Context){const {domain,recordId}=await context.params;return handleRealityRecordCommand(request,domain,recordId)}
