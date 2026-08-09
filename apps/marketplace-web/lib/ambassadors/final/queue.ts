export function buildQueueJob(job: { queueName: string; jobType: string; payload: Record<string, unknown>; maxAttempts?: number }) {
  return {
    queue_name: job.queueName,
    job_type: job.jobType,
    payload: job.payload,
    status: 'queued',
    attempts: 0,
    max_attempts: job.maxAttempts ?? 3,
    run_after: new Date().toISOString()
  };
}

export function shouldRetryJob(status: string, attempts: number, maxAttempts: number): boolean {
  return status === 'failed' && attempts < maxAttempts;
}
