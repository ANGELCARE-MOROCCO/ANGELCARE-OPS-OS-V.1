import { handleIncidentTransition } from '@/angelcare-marketplace/operations-execution/api-handlers'
export async function POST(r:Request,{params}:{params:Promise<{incidentId:string}>}){return handleIncidentTransition(r,(await params).incidentId)}
