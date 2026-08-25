import {handleAcademySessionCreate} from '@/angelcare-marketplace/academy-engine/final-api-handlers'
export async function POST(request:Request){return handleAcademySessionCreate(request)}
