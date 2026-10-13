import {AcademyCommerceExperience} from './AcademyCommerceExperience'
import {shouldRenderWorldBlock} from '../studio-universal/world-operability'
import type {StudioBlockProps} from '../studio-universal/types'
import {buildAcademyView,isAcademyCourseData} from './model'
import type {PublicExperience360,PublicExperienceTruthReport} from '../public-experience-authority/types'
export function AcademyCommerceRenderer({data,truthReport,worldProps={}}:{data:PublicExperience360;truthReport:PublicExperienceTruthReport;worldProps?:Record<string,unknown>}){if(!isAcademyCourseData(data))return null;return <AcademyCommerceExperience key={data.identity.id+':'+data.classification.locale} view={buildAcademyView(data,truthReport,{...worldProps,...(Array.isArray(worldProps.content)?{content:worldProps.content.map(c=>{const row=c as {props?:Record<string,unknown>};const p=row.props||{},permitted=shouldRenderWorldBlock(p as StudioBlockProps,{locale:data.classification.locale==='ar'?'ar':data.classification.locale==='en'?'en':'fr',territoryId:data.classification.territoryId,audienceId:data.classification.audienceId});return {...row,props:{...p,hidden:p.hidden===true||!permitted.render}}})}:{})})}/>}
