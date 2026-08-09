import {handleFooterTheme} from '@/angelcare-marketplace/footer-studio/api-handlers'
type C={params:Promise<{themeId:string}>}
export function PATCH(r:Request,c:C){return handleFooterTheme(r,c.params)}
