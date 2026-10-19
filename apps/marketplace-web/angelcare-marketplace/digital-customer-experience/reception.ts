import { MarketplaceError } from '../server/errors'
import type { Data } from './types'
/** Existing receiving history remains retained. Routine public outcomes never enter admin intake. */
export async function receiveCustomerExperience(_input:{releaseId:string;requestId:string;values:Data;consent:boolean;kind:'form'|'contribution';body?:string;rating?:number;parentId?:string;contributionType?:'review'|'question'|'reply'|'comment'}):Promise<never>{throw new MarketplaceError('FORBIDDEN','Ordinary public experiences do not submit to admin. Use the explicit course-certificate request contract.')}
