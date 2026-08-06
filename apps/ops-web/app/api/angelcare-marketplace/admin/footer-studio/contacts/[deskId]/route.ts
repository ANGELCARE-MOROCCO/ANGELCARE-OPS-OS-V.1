import {handleFooterContact} from '@/angelcare-marketplace/footer-studio/api-handlers'
type C={params:Promise<{deskId:string}>}
export function PATCH(r:Request,c:C){return handleFooterContact(r,c.params)}
