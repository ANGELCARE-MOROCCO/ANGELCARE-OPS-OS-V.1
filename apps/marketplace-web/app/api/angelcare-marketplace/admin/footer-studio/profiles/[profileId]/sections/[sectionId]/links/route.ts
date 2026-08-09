import {handleFooterSectionLinks} from '@/angelcare-marketplace/footer-studio/api-handlers'
type C={params:Promise<{profileId:string;sectionId:string}>}
export function POST(r:Request,c:C){return handleFooterSectionLinks(r,c.params)}
