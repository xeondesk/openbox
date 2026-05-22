/**
 * Audit logging system for compliance and security
 * 
 * Logs all significant user actions and system events for audit trails.
 */

import * as Sentry from "@sentry/nextjs";
import { auditConfig } from "./sentry-config";

export type AuditEventType = keyof typeof auditConfig.trackableEvents;

interface AuditLogEntry {
  eventType: AuditEventType;
  userId: string;
  sessionId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// In-memory audit log storage (in production, store in database)
const auditLogs: AuditLogEntry[] = [];

// Max entries to keep in memory before rotating
const MAX_AUDIT_LOGS = 1000;

/**
 * Log an audit event
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  userId: string,
  metadata?: Record<string, unknown>,
  options?: {
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  if (!auditConfig.enabled) return;

  const entry: AuditLogEntry = {
    eventType,
    userId,
    timestamp: new Date(),
    metadata,
    sessionId: options?.sessionId,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  };

  // Add to in-memory log
  auditLogs.push(entry);

  // Rotate logs if they exceed max size
  if (auditLogs.length > MAX_AUDIT_LOGS) {
    auditLogs.splice(0, auditLogs.length - MAX_AUDIT_LOGS);
  }

  // Also log to Sentry for persistence
  const eventName = auditConfig.trackableEvents[eventType];
  Sentry.captureMessage(`Audit: ${eventName}`, "info", {
    extra: {
      userId,
      ...metadata,
      ipAddress: options?.ipAddress,
    },
    tags: {
      auditEvent: eventName,
      userId,
    },
  });

  console.log("[v0] Audit Event:", {
    event: eventName,
    userId,
    timestamp: entry.timestamp,
    metadata,
  });
}

/**
 * Authentication events
 */
export async function logAuthEvent(
  eventType: "LOGIN" | "LOGOUT",
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  return logAuditEvent(eventType, userId, undefined, {
    ipAddress,
    userAgent,
  });
}

/**
 * Session events
 */
export async function logSessionEvent(
  eventType: "SESSION_CREATED" | "SESSION_MODIFIED" | "SESSION_DELETED",
  userId: string,
  sessionId: string,
  metadata?: Record<string, unknown>
) {
  return logAuditEvent(eventType, userId, metadata, { sessionId });
}

/**
 * Repository events
 */
export async function logRepositoryEvent(
  eventType: "REPO_CLONED" | "BRANCH_CREATED" | "COMMIT_PUSHED" | "PR_CREATED",
  userId: string,
  sessionId: string,
  metadata?: {
    repo?: string;
    branch?: string;
    commitHash?: string;
    prNumber?: string;
  }
) {
  return logAuditEvent(eventType, userId, metadata, { sessionId });
}

/**
 * Chat events
 */
export async function logChatEvent(
  eventType: "CHAT_CREATED" | "CHAT_MODIFIED",
  userId: string,
  sessionId: string,
  metadata?: {
    chatId?: string;
    messageCount?: number;
  }
) {
  return logAuditEvent(eventType, userId, metadata, { sessionId });
}

/**
 * Workflow events
 */
export async function logWorkflowEvent(
  eventType: "WORKFLOW_STARTED" | "WORKFLOW_COMPLETED" | "WORKFLOW_FAILED",
  userId: string,
  sessionId: string,
  metadata?: {
    workflowId?: string;
    executionTime?: number;
    errorMessage?: string;
    stepsCompleted?: number;
  }
) {
  return logAuditEvent(eventType, userId, metadata, { sessionId });
}

/**
 * Admin events
 */
export async function logAdminEvent(
  eventType: "USER_ROLE_CHANGED" | "PERMISSION_CHANGED",
  adminUserId: string,
  targetUserId: string,
  metadata?: {
    oldRole?: string;
    newRole?: string;
    permissions?: string[];
  }
) {
  return logAuditEvent(eventType, adminUserId, {
    targetUserId,
    ...metadata,
  });
}

/**
 * Get audit logs with optional filtering
 */
export function getAuditLogs(
  options?: {
    userId?: string;
    eventType?: AuditEventType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): AuditLogEntry[] {
  let filtered = auditLogs;

  if (options?.userId) {
    filtered = filtered.filter((log) => log.userId === options.userId);
  }

  if (options?.eventType) {
    filtered = filtered.filter((log) => log.eventType === options.eventType);
  }

  if (options?.startDate) {
    filtered = filtered.filter((log) => log.timestamp >= options.startDate!);
  }

  if (options?.endDate) {
    filtered = filtered.filter((log) => log.timestamp <= options.endDate!);
  }

  const limit = options?.limit || 100;
  return filtered.slice(-limit).reverse();
}

/**
 * Export audit logs as JSON
 */
export function exportAuditLogs(filter?: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}): string {
  const logs = getAuditLogs({
    userId: filter?.userId,
    startDate: filter?.startDate,
    endDate: filter?.endDate,
  });

  return JSON.stringify(logs, null, 2);
}

/**
 * Clear all audit logs (use with caution)
 */
export function clearAuditLogs() {
  auditLogs.length = 0;
  console.warn("[v0] Audit logs cleared");
}
