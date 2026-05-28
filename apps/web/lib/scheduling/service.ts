/**
 * Scheduled Agent Runs Service
 *
 * Manages recurring agent executions for automated tasks like
 * dependency updates, testing, code reviews, and maintenance.
 */

import { z } from "zod";

export type CronExpression = string; // Standard cron format

export type ScheduleFrequency =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "custom";

export interface ScheduledRun {
  id: string;
  sessionId: string;
  name: string;
  description?: string;
  frequency: ScheduleFrequency;
  cronExpression?: CronExpression;
  enabled: boolean;
  nextRun?: Date;
  lastRun?: Date;
  lastStatus?: "success" | "failure" | "skipped";
  maxConcurrent: number;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
  notifications?: {
    onSuccess: boolean;
    onFailure: boolean;
    webhookUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledRunExecution {
  id: string;
  scheduledRunId: string;
  startTime: Date;
  endTime?: Date;
  status: "pending" | "running" | "success" | "failure" | "skipped";
  output?: string;
  errorMessage?: string;
  duration?: number; // milliseconds
}

export interface SchedulingConfig {
  timezone: string;
  maxConcurrentRuns: number;
  retentionDays: number;
}

// Validation schemas
export const scheduleFrequencyMap: Record<ScheduleFrequency, string> = {
  hourly: "0 * * * *",
  daily: "0 0 * * *",
  weekly: "0 0 * * 0",
  monthly: "0 0 1 * *",
  custom: "",
};

const ScheduledRunSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  frequency: z.enum(["hourly", "daily", "weekly", "monthly", "custom"]),
  cronExpression: z.string().optional(),
  enabled: z.boolean().default(true),
  maxConcurrent: z.number().int().min(1).max(10).default(1),
  retryPolicy: z.object({
    maxRetries: z.number().int().min(0).max(5).default(3),
    backoffMultiplier: z.number().min(1).max(10).default(2),
  }),
  notifications: z
    .object({
      onSuccess: z.boolean().default(false),
      onFailure: z.boolean().default(true),
      webhookUrl: z.string().url().optional(),
    })
    .optional(),
});

/**
 * Scheduled Runs Manager
 */
export class ScheduledRunsManager {
  private config: SchedulingConfig;
  private scheduledRuns = new Map<string, ScheduledRun>();
  private executions = new Map<string, ScheduledRunExecution[]>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(config: Partial<SchedulingConfig> = {}) {
    this.config = {
      timezone: config.timezone || "UTC",
      maxConcurrentRuns: config.maxConcurrentRuns || 5,
      retentionDays: config.retentionDays || 90,
    };
  }

  /**
   * Create a new scheduled run
   */
  async createSchedule(
    sessionId: string,
    data: z.infer<typeof ScheduledRunSchema>,
  ): Promise<ScheduledRun> {
    const validated = ScheduledRunSchema.parse(data);

    const schedule: ScheduledRun = {
      id: `schedule_${Date.now()}`,
      sessionId,
      name: validated.name,
      description: validated.description,
      frequency: validated.frequency,
      cronExpression:
        validated.frequency === "custom"
          ? validated.cronExpression
          : scheduleFrequencyMap[validated.frequency],
      enabled: validated.enabled,
      nextRun: this.calculateNextRun(validated.frequency),
      maxConcurrent: validated.maxConcurrent,
      retryPolicy: validated.retryPolicy,
      notifications: validated.notifications,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.scheduledRuns.set(schedule.id, schedule);
    this.executions.set(schedule.id, []);

    if (schedule.enabled) {
      this.activateSchedule(schedule.id);
    }

    return schedule;
  }

  /**
   * Get all schedules for a session
   */
  getSessionSchedules(sessionId: string): ScheduledRun[] {
    return Array.from(this.scheduledRuns.values()).filter(
      (s) => s.sessionId === sessionId,
    );
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(
    scheduleId: string,
    data: Partial<z.infer<typeof ScheduledRunSchema>>,
  ): Promise<ScheduledRun> {
    const schedule = this.scheduledRuns.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    const updated: ScheduledRun = {
      ...schedule,
      ...data,
      updatedAt: new Date(),
    };

    // Recalculate next run if frequency changed
    if (data.frequency && data.frequency !== schedule.frequency) {
      updated.nextRun = this.calculateNextRun(data.frequency);
    }

    this.scheduledRuns.set(scheduleId, updated);

    // Update timer if enabled status changed
    if (data.enabled !== undefined) {
      if (data.enabled) {
        this.activateSchedule(scheduleId);
      } else {
        this.deactivateSchedule(scheduleId);
      }
    }

    return updated;
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    this.deactivateSchedule(scheduleId);
    this.scheduledRuns.delete(scheduleId);
    this.executions.delete(scheduleId);
  }

  /**
   * Trigger a scheduled run immediately
   */
  async triggerRun(scheduleId: string): Promise<ScheduledRunExecution> {
    const schedule = this.scheduledRuns.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    const execution: ScheduledRunExecution = {
      id: `exec_${Date.now()}`,
      scheduledRunId: scheduleId,
      startTime: new Date(),
      status: "pending",
    };

    const executions = this.executions.get(scheduleId) || [];
    executions.push(execution);
    this.executions.set(scheduleId, executions);

    // Simulate execution
    this.executeScheduledRun(schedule, execution);

    return execution;
  }

  /**
   * Get execution history for a schedule
   */
  getExecutionHistory(
    scheduleId: string,
    limit: number = 50,
  ): ScheduledRunExecution[] {
    const executions = this.executions.get(scheduleId) || [];
    return executions.slice(-limit).toReversed();
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(scheduleId: string): {
    totalRuns: number;
    successCount: number;
    failureCount: number;
    averageDuration: number;
    successRate: number;
  } {
    const executions = this.executions.get(scheduleId) || [];
    const completed = executions.filter((e) => e.status !== "pending");

    const successCount = completed.filter((e) => e.status === "success").length;
    const failureCount = completed.filter((e) => e.status === "failure").length;
    const durations = completed
      .filter((e) => e.duration)
      .map((e) => e.duration || 0);

    return {
      totalRuns: completed.length,
      successCount,
      failureCount,
      averageDuration:
        durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0,
      successRate:
        completed.length > 0 ? (successCount / completed.length) * 100 : 0,
    };
  }

  /**
   * Activate a schedule (start timer)
   */
  private activateSchedule(scheduleId: string): void {
    const schedule = this.scheduledRuns.get(scheduleId);
    if (!schedule || !schedule.enabled) return;

    // Cancel existing timer
    this.deactivateSchedule(scheduleId);

    // Calculate time until next run
    const nextRun = schedule.nextRun || new Date();
    const now = new Date();
    const delay = Math.max(0, nextRun.getTime() - now.getTime());

    // Set timer for next execution
    const timer = setTimeout(() => {
      this.triggerRun(scheduleId);
      this.activateSchedule(scheduleId); // Reschedule
    }, delay);

    this.timers.set(scheduleId, timer);
  }

  /**
   * Deactivate a schedule (stop timer)
   */
  private deactivateSchedule(scheduleId: string): void {
    const timer = this.timers.get(scheduleId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(scheduleId);
    }
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(frequency: ScheduleFrequency): Date {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
      case "hourly":
        next.setHours(next.getHours() + 1);
        next.setMinutes(0, 0, 0);
        break;
      case "daily":
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        break;
      case "weekly":
        next.setDate(next.getDate() + (7 - next.getDay()));
        next.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(0, 0, 0, 0);
        break;
    }

    return next;
  }

  /**
   * Execute a scheduled run
   */
  private async executeScheduledRun(
    schedule: ScheduledRun,
    execution: ScheduledRunExecution,
  ): Promise<void> {
    execution.status = "running";
    const startTime = Date.now();

    try {
      // Simulate agent execution
      await new Promise((resolve) => setTimeout(resolve, 1000));

      execution.status = "success";
      execution.output = `Successfully executed: ${schedule.name}`;
    } catch (error) {
      execution.status = "failure";
      execution.errorMessage =
        error instanceof Error ? error.message : "Unknown error";
    } finally {
      execution.endTime = new Date();
      execution.duration = Date.now() - startTime;

      // Update last run status in schedule
      schedule.lastRun = execution.startTime;
      schedule.lastStatus = execution.status as
        | "success"
        | "failure"
        | "skipped";

      // Send notification if configured
      if (schedule.notifications) {
        this.sendNotification(schedule, execution);
      }
    }
  }

  /**
   * Send notification for schedule execution
   */
  private sendNotification(
    schedule: ScheduledRun,
    execution: ScheduledRunExecution,
  ): void {
    const shouldNotify =
      (execution.status === "success" && schedule.notifications?.onSuccess) ||
      (execution.status === "failure" && schedule.notifications?.onFailure);

    if (!shouldNotify) return;

    if (schedule.notifications?.webhookUrl) {
      // Send webhook notification
      console.log(
        `[v0] Sending webhook to ${schedule.notifications.webhookUrl}`,
        {
          scheduleName: schedule.name,
          status: execution.status,
          duration: execution.duration,
        },
      );
    }
  }

  /**
   * Cleanup old executions
   */
  async cleanup(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    this.executions.forEach((executions, scheduleId) => {
      const filtered = executions.filter((e) => e.startTime > cutoffDate);
      this.executions.set(scheduleId, filtered);
    });
  }

  /**
   * Get all schedules
   */
  getAllSchedules(): ScheduledRun[] {
    return Array.from(this.scheduledRuns.values());
  }

  /**
   * Destroy manager and cleanup resources
   */
  destroy(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}

// Export singleton instance
export const scheduledRunsManager = new ScheduledRunsManager();
