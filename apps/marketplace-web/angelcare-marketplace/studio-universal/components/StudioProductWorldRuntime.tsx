import {ProductCommerceRenderer} from '@/angelcare-marketplace/product-commerce-experience/ProductCommerceRenderer'
import type {PublicExperience360,PublicExperienceTruthReport} from '@/angelcare-marketplace/public-experience-authority/types'
export async function StudioProductWorldRuntime({data,truthReport,worldProps}:{data:PublicExperience360;truthReport:PublicExperienceTruthReport;worldProps:Record<string,unknown>}){return <ProductCommerceRenderer data={data} truthReport={truthReport} worldProps={worldProps}/>}
