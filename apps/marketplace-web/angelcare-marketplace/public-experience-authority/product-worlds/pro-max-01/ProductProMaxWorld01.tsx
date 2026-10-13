import {GlobalPublicShell} from '@/angelcare-marketplace/public-universe/components/GlobalPublicShell'
import {ProductCommerceRenderer} from '@/angelcare-marketplace/product-commerce-experience/ProductCommerceRenderer'
import type {PublicExperience360,PublicExperienceTruthReport} from '../../types'
import {PRODUCT_PRO_MAX_WORLD01_ID,PRODUCT_PRO_MAX_WORLD01_TEMPLATE_KEY} from './contract'
export async function ProductProMaxWorld01({data,truthReport,authority,sharedShell=false}:{data:PublicExperience360;truthReport:PublicExperienceTruthReport;authority:string;sharedShell?:boolean}){
 if(data.classification.masterDomain!=='b2c_product_digital')return null
 const body=<div data-ac-public-experience="product-pro-max-world-01" data-ac-public-experience-authority={authority} data-ac-product-world-id={PRODUCT_PRO_MAX_WORLD01_ID} data-ac-product-world-key={PRODUCT_PRO_MAX_WORLD01_TEMPLATE_KEY}><ProductCommerceRenderer data={data} truthReport={truthReport}/></div>
 return sharedShell?body:<GlobalPublicShell locale={data.classification.locale==='ar'?'ar':data.classification.locale==='en'?'en':'fr'} navigation={[]} variant="marketplace" contentElement="div">{body}</GlobalPublicShell>
}
