import {handleLocalizationAuthorityMode} from '@/angelcare-marketplace/localization-intelligence/final-api-handlers'
export const dynamic='force-dynamic'
export async function GET(request:Request){return handleLocalizationAuthorityMode(request,'seo')}
export async function POST(request:Request){return handleLocalizationAuthorityMode(request,'seo')}
