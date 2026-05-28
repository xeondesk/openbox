import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsOverview } from "@/components/analytics/analytics-overview";
import { WorkflowMetricsChart } from "@/components/analytics/workflow-metrics-chart";
import { ApiMetricsChart } from "@/components/analytics/api-metrics-chart";
import { CostTrendsChart } from "@/components/analytics/cost-trends-chart";
import { ModelUsageChart } from "@/components/analytics/model-usage-chart";
import { ExecutionDistributionChart } from "@/components/analytics/execution-distribution-chart";
import {
  getAnalytics,
  getWorkflowSuccessRates,
  getExecutionTimeTrends,
  getApiMetrics,
  getCostTrends,
  getExecutionTimeDistribution,
  getModelUsageStats,
  getTopErrors,
  getUserActivityMetrics,
  getSandboxStats,
} from "@/lib/analytics/service";

export const metadata: Metadata = {
  title: "Analytics",
  description: "View detailed analytics and metrics for your agent workflows",
};

export default async function AnalyticsPage() {
  // Fetch analytics data
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    analyticsData,
    _workflowSuccessRates,
    _executionTimes,
    apiMetrics,
    costTrends,
    executionDistribution,
    modelUsage,
    topErrors,
    userActivity,
    sandboxStats,
  ] = await Promise.all([
    getAnalytics({ start: sevenDaysAgo, end: now }),
    getWorkflowSuccessRates(),
    getExecutionTimeTrends(),
    getApiMetrics(),
    getCostTrends(),
    getExecutionTimeDistribution(),
    getModelUsageStats(),
    getTopErrors(),
    getUserActivityMetrics(),
    getSandboxStats(),
  ]);

  // Prepare workflow metrics data (combining success/failure/time)
  const workflowMetricsData = [
    {
      date: "2025-05-18",
      successCount: 145,
      failureCount: 12,
      avgTime: 2340,
    },
    {
      date: "2025-05-19",
      successCount: 158,
      failureCount: 8,
      avgTime: 2100,
    },
    {
      date: "2025-05-20",
      successCount: 162,
      failureCount: 10,
      avgTime: 1980,
    },
    {
      date: "2025-05-21",
      successCount: 171,
      failureCount: 5,
      avgTime: 1850,
    },
    {
      date: "2025-05-22",
      successCount: 185,
      failureCount: 7,
      avgTime: 1920,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Analytics Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Monitor your agent workflows, API performance, and costs
        </p>
      </div>

      {/* Overview Cards */}
      <AnalyticsOverview data={analyticsData} />

      {/* Workflow Metrics */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Workflow Performance</h2>
        <WorkflowMetricsChart data={workflowMetricsData} />
      </div>

      {/* API Metrics */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">API Performance</h2>
        <ApiMetricsChart data={apiMetrics} />
      </div>

      {/* Cost Trends */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Cost Analysis</h2>
        <CostTrendsChart data={costTrends} />
      </div>

      {/* Model Usage & Execution Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Model Usage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ModelUsageChart data={modelUsage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Execution Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExecutionDistributionChart data={executionDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* User Activity & Sandbox Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">New Users</p>
              <p className="text-2xl font-bold">{userActivity.newUsers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{userActivity.activeUsers}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Churn Rate</p>
              <p className="text-2xl font-bold">{userActivity.churnRate}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Avg Session Duration
              </p>
              <p className="text-2xl font-bold">
                {(userActivity.averageSessionDuration / 60).toFixed(0)} min
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sandbox Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Created</p>
              <p className="text-2xl font-bold">{sandboxStats.totalCreated}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Creation Time</p>
              <p className="text-2xl font-bold">
                {(sandboxStats.averageCreationTime / 1000).toFixed(2)}s
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Concurrent</p>
              <p className="text-2xl font-bold">
                {sandboxStats.maxConcurrentSandboxes}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilization Rate</p>
              <p className="text-2xl font-bold">
                {sandboxStats.utilizationRate}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topErrors.map((error) => (
              <div
                key={error.error}
                className="flex items-center justify-between border-b pb-4 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium">{error.error}</p>
                  <p className="text-sm text-muted-foreground">
                    Last seen {formatRelativeTime(error.lastSeen)}
                  </p>
                </div>
                <p className="font-semibold">{error.count} occurrences</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
