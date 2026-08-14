import {handleFamilyGuardians} from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function GET(request:Request,{params}:{params:Promise<{familyId:string}>}){const{familyId}=await params;return handleFamilyGuardians(request,familyId)}
export async function POST(request:Request,{params}:{params:Promise<{familyId:string}>}){const{familyId}=await params;return handleFamilyGuardians(request,familyId)}
