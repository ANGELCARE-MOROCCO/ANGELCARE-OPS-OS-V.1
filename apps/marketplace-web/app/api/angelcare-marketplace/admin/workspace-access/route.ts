import {handleWorkspaceAccess} from '@/angelcare-marketplace/workspace-access/api-handlers'
export async function GET(request:Request){return handleWorkspaceAccess(request)}
export async function POST(request:Request){return handleWorkspaceAccess(request)}
