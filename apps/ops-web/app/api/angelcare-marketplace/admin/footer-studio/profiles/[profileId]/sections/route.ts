import {handleFooterSections} from '@/angelcare-marketplace/footer-studio/api-handlers'
type C={params:Promise<{profileId:string}>}
export function GET(r:Request,c:C){return handleFooterSections(r,c.params)}
export function POST(r:Request,c:C){return handleFooterSections(r,c.params)}
