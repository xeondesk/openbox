/**
 * Analytics service for aggregating and retrieving metrics data
 *
 * This service handles data aggregation for the analytics dashboard,
 * including workflow metrics, chat analytics, sandbox usage, and costs.
 */

interface TimeRange {
  start: Date;
  end: Date;
}

export interface AnalyticsData {
  totalWorkflows: number;
  successfulWorkflows: number;
  failedWorkflows: number;
  averageExecutionTime: number;
  totalApiCalls: number;
  averageResponseTime: number;
  totalUsers: number;
  activeUsers: number;
  totalSandboxes: number;
  averageCostPerRun: number;
  totalCostThisPeriod: number;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label: string;
}

interface WorkflowSuccessRate {
  date: string;
  successRate: number;
  count: number;
}

export interface ApiResponseTimes {
  endpoint: string;
  averageTime: number;
  p95: number;
  p99: number;
  errorRate: number;
}

/**
 * Mock data for dashboard (in production, fetch from database)
 */
const mockWorkflowData = [
  { date: "2025-05-18", successCount: 145, failureCount: 12, avgTime: 2340 },
  { date: "2025-05-19", successCount: 158, failureCount: 8, avgTime: 2100 },
  { date: "2025-05-20", successCount: 162, failureCount: 10, avgTime: 1980 },
  { date: "2025-05-21", successCount: 171, failureCount: 5, avgTime: 1850 },
  { date: "2025-05-22", successCount: 185, failureCount: 7, avgTime: 1920 },
];

const mockApiMetrics = [
  { endpoint: "/api/chat", time: 245, p95: 520, p99: 850, errors: 0.2 },
  { endpoint: "/api/sandbox", time: 1340, p95: 2100, p99: 3200, errors: 0.5 },
  { endpoint: "/api/sessions", time: 120, p95: 280, p99: 450, errors: 0.1 },
  {
    endpoint: "/api/generate-commit",
    time: 2100,
    p95: 4200,
    p99: 6500,
    errors: 0.8,
  },
  { endpoint: "/api/transcribe", time: 890, p95: 1800, p99: 2900, errors: 0.3 },
];

const mockCostData = [
  { date: "2025-05-18", cost: 24.5 },
  { date: "2025-05-19", cost: 28.75 },
  { date: "2025-05-20", cost: 31.2 },
  { date: "2025-05-21", cost: 26.8 },
  { date: "2025-05-22", cost: 32.45 },
];

/**
 * Get aggregated analytics for a time range
 */
export async function getAnalytics(
  _timeRange: TimeRange,
): Promise<AnalyticsData> {
  // In production, query database for real metrics
  const workflows = mockWorkflowData;

  const totalWorkflows = workflows.reduce(
    (sum, d) => sum + d.successCount + d.failureCount,
    0,
  );
  const successfulWorkflows = workflows.reduce(
    (sum, d) => sum + d.successCount,
    0,
  );
  const failedWorkflows = workflows.reduce((sum, d) => sum + d.failureCount, 0);
  const averageExecutionTime = Math.round(
    workflows.reduce((sum, d) => sum + d.avgTime, 0) / workflows.length,
  );

  const costs = mockCostData.reduce((sum, d) => sum + d.cost, 0);

  return {
    totalWorkflows,
    successfulWorkflows,
    failedWorkflows,
    averageExecutionTime,
    totalApiCalls: 12847,
    averageResponseTime: 892,
    totalUsers: 1240,
    activeUsers: 342,
    totalSandboxes: 486,
    averageCostPerRun:
      costs > 0 ? Math.round((costs / totalWorkflows) * 100) / 100 : 0,
    totalCostThisPeriod: Math.round(costs * 100) / 100,
  };
}

/**
 * Get workflow success rate over time
 */
export async function getWorkflowSuccessRates(): Promise<
  WorkflowSuccessRate[]
> {
  return mockWorkflowData.map((d) => ({
    date: d.date,
    successRate: Math.round(
      (d.successCount / (d.successCount + d.failureCount)) * 100,
    ),
    count: d.successCount + d.failureCount,
  }));
}

/**
 * Get workflow execution time trends
 */
export async function getExecutionTimeTrends(): Promise<TimeSeriesData[]> {
  return mockWorkflowData.map((d) => ({
    timestamp: new Date(d.date),
    value: d.avgTime,
    label: d.date,
  }));
}

/**
 * Get API response time metrics for all endpoints
 */
export async function getApiMetrics(): Promise<ApiResponseTimes[]> {
  return mockApiMetrics.map((m) => ({
    endpoint: m.endpoint,
    averageTime: m.time,
    p95: m.p95,
    p99: m.p99,
    errorRate: m.errors,
  }));
}

/**
 * Get cost trends over time
 */
export async function getCostTrends(): Promise<TimeSeriesData[]> {
  return mockCostData.map((d) => ({
    timestamp: new Date(d.date),
    value: d.cost,
    label: d.date,
  }));
}

/**
 * Get workflow execution time distribution
 */
export async function getExecutionTimeDistribution(): Promise<
  Array<{
    range: string;
    count: number;
  }>
> {
  return [
    { range: "< 1s", count: 320 },
    { range: "1-5s", count: 485 },
    { range: "5-10s", count: 245 },
    { range: "10-30s", count: 156 },
    { range: "> 30s", count: 48 },
  ];
}

/**
 * Get model usage statistics
 */
export async function getModelUsageStats(): Promise<
  Array<{
    model: string;
    usage: number;
    percentage: number;
  }>
> {
  const stats = [
    { model: "gpt-4o", usage: 487 },
    { model: "claude-opus", usage: 342 },
    { model: "gpt-4-turbo", usage: 215 },
    { model: "claude-haiku", usage: 128 },
    { model: "others", usage: 82 },
  ];

  const total = stats.reduce((sum, s) => sum + s.usage, 0);

  return stats.map((s) => ({
    ...s,
    percentage: Math.round((s.usage / total) * 100),
  }));
}

/**
 * Get top errors in recent executions
 */
export async function getTopErrors(): Promise<
  Array<{
    error: string;
    count: number;
    lastSeen: Date;
  }>
> {
  return [
    {
      error: "Sandbox timeout",
      count: 42,
      lastSeen: new Date(Date.now() - 3600000),
    },
    {
      error: "Memory limit exceeded",
      count: 28,
      lastSeen: new Date(Date.now() - 7200000),
    },
    {
      error: "Network connection failed",
      count: 19,
      lastSeen: new Date(Date.now() - 1800000),
    },
    {
      error: "Invalid git credentials",
      count: 15,
      lastSeen: new Date(Date.now() - 86400000),
    },
    {
      error: "Model rate limit",
      count: 11,
      lastSeen: new Date(Date.now() - 2700000),
    },
  ];
}

/**
 * Get user activity metrics
 */
export async function getUserActivityMetrics(): Promise<{
  newUsers: number;
  activeUsers: number;
  churnRate: number;
  averageSessionDuration: number;
  mostActiveHour: number;
}> {
  return {
    newUsers: 34,
    activeUsers: 342,
    churnRate: 2.1,
    averageSessionDuration: 1840, // seconds
    mostActiveHour: 14, // 2 PM UTC
  };
}

/**
 * Get sandbox performance stats
 */
export async function getSandboxStats(): Promise<{
  totalCreated: number;
  averageCreationTime: number;
  averageMemoryUsage: number;
  maxConcurrentSandboxes: number;
  utilizationRate: number;
}> {
  return {
    totalCreated: 486,
    averageCreationTime: 2340,
    averageMemoryUsage: 512, // MB
    maxConcurrentSandboxes: 24,
    utilizationRate: 68,
  };
}
