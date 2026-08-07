import {handleFooterProfile} from '@/angelcare-marketplace/footer-studio/api-handlers'
type C={params:Promise<{profileId:string}>}
export function GET(r:Request,c:C){return handleFooterProfile(r,c.params)}
export function PATCH(r:Request,c:C){return handleFooterProfile(r,c.params)}
