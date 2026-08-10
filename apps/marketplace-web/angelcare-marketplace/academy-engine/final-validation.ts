import {MarketplaceError} from '../server/errors'
const cohort:Record<string,string[]>={draft:['enrollment_open','cancelled'],enrollment_open:['enrollment_closed','cancelled'],enrollment_closed:['scheduled','cancelled'],scheduled:['active','cancelled'],active:['assessment','completion_review','cancelled'],assessment:['completion_review','active'],completion_review:['completed','active'],completed:['archived'],cancelled:['archived'],archived:[]}
const session:Record<string,string[]>={scheduled:['active','rescheduled','cancelled'],rescheduled:['scheduled','cancelled'],active:['completed','cancelled'],completed:[],cancelled:[]}
const b2b:Record<string,string[]>={draft:['quoted','cancelled'],quoted:['contracted','cancelled'],contracted:['scheduling','cancelled'],scheduling:['active','cancelled'],active:['completed','cancelled'],completed:['archived'],cancelled:['archived'],archived:[]}
const publication:Record<string,string[]>={draft:['review'],review:['approved','draft'],approved:['published','suspended'],published:['suspended','archived'],suspended:['published','archived'],archived:[]}
function check(map:Record<string,string[]>,current:string,next:string,label:string){if(!map[current]?.includes(next))throw new MarketplaceError('VALIDATION_ERROR',`Transition ${label} interdite: ${current} → ${next}.`)}
export const assertCohortFinalTransition=(c:string,n:string)=>check(cohort,c,n,'cohorte')
export const assertSessionTransition=(c:string,n:string)=>check(session,c,n,'session')
export const assertB2BTransition=(c:string,n:string)=>check(b2b,c,n,'commande B2B')
export const assertAcademyPublicationTransition=(c:string,n:string)=>check(publication,c,n,'publication Academy')
