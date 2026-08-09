import {handleExperimentTransition} from '@/angelcare-marketplace/final-authority/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{experimentId:string}>}){return handleExperimentTransition(request,(await params).experimentId)}
