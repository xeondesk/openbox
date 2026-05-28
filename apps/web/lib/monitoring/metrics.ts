/**
 * Metrics collection and reporting system
 *
 * Collects performance metrics, workflow execution data, and usage analytics.
 */

import * as Sentry from "@sentry/nextjs";
import { metricsConfig } from "./sentry-config";

interface MetricData {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface WorkflowMetric {
  workflowId: string;
  executionTime: number;
  status: "success" | "failure" | "timeout";
  errorMessage?: string;
  stepsCompleted: number;
  totalSteps: number;
}

export interface ChatMetric {
  sessionId: string;
  messageCount: number;
  averageLatency: number;
  tokenUsage: number;
  modelUsed: string;
}

export interface SandboxMetric {
  sandboxId: string;
  creationTime: number;
  executionTime: number;
  status: "active" | "completed" | "failed";
  commandsExecuted: number;
}

/**
 * Record a generic metric
 */
export function recordMetric(metric: MetricData) {
  if (!metricsConfig.enabled) return;

  try {
    Sentry.captureMessage(
      `Metric: ${metric.name} = ${metric.value}${metric.unit ? ` ${metric.unit}` : ""}`,
      "info",
    );

    // Also send as gauge in Sentry
    Sentry.metrics.gauge(metric.name, metric.value, {
      unit: metric.unit || "none",
      attributes: metric.tags || {},
    });
  } catch (error) {
    console.error("[v0] Failed to record metric:", error);
  }
}

/**
 * Record workflow execution metrics
 */
export function recordWorkflowMetric(metric: WorkflowMetric) {
  if (!metricsConfig.enabled || !metricsConfig.tracked.workflowExecutionTime)
    return;

  const tags = {
    workflowId: metric.workflowId,
    status: metric.status,
  };

  // Record execution time
  recordMetric({
    name: "workflow_execution_time",
    value: metric.executionTime,
    unit: "milliseconds",
    tags,
  });

  // Record steps completed
  recordMetric({
    name: "workflow_steps_completed",
    value: metric.stepsCompleted,
    tags,
  });

  // Record success/failure
  if (metric.status === "success") {
    recordMetric({
      name: "workflow_success",
      value: 1,
      tags,
    });
  } else {
    recordMetric({
      name: "workflow_failure",
      value: 1,
      tags: { ...tags, error: metric.errorMessage || "unknown" },
    });
  }
}

/**
 * Record chat metrics
 */
export function recordChatMetric(metric: ChatMetric) {
  if (!metricsConfig.enabled || !metricsConfig.tracked.chatMessages) return;

  const tags = {
    sessionId: metric.sessionId,
    model: metric.modelUsed,
  };

  recordMetric({
    name: "chat_messages",
    value: metric.messageCount,
    tags,
  });

  recordMetric({
    name: "chat_latency",
    value: metric.averageLatency,
    unit: "milliseconds",
    tags,
  });

  recordMetric({
    name: "chat_tokens",
    value: metric.tokenUsage,
    tags,
  });
}

/**
 * Record sandbox metrics
 */
export function recordSandboxMetric(metric: SandboxMetric) {
  if (!metricsConfig.enabled || !metricsConfig.tracked.sandboxExecution) return;

  const tags = {
    sandboxId: metric.sandboxId,
    status: metric.status,
  };

  recordMetric({
    name: "sandbox_creation_time",
    value: metric.creationTime,
    unit: "milliseconds",
    tags,
  });

  recordMetric({
    name: "sandbox_execution_time",
    value: metric.executionTime,
    unit: "milliseconds",
    tags,
  });

  recordMetric({
    name: "sandbox_commands_executed",
    value: metric.commandsExecuted,
    tags,
  });
}

/**
 * Record API response time
 */
export function recordApiMetric(
  endpoint: string,
  responseTime: number,
  statusCode: number,
) {
  if (!metricsConfig.enabled || !metricsConfig.tracked.apiResponseTime) return;

  const tags = {
    endpoint,
    statusCode: String(statusCode),
  };

  recordMetric({
    name: "api_response_time",
    value: responseTime,
    unit: "milliseconds",
    tags,
  });
}

/**
 * Record user action
 */
export function recordUserAction(
  action: string,
  sessionId: string,
  metadata?: Record<string, unknown>,
) {
  if (!metricsConfig.enabled || !metricsConfig.tracked.userActions) return;

  Sentry.captureMessage(`User action: ${action}`, {
    level: "info",
    tags: {
      action,
      sessionId,
    },
    extra: metadata,
  });
}

/**
 * Create a performance span for tracking
 */
export function createSpan(operation: string, name?: string) {
  const span = Sentry.startInactiveSpan({
    op: operation,
    name: name || operation,
  });

  return {
    end: () => span.end(),
    setAttribute: (key: string, value: unknown) =>
      span.setAttribute(key, value as never),
  };
}

/**
 * Record an error with context
 */
export function recordError(
  error: Error | unknown,
  context: Record<string, unknown> = {},
) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Set user context for Sentry
 */
export function setUserContext(
  userId: string,
  email?: string,
  username?: string,
) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
}
