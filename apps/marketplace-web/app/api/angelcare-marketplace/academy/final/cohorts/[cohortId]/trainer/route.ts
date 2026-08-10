import {handleAcademyTrainerAssignment} from '@/angelcare-marketplace/academy-engine/final-api-handlers'
export async function POST(request:Request,{params}:{params:Promise<{cohortId:string}>}){const{cohortId}=await params;return handleAcademyTrainerAssignment(request,cohortId)}
