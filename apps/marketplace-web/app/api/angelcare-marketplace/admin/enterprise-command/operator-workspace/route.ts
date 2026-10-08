import { handleOperatorWorkspace } from '@/angelcare-marketplace/enterprise-command/sovereign-api-handlers'
export async function GET(request:Request){return handleOperatorWorkspace(request)}
export async function PATCH(request:Request){return handleOperatorWorkspace(request)}
