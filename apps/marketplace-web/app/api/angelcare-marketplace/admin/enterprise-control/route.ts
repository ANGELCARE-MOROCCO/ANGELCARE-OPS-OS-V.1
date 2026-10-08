import { handleEnterpriseControlSnapshot } from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function GET(request:Request){return handleEnterpriseControlSnapshot(request)}
