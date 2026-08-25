import {apiSuccess} from '@/angelcare-marketplace/server/request'
export const dynamic='force-dynamic'
export async function GET(){return apiSuccess({status:'retired',replacement:'/angelcare-marketplace/admin/localization/csv',message:'Legacy import endpoint retired. Dry-run and governed draft import are handled by Localization CSV.'},{status:410})}
