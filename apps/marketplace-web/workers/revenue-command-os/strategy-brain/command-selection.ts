export const workerName='command-selection';
export async function run(payload:unknown){return {worker:workerName,status:'completed',mode:'shadow',externalActions:false,payloadHash:JSON.stringify(payload).length}}
