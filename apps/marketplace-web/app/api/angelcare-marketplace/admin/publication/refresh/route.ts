import { revalidatePath, revalidateTag } from 'next/cache'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { apiFailure, apiSuccess, requestId } from '@/angelcare-marketplace/server/request'
export async function POST(request:Request){const rid=requestId(request);try{await requireMarketplaceApiContext('marketplace.publication.manage');for(const locale of ['fr','en','ar']){revalidatePath(`/angelcare-marketplace/${locale}`);revalidatePath(`/angelcare-marketplace/${locale}/marketplace`)}revalidateTag('angelcare-marketplace','max');return apiSuccess({refreshed:true},{requestId:rid})}catch(error){return apiFailure(error,rid)}}
