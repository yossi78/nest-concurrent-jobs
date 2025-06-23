# Nest Concurrent Jobs Service

This service is a NestJS-based REST API for launching and monitoring concurrent native (C++) processing jobs on Windows. It simulates C++ jobs using a batch script and provides job control, monitoring, and statistical insights.

## Features
- Start and monitor multiple jobs concurrently
- Track job statuses and handle unexpected exits (watchdog behavior)
- Retry failed jobs once
- Expose REST API endpoints for job control and monitoring
- Generate statistical insights about job characteristics and outcomes

## Prerequisites
- Node.js (v18 or newer recommended)
- Windows OS (uses a batch script to simulate C++ jobs)

## Postman collection
- under resources you can download postman collection 

## Installation
```bash
npm install
```

## Running the Service
```bash
npm run start
```
The service will start on [http://localhost:3000](http://localhost:3000).

## API Endpoints

### 1. Start a New Job
**POST** `/jobs`

Request body example:
```json
{
  "jobName": "my-task-42",
  "arguments": ["arg1", "arg2"]
}
```
Response: Job object with status and details.

### 2. List All Jobs
**GET** `/jobs`

Returns a list of all submitted jobs and their current statuses (running, completed, crashed, retried, etc.).

### 3. Get Job Statistics
**GET** `/jobs/stats`

Returns correlations and insights between job characteristics (e.g., name length, argument count) and job success rates.

Example response:
```json
{
  "totalJobs": 100,
  "overallSuccessRate": 0.68,
  "patterns": [
    {
      "pattern": "Job name length > 10",
      "matchCount": 24,
      "successRate": 0.83,
      "differenceFromAverage": "+15%"
    }
  ]
}
```

## API Documentation
Swagger UI is available at: [http://localhost:3000/api](http://localhost:3000/api)

## Notes
- Jobs are simulated using `scripts/dummy-cpp-app.bat` and randomly succeed or fail.
- All job state is kept in memory (restarts will clear job history).
- The service is for demonstration and testing purposes. 