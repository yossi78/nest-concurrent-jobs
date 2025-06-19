export interface JobPattern {
  pattern: string;
  matchCount: number;
  successRate: number;
  differenceFromAverage: string;
}

export interface JobStats {
  totalJobs: number;
  overallSuccessRate: number;
  patterns: JobPattern[];
} 