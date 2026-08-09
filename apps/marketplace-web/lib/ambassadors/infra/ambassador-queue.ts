export type AmbassadorJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'retrying';

export type AmbassadorQueueJob = {
  id: string;
  queueName: string;
  jobType: string;
  payload: Record<string, unknown>;
  status: AmbassadorJobStatus;
  attempts: number;
  maxAttempts: number;
  runAfter: string;
};

export function createQueueJob(input: Omit<AmbassadorQueueJob, 'id' | 'status' | 'attempts' | 'runAfter'>): AmbassadorQueueJob {
  return {
    ...input,
    id: `job-${Date.now()}`,
    status: 'queued',
    attempts: 0,
    runAfter: new Date().toISOString()
  };
}

export function shouldRetryJob(job: AmbassadorQueueJob): boolean {
  return job.attempts < job.maxAttempts && job.status === 'failed';
}
