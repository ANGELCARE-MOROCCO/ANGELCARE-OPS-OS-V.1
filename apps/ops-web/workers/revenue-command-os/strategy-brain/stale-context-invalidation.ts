export const workerName='stale-context-invalidation';
export async function run(payload:unknown){return {worker:workerName,status:'completed',mode:'shadow',externalActions:false,payloadHash:JSON.stringify(payload).length}}
