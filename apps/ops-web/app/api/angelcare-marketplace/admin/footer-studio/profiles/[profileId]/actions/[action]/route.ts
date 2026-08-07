import {handleFooterProfileAction} from '@/angelcare-marketplace/footer-studio/api-handlers'
type C={params:Promise<{profileId:string;action:string}>}
export function POST(r:Request,c:C){return handleFooterProfileAction(r,c.params)}
