/** Single, server-authoritative JOBKIX identity. Never infer role from URLs, metadata or organization counts. */
export type JobkixPathway = 'candidate' | 'hirer';
export function isPathway(value:unknown):value is JobkixPathway{return value==='candidate'||value==='hirer';}
export function isCommandAllowed(pathway:JobkixPathway,action:string,payload:Record<string,unknown>):boolean{
 const candidate=new Set(['profile.save','privacy.save','application.submit','application.withdraw','interview.respond','offer.respond','saved.save','saved.remove','external.saved.save','external.saved.remove','search.save','search.remove','privacy.block','privacy.unblock','reputation.contribute','reputation.withdraw','resource.save']);
 const hirer=new Set(['organization.create','organization.save','site.create','site.save','team.invite','team.accept','team.change','team.transfer','team.revoke','pool.create','pool.add','pool.remove','evaluation.save','verification.submit','employer.search.save','application.stage','application.bulk_stage','interview.propose','interview.reschedule','interview.cancel','interview.complete','interview.panel_respond','offer.create','offer.save','offer.send','offer.withdraw']);
 const shared=new Set(['message.send','case.create','case.reply','case.appeal','privacy.request','settings.save','notification.read']);
 if(action.startsWith('vacancy.'))return pathway==='hirer';
 if(candidate.has(action))return pathway==='candidate';
 if(hirer.has(action))return pathway==='hirer';
 if(shared.has(action))return true;
 if(action==='draft.save'||action==='draft.remove'){
  const kind=payload.kind;
  if(['application','profile','reputation'].includes(String(kind)))return pathway==='candidate';
  if(['vacancy','organization','hiring','team','talent'].includes(String(kind)))return pathway==='hirer';
  return kind==='case'||kind==='message';
 }
 return false; // default deny new actions until explicitly classified and reviewed
}
