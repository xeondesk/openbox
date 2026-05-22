"use client";

import type { ScheduledRun, ScheduledRunExecution } from "@/lib/scheduling/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Play,
  Pause,
  Trash2,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Calendar,
  Zap,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface ScheduledRunsPanelProps {
  schedules: ScheduledRun[];
  executions: Map<string, ScheduledRunExecution[]>;
  onTrigger?: (scheduleId: string) => void;
  onToggle?: (scheduleId: string, enabled: boolean) => void;
  onDelete?: (scheduleId: string) => void;
  onCreateNew?: () => void;
}

export function ScheduledRunsPanel({
  schedules,
  executions,
  onTrigger,
  onToggle,
  onDelete,
  onCreateNew,
}: ScheduledRunsPanelProps) {
  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredSchedules = schedules.filter((s) => {
    if (filter === "active") return s.enabled;
    if (filter === "inactive") return !s.enabled;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-50";
      case "failure":
        return "text-red-600 bg-red-50";
      case "running":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getFrequencyLabel = (frequency: string): string => {
    const labels: Record<string, string> = {
      hourly: "Every hour",
      daily: "Daily at midnight",
      weekly: "Weekly on Sunday",
      monthly: "Monthly on the 1st",
      custom: "Custom schedule",
    };
    return labels[frequency] || frequency;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Scheduled Runs</h3>
          <Badge variant="secondary">{schedules.length}</Badge>
        </div>
        <Button
          onClick={onCreateNew}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          + New Schedule
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {["all", "active", "inactive"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab as "all" | "active" | "inactive")}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Schedules List */}
      {filteredSchedules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              No scheduled runs yet. Create one to automate your workflow.
            </p>
            <Button
              onClick={onCreateNew}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Create First Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredSchedules.map((schedule) => {
            const scheduleExecutions = executions.get(schedule.id) || [];
            const lastExecution = scheduleExecutions[scheduleExecutions.length - 1];
            const stats = calculateStats(scheduleExecutions);

            return (
              <Card
                key={schedule.id}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{schedule.name}</h4>
                          <Badge
                            variant={schedule.enabled ? "default" : "secondary"}
                          >
                            {schedule.enabled ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {schedule.description && (
                          <p className="text-sm text-muted-foreground">
                            {schedule.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onTrigger?.(schedule.id)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            onToggle?.(schedule.id, !schedule.enabled)
                          }
                        >
                          {schedule.enabled ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete?.(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    {/* Frequency and Next Run */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Frequency</p>
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          <span>{getFrequencyLabel(schedule.frequency)}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Next Run
                        </p>
                        {schedule.nextRun ? (
                          <span>
                            {formatDistanceToNow(schedule.nextRun, {
                              addSuffix: true,
                            })}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Not scheduled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    {stats.totalRuns > 0 && (
                      <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Total Runs</p>
                          <p className="font-semibold">{stats.totalRuns}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Success Rate</p>
                          <p className="font-semibold text-green-600">
                            {stats.successRate.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Duration</p>
                          <p className="font-semibold">
                            {(stats.avgDuration / 1000).toFixed(1)}s
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Last Execution */}
                    {lastExecution && (
                      <div className="rounded-lg border p-2 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Last execution
                          </span>
                          <Badge className={getStatusColor(lastExecution.status)}>
                            {lastExecution.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(lastExecution.startTime, {
                            addSuffix: true,
                          })}
                          {lastExecution.duration && (
                            <span>
                              {" "}
                              ({(lastExecution.duration / 1000).toFixed(2)}s)
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expandable History */}
                    <button
                      onClick={() =>
                        setExpandedSchedule(
                          expandedSchedule === schedule.id ? null : schedule.id
                        )
                      }
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {expandedSchedule === schedule.id
                        ? "Hide"
                        : "Show"}{" "}
                      history
                    </button>

                    {expandedSchedule === schedule.id && (
                      <div className="max-h-40 overflow-y-auto space-y-1 border-t pt-2">
                        {scheduleExecutions.slice(-5).reverse().map((exec) => (
                          <div
                            key={exec.id}
                            className="flex items-center justify-between text-xs p-1 hover:bg-muted/50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              {exec.status === "success" ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-red-600" />
                              )}
                              <span className="text-muted-foreground">
                                {formatDistanceToNow(exec.startTime, {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <span className="font-medium">
                              {(exec.duration || 0) / 1000}s
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Calculate statistics for a set of executions
 */
function calculateStats(executions: ScheduledRunExecution[]): {
  totalRuns: number;
  successRate: number;
  avgDuration: number;
} {
  const completed = executions.filter((e) => e.status !== "pending");

  const successCount = completed.filter((e) => e.status === "success").length;
  const durations = completed
    .filter((e) => e.duration)
    .map((e) => e.duration || 0);

  return {
    totalRuns: completed.length,
    successRate:
      completed.length > 0 ? (successCount / completed.length) * 100 : 0,
    avgDuration:
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0,
  };
}

interface ScheduledRunExecution {
  id: string;
  scheduledRunId: string;
  startTime: Date;
  endTime?: Date;
  status: "pending" | "running" | "success" | "failure" | "skipped";
  output?: string;
  errorMessage?: string;
  duration?: number;
}
