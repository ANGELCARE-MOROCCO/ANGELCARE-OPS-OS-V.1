import {classifyRevenueAiError} from './errors'
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms))
export async function withRevenueAiRetry<T>(operation:(attempt:number)=>Promise<T>,maxRetries:number){let last:unknown;for(let attempt=0;attempt<=maxRetries;attempt++){try{return await operation(attempt)}catch(error){last=error;const classified=classifyRevenueAiError(error);if(!classified.retryable||attempt===maxRetries)throw classified;const delay=Math.min(8000,500*2**attempt+Math.floor(Math.random()*250));await sleep(delay)}}throw last}
