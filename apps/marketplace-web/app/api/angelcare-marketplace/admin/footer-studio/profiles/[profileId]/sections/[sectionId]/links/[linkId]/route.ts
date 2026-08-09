import {handleFooterSectionLink} from '@/angelcare-marketplace/footer-studio/api-handlers'
type C={params:Promise<{profileId:string;sectionId:string;linkId:string}>}
export function PATCH(r:Request,c:C){return handleFooterSectionLink(r,c.params)}
