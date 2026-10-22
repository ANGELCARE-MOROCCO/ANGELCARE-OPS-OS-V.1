import { JobkixFault } from './contracts';
import { choice,locale,text,integer } from './validation';
export function taxonomyQuery(params:URLSearchParams){for(const key of params.keys())if(!['kind','locale','q','page'].includes(key)||params.getAll(key).length!==1)throw new JobkixFault('INVALID_INPUT');const page=params.get('page')||'1';if(!/^\d{1,5}$/.test(page))throw new JobkixFault('INVALID_INPUT');return {kind:choice(params.get('kind'),['setting','occupation'],'kind'),locale:locale(params.get('locale')),q:text(params.get('q')||'','q',0,240),page:integer(Number(page),'page',1,10000)};}
