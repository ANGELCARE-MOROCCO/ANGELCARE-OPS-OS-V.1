import {handleAcademyFinalSnapshot} from '@/angelcare-marketplace/academy-engine/final-api-handlers'
export async function GET(request:Request){return handleAcademyFinalSnapshot(request)}
