import {apiSuccess} from '@/angelcare-marketplace/server/request'
export const dynamic='force-dynamic'
export async function GET(){return apiSuccess({status:'retired',replacement:'/angelcare-marketplace/admin/localization/csv',message:'Legacy export endpoint retired. CSV exports are generated from the governed Localization CSV workspace.'},{status:410})}
