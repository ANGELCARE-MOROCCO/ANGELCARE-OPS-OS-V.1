import 'server-only'
export const workerCode='anomaly-worker'
export interface WorkerCycleResult{worker:string;leased:number;completed:number;failed:number;externalActions:number}
export async function runCycle():Promise<WorkerCycleResult>{return{worker:workerCode,leased:0,completed:0,failed:0,externalActions:0}}
