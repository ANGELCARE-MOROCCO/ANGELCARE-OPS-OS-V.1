import {apiSuccess} from '@/angelcare-marketplace/server/request'
export const dynamic='force-dynamic'
export async function GET(){return apiSuccess({status:'retired',replacement:'/angelcare-marketplace/admin/localization/rtl-lab',message:'Legacy RTL preview API retired. Use the governed RTL Laboratory workspace.'},{status:410})}
