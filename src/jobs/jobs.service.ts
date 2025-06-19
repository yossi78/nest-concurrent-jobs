import { Injectable, Logger } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { Job, JobStatus } from './interfaces/job.interface';
import { JobStats, JobPattern } from './interfaces/stats.interface';
import { CreateJobDto } from './dto/create-job.dto';
import * as path from 'path';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);
  private jobs: Map<string, Job> = new Map();
  private readonly maxRetries = 1;

  constructor() {
    // Cleanup completed jobs every 5 minutes
    setInterval(() => this.cleanupOldJobs(), 5 * 60 * 1000);
  }

  async startJob(createJobDto: CreateJobDto): Promise<Job> {
    const jobId = uuidv4();
    const job: Job = {
      id: jobId,
      jobName: createJobDto.jobName,
      arguments: createJobDto.arguments,
      status: JobStatus.RUNNING,
      startTime: new Date(),
      retryCount: 0,
      maxRetries: this.maxRetries,
    };

    this.jobs.set(jobId, job);
    this.logger.log(`Starting job ${jobId}: ${createJobDto.jobName}`);

    await this.executeJob(job);
    return job;
  }

  private async executeJob(job: Job): Promise<void> {
    try {
      // Use the dummy C++ app script
      const scriptPath = path.join(process.cwd(), 'scripts', 'dummy-cpp-app.bat');
      const args = [scriptPath, ...job.arguments];
      
      const childProcess = spawn('cmd', ['/c', ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      job.processId = childProcess.pid;
      this.jobs.set(job.id, job);

      let output = '';
      let error = '';

      childProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      childProcess.stderr?.on('data', (data) => {
        error += data.toString();
      });

      childProcess.on('close', (code) => {
        job.endTime = new Date();
        job.exitCode = code;
        job.output = output;
        job.error = error;

        if (code === 0) {
          job.status = JobStatus.COMPLETED;
          this.logger.log(`Job ${job.id} completed successfully`);
        } else {
          if (job.retryCount < job.maxRetries) {
            job.status = JobStatus.RETRYING;
            job.retryCount++;
            this.logger.warn(`Job ${job.id} failed, retrying (${job.retryCount}/${job.maxRetries})`);
            setTimeout(() => this.executeJob(job), 1000); // Retry after 1 second
          } else {
            job.status = JobStatus.RETRY_FAILED;
            this.logger.error(`Job ${job.id} failed after ${job.maxRetries} retries`);
          }
        }

        this.jobs.set(job.id, job);
      });

      childProcess.on('error', (err) => {
        job.endTime = new Date();
        job.error = err.message;
        job.status = JobStatus.CRASHED;
        this.logger.error(`Job ${job.id} crashed: ${err.message}`);
        this.jobs.set(job.id, job);
      });

    } catch (error) {
      job.endTime = new Date();
      job.error = error.message;
      job.status = JobStatus.CRASHED;
      this.logger.error(`Failed to start job ${job.id}: ${error.message}`);
      this.jobs.set(job.id, job);
    }
  }

  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  getJobById(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  getStats(): JobStats {
    const allJobs = this.getAllJobs();
    const completedJobs = allJobs.filter(job => job.status === JobStatus.COMPLETED);
    const overallSuccessRate = allJobs.length > 0 ? completedJobs.length / allJobs.length : 0;

    const patterns: JobPattern[] = [
      this.analyzeJobNameLength(allJobs, overallSuccessRate),
      this.analyzeJobNameDigits(allJobs, overallSuccessRate),
      this.analyzeArgumentCount(allJobs, overallSuccessRate),
      this.analyzeJobNameCase(allJobs, overallSuccessRate),
      this.analyzeJobNameSpecialChars(allJobs, overallSuccessRate),
    ];

    return {
      totalJobs: allJobs.length,
      overallSuccessRate,
      patterns,
    };
  }

  private analyzeJobNameLength(jobs: Job[], overallSuccessRate: number): JobPattern {
    const longNameJobs = jobs.filter(job => job.jobName.length > 10);
    const longNameSuccess = longNameJobs.filter(job => job.status === JobStatus.COMPLETED);
    const successRate = longNameJobs.length > 0 ? longNameSuccess.length / longNameJobs.length : 0;
    const difference = ((successRate - overallSuccessRate) / overallSuccessRate * 100).toFixed(0);

    return {
      pattern: 'Job name length > 10',
      matchCount: longNameJobs.length,
      successRate,
      differenceFromAverage: `${difference}%`,
    };
  }

  private analyzeJobNameDigits(jobs: Job[], overallSuccessRate: number): JobPattern {
    const jobsWithDigits = jobs.filter(job => /\d/.test(job.jobName));
    const digitSuccess = jobsWithDigits.filter(job => job.status === JobStatus.COMPLETED);
    const successRate = jobsWithDigits.length > 0 ? digitSuccess.length / jobsWithDigits.length : 0;
    const difference = ((successRate - overallSuccessRate) / overallSuccessRate * 100).toFixed(0);

    return {
      pattern: 'Job name contains digits',
      matchCount: jobsWithDigits.length,
      successRate,
      differenceFromAverage: `${difference}%`,
    };
  }

  private analyzeArgumentCount(jobs: Job[], overallSuccessRate: number): JobPattern {
    const jobsWithManyArgs = jobs.filter(job => job.arguments.length > 2);
    const manyArgsSuccess = jobsWithManyArgs.filter(job => job.status === JobStatus.COMPLETED);
    const successRate = jobsWithManyArgs.length > 0 ? manyArgsSuccess.length / jobsWithManyArgs.length : 0;
    const difference = ((successRate - overallSuccessRate) / overallSuccessRate * 100).toFixed(0);

    return {
      pattern: 'Argument count > 2',
      matchCount: jobsWithManyArgs.length,
      successRate,
      differenceFromAverage: `${difference}%`,
    };
  }

  private analyzeJobNameCase(jobs: Job[], overallSuccessRate: number): JobPattern {
    const lowercaseJobs = jobs.filter(job => job.jobName === job.jobName.toLowerCase());
    const lowercaseSuccess = lowercaseJobs.filter(job => job.status === JobStatus.COMPLETED);
    const successRate = lowercaseJobs.length > 0 ? lowercaseSuccess.length / lowercaseJobs.length : 0;
    const difference = ((successRate - overallSuccessRate) / overallSuccessRate * 100).toFixed(0);

    return {
      pattern: 'Job name is all lowercase',
      matchCount: lowercaseJobs.length,
      successRate,
      differenceFromAverage: `${difference}%`,
    };
  }

  private analyzeJobNameSpecialChars(jobs: Job[], overallSuccessRate: number): JobPattern {
    const jobsWithSpecialChars = jobs.filter(job => /[^a-zA-Z0-9]/.test(job.jobName));
    const specialCharsSuccess = jobsWithSpecialChars.filter(job => job.status === JobStatus.COMPLETED);
    const successRate = jobsWithSpecialChars.length > 0 ? specialCharsSuccess.length / jobsWithSpecialChars.length : 0;
    const difference = ((successRate - overallSuccessRate) / overallSuccessRate * 100).toFixed(0);

    return {
      pattern: 'Job name contains special characters',
      matchCount: jobsWithSpecialChars.length,
      successRate,
      differenceFromAverage: `${difference}%`,
    };
  }

  private cleanupOldJobs(): void {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    for (const [id, job] of this.jobs.entries()) {
      if (job.endTime && job.endTime < oneHourAgo) {
        this.jobs.delete(id);
        this.logger.debug(`Cleaned up old job: ${id}`);
      }
    }
  }
} 