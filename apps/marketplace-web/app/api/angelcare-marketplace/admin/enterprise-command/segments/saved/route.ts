import { handleSavedSegments } from '@/angelcare-marketplace/enterprise-command/sovereign-api-handlers'
export async function GET(request:Request){return handleSavedSegments(request)}
export async function POST(request:Request){return handleSavedSegments(request)}
