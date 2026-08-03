import {handleDefectTransition} from '@/angelcare-marketplace/final-authority/api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{defectId:string}>}){return handleDefectTransition(request,(await params).defectId)}
