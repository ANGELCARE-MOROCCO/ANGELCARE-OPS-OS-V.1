import {handleFooterVersionRestore} from '@/angelcare-marketplace/footer-studio/api-handlers'
type C={params:Promise<{profileId:string;versionId:string}>}
export function POST(r:Request,c:C){return handleFooterVersionRestore(r,c.params)}
