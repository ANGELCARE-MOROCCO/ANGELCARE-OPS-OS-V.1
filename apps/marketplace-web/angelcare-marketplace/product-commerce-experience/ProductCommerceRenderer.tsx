import {ProductCommerceExperience} from './ProductCommerceExperience'
import {buildProductView} from './model'
import type {PublicExperience360,PublicExperienceTruthReport} from '../public-experience-authority/types'
/** Native compatibility adapters and editable Studio compositions share these components. */
export function ProductCommerceRenderer({data,truthReport,worldProps={}}:{data:PublicExperience360;truthReport:PublicExperienceTruthReport;worldProps?:Record<string,unknown>}){if(data.classification.masterDomain!=='b2c_product_digital')return null;return <ProductCommerceExperience key={data.identity.id+':'+data.classification.locale} view={buildProductView(data,truthReport,worldProps)}/>}
