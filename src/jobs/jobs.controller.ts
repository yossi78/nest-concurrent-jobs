import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './interfaces/job.interface';
import { JobStats } from './interfaces/stats.interface';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new job' })
  @ApiBody({ type: CreateJobDto })
  @ApiResponse({
    status: 201,
    description: 'Job started successfully',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid job data',
  })
  async startJob(@Body() createJobDto: CreateJobDto): Promise<Job> {
    return this.jobsService.startJob(createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs and their statuses' })
  @ApiResponse({
    status: 200,
    description: 'List of all jobs',
    type: [Object],
  })
  async getAllJobs(): Promise<Job[]> {
    return this.jobsService.getAllJobs();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get job statistics and pattern analysis' })
  @ApiResponse({
    status: 200,
    description: 'Job statistics and patterns',
    type: Object,
  })
  async getStats(): Promise<JobStats> {
    return this.jobsService.getStats();
  }
} 