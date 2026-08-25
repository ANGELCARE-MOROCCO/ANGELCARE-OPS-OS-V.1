import {handleRealityCollection} from '@/angelcare-marketplace/reality-completion/api-handlers'
type Context={params:Promise<{domain:string}>}
export async function GET(request:Request,context:Context){const {domain}=await context.params;return handleRealityCollection(request,domain)}
export async function POST(request:Request,context:Context){const {domain}=await context.params;return handleRealityCollection(request,domain)}
