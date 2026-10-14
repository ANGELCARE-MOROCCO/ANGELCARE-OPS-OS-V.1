import {ProductCommerceRenderer} from '../../product-commerce-experience/ProductCommerceRenderer'
import {ServiceCommerceRenderer} from '../../service-commerce-experience/ServiceCommerceRenderer'
import {AcademyCommerceRenderer} from '../../academy-commerce-experience/AcademyCommerceRenderer'
import {B2BCommerceRenderer} from '../../b2b-commerce-experience/B2BCommerceRenderer'
import type {PublicExperience360,PublicExperienceTruthReport} from '../types'

/** Default composition dispatch only. Published custom Studio worlds retain their authority upstream. */
export async function CanonicalAtomicDetailWorld({data,truthReport,authority}:{data:PublicExperience360;truthReport:PublicExperienceTruthReport;authority:string}){
 const world=data.classification.masterDomain==='b2c_product_digital'
  ? <ProductCommerceRenderer data={data} truthReport={truthReport}/>
  : data.classification.masterDomain==='b2c_service_family'
    ? <ServiceCommerceRenderer data={data} truthReport={truthReport}/>
    : data.classification.masterDomain==='academy_admission'
      ? <AcademyCommerceRenderer data={data} truthReport={truthReport}/>
      : data.classification.masterDomain==='b2b_institutional'
        ? <B2BCommerceRenderer data={data} truthReport={truthReport}/>
        : null
 return world?<div data-ac-public-experience="atomic-canonical" data-ac-authority={authority}>{world}</div>:null
}
