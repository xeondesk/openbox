"use client";

import type { AnalyticsData } from "@/lib/analytics/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface AnalyticsOverviewProps {
  data: AnalyticsData;
}

export function AnalyticsOverview({ data }: AnalyticsOverviewProps) {
  const successRate =
    data.totalWorkflows > 0
      ? Math.round((data.successfulWorkflows / data.totalWorkflows) * 100)
      : 0;

  const cards = [
    {
      label: "Total Workflows",
      value: data.totalWorkflows.toLocaleString(),
      trend: "+12%",
      positive: true,
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      trend: "+2%",
      positive: true,
    },
    {
      label: "Avg Execution Time",
      value: `${(data.averageExecutionTime / 1000).toFixed(2)}s`,
      trend: "-5%",
      positive: true,
    },
    {
      label: "Total Cost (Period)",
      value: `$${data.totalCostThisPeriod.toFixed(2)}`,
      trend: "+8%",
      positive: false,
    },
    {
      label: "Active Users",
      value: data.activeUsers.toLocaleString(),
      trend: "+15%",
      positive: true,
    },
    {
      label: "Avg Response Time",
      value: `${data.averageResponseTime}ms`,
      trend: "-3%",
      positive: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
            {card.positive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              <span
                className={card.positive ? "text-green-600" : "text-red-600"}
              >
                {card.trend}
              </span>{" "}
              from last period
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
