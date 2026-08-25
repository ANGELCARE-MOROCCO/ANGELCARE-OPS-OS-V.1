import {handleFamilyGuardian} from '@/angelcare-marketplace/enterprise-closure/api-handlers'
export async function PATCH(request:Request,{params}:{params:Promise<{familyId:string;guardianId:string}>}){const{familyId,guardianId}=await params;return handleFamilyGuardian(request,familyId,guardianId)}
