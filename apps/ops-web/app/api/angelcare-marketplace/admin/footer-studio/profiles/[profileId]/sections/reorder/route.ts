import {handleFooterSectionReorder} from '@/angelcare-marketplace/footer-studio/api-handlers'
type C={params:Promise<{profileId:string}>}
export function POST(r:Request,c:C){return handleFooterSectionReorder(r,c.params)}
