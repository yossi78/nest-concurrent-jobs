export enum JobStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  CRASHED = 'crashed',
  RETRYING = 'retrying',
  RETRY_FAILED = 'retry_failed',
}

export interface Job {
  id: string;
  jobName: string;
  arguments: string[];
  status: JobStatus;
  startTime: Date;
  endTime?: Date;
  exitCode?: number;
  retryCount: number;
  maxRetries: number;
  processId?: number;
  output?: string;
  error?: string;
} 