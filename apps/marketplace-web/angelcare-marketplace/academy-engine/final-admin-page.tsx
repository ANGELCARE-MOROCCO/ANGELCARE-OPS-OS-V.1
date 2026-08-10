import {requireMarketplaceWorkspacePageContext} from '../auth/context'
import {AcademyFinalCommand} from './components/AcademyFinalCommand'
import {academyFinalSnapshot} from './final-repository'
export type AcademyFinalMode='sessions'|'attendance'|'assessments'|'b2b'|'enrollments'|'trainers'|'programs'|'courses'
const KEY:Record<AcademyFinalMode,string>={sessions:'academy.sessions',attendance:'academy.attendance',assessments:'academy.assessments',b2b:'academy.b2b_training',enrollments:'academy.enrollments',trainers:'academy.trainers',programs:'academy.programs',courses:'academy.courses'}
export async function AcademyFinalPage({mode}:{mode:AcademyFinalMode}){const context=await requireMarketplaceWorkspacePageContext(KEY[mode],'marketplace.academy.view');return <AcademyFinalCommand snapshot={await academyFinalSnapshot(context)} mode={mode}/>}
