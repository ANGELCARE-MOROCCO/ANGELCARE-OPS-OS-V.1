import type { Row } from "./model";

export type ScaleR4 = {
  enabled: boolean;
  globalConcurrency: number;
  perProjectConcurrency: number;
  perOriginConcurrency: number;
  workersPerTick: number;
  jobsPerWorker: number;
  requestTimeoutSeconds: number;
  leaseSeconds: number;
  maxAttempts: number;
  linkBatchSize: number;
  linksPerPage: number;
  maxPagesPerProject: number;
  discoveryBatchSize: number;
  dailyJobsPerProject: number;
  queueLimitPerProject: number;
  scheduleBatchSize: number;
};
export const R4_DEFAULTS: ScaleR4 = Object.freeze({
  enabled: false,globalConcurrency: 16,perProjectConcurrency: 8,perOriginConcurrency: 8,
  workersPerTick: 4,jobsPerWorker: 1,requestTimeoutSeconds: 30,
  leaseSeconds: 240,maxAttempts: 6,linkBatchSize: 4,linksPerPage: 300,
  maxPagesPerProject: 250000,discoveryBatchSize: 120,
  dailyJobsPerProject: 20000,queueLimitPerProject: 100000,scheduleBatchSize: 250,
});
function bounded(value: unknown, fallback: number, min: number, max: number): number {
  const n=Number(value);
  return Number.isSafeInteger(n) && n>=min && n<=max ? n : fallback;
}
export function parseScaleR4(value: unknown): ScaleR4 {
  const v=value&&typeof value==="object"&&!Array.isArray(value)?value as Row:{};
  const capacity=v.capacity&&typeof v.capacity==="object"&&!Array.isArray(v.capacity)?v.capacity as Row:v;
  const defaults=R4_DEFAULTS;
  return {
    enabled:v.enabled===true,
    globalConcurrency:bounded(capacity.globalConcurrency,defaults.globalConcurrency,1,64),
    perProjectConcurrency:bounded(capacity.perProjectConcurrency,defaults.perProjectConcurrency,1,32),
    perOriginConcurrency:bounded(capacity.perOriginConcurrency,defaults.perOriginConcurrency,1,32),
    workersPerTick:bounded(capacity.workersPerTick,defaults.workersPerTick,1,8),
    jobsPerWorker:bounded(capacity.jobsPerWorker,defaults.jobsPerWorker,1,6),
    requestTimeoutSeconds:bounded(capacity.requestTimeoutSeconds,defaults.requestTimeoutSeconds,5,45),
    leaseSeconds:bounded(capacity.leaseSeconds,defaults.leaseSeconds,90,600),
    maxAttempts:bounded(capacity.maxAttempts,defaults.maxAttempts,1,12),
    linkBatchSize:bounded(capacity.linkBatchSize,defaults.linkBatchSize,1,48),
    linksPerPage:bounded(capacity.linksPerPage,defaults.linksPerPage,10,1000),
    maxPagesPerProject:bounded(capacity.maxPagesPerProject,defaults.maxPagesPerProject,10000,1000000),
    discoveryBatchSize:bounded(capacity.discoveryBatchSize,defaults.discoveryBatchSize,1,500),
    dailyJobsPerProject:bounded(capacity.dailyJobsPerProject,defaults.dailyJobsPerProject,120,100000),
    queueLimitPerProject:bounded(capacity.queueLimitPerProject,defaults.queueLimitPerProject,1000,500000),
    scheduleBatchSize:bounded(capacity.scheduleBatchSize,defaults.scheduleBatchSize,1,1000),
  };
}
export function isEligibleIndexNow(policyEnabled: boolean, status: unknown, indexable: unknown): boolean {
  return policyEnabled === true && status === 200 && indexable === true;
}
export function isEligibleLinks(facts: unknown): boolean {
  return Boolean(facts && typeof facts==="object" && !Array.isArray(facts) && Array.isArray((facts as Row).links));
}
