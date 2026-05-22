"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TimeSeriesData } from "@/lib/analytics/service";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CostTrendsChartProps {
  data: TimeSeriesData[];
}

export function CostTrendsChart({ data }: CostTrendsChartProps) {
  const totalCost = data.reduce((sum, d) => sum + d.value, 0);
  const avgCost = (totalCost / data.length).toFixed(2);
  const maxCost = Math.max(...data.map((d) => d.value)).toFixed(2);
  const minCost = Math.min(...data.map((d) => d.value)).toFixed(2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cost Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-xl font-bold">${totalCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Average Daily</p>
            <p className="text-xl font-bold">${avgCost}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Maximum</p>
            <p className="text-xl font-bold">${maxCost}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Minimum</p>
            <p className="text-xl font-bold">${minCost}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(value) => `$${(value as number).toFixed(2)}`} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorCost)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
