"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApiResponseTimes } from "@/lib/analytics/service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface ApiMetricsChartProps {
  data: ApiResponseTimes[];
}

export function ApiMetricsChart({ data }: ApiMetricsChartProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">API Response Times</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => `${value}ms`} />
              <Bar dataKey="averageTime" fill="#3b82f6" name="Avg Time (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">P95 vs P99 Latency</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => `${value}ms`} />
              <Line
                type="monotone"
                dataKey="p95"
                stroke="#f59e0b"
                name="P95 (ms)"
              />
              <Line
                type="monotone"
                dataKey="p99"
                stroke="#ef4444"
                name="P99 (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Error Rates by Endpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((endpoint) => (
              <div key={endpoint.endpoint} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{endpoint.endpoint}</p>
                  <div className="mt-1 h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${endpoint.errorRate * 100}%` }}
                    />
                  </div>
                </div>
                <p className="ml-4 text-sm font-semibold">
                  {(endpoint.errorRate * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
