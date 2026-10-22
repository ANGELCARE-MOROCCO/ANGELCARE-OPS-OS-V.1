import { JobkixFault } from './contracts';
import { integer,text,uuid } from './validation';
export function panelSelectionParams(application:string,selected:string[]=[]):URLSearchParams{
 const params=new URLSearchParams({kind:'panels',application});for(const id of selected)params.append('selected',id);return params;
}
/** Application context owns the candidate exclusion and vacancy/site scope. */
export function panelSelectionRequest(params:URLSearchParams):{application:string;page:number;q:string;selected:string[]}{
 for(const key of params.keys())if(!['kind','application','page','q','selected'].includes(key)||key!=='selected'&&params.getAll(key).length!==1)throw new JobkixFault('INVALID_INPUT');
 const page=params.get('page')||'1',selected=params.getAll('selected').map(value=>uuid(value,'selected'));
 if(params.get('kind')!=='panels'||!/^[1-9]\d{0,4}$/.test(page)||selected.length>20||new Set(selected).size!==selected.length)throw new JobkixFault('INVALID_INPUT');
 return {application:uuid(params.get('application'),'application'),page:integer(Number(page),'page',1,10000),q:text(params.get('q')||'','q',0,180),selected};
}
