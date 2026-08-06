import {handleFooterSection} from '@/angelcare-marketplace/footer-studio/api-handlers'
type C={params:Promise<{profileId:string;sectionId:string}>}
export function PATCH(r:Request,c:C){return handleFooterSection(r,c.params)}
