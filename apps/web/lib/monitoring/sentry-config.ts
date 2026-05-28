/**
 * Sentry configuration for error tracking and observability
 * 
 * This module initializes Sentry for monitoring application errors,
 * performance issues, and collecting metrics for the Open Agents platform.
 */

import { init } from "@sentry/nextjs";

type SentryInitOptions = Parameters<typeof init>[0];

export const sentryConfig: SentryInitOptions = {
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Error tracking
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Performance monitoring
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  
  // Ignore certain errors that are expected
  ignoreErrors: [
    // Browser extensions
    "chrome-extension://",
    "moz-extension://",
    
    // Network errors that don't need to be tracked
    "NetworkError",
    "TimeoutError",
    
    // Redux DevTools
    "redux-devtools",
  ],
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_BUILD_ID || "unknown",
  
  // Distributed tracing
  integrations: [
    // Default integrations will be included
  ],
  
  // Sensitive data filtering
  beforeSend(event, hint) {
    // Don't send errors in development unless explicitly enabled
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.SENTRY_DEBUG
    ) {
      return null;
    }
    
    return event;
  },
  
  // Attach stack traces to all messages
  attachStacktrace: true,
};

/**
 * Configuration for metrics collection
 */
export const metricsConfig = {
  // Enable metrics collection
  enabled: process.env.NEXT_PUBLIC_METRICS_ENABLED !== "false",
  
  // Metrics to track
  tracked: {
    // Workflow execution metrics
    workflowExecutionTime: true,
    workflowSuccess: true,
    workflowErrors: true,
    
    // Chat metrics
    chatMessages: true,
    chatLatency: true,
    
    // Sandbox metrics
    sandboxCreation: true,
    sandboxExecution: true,
    sandboxErrors: true,
    
    // API metrics
    apiResponseTime: true,
    apiErrors: true,
    
    // User metrics
    sessionDuration: true,
    userActions: true,
  },
  
  // Batch settings for metrics
  batchSize: 10,
  flushInterval: 60000, // 1 minute
};

/**
 * Audit logging configuration
 */
export const auditConfig = {
  enabled: true,
  
  // Events to track
  trackableEvents: {
    // Authentication
    LOGIN: "user_login",
    LOGOUT: "user_logout",
    SESSION_CREATED: "session_created",
    
    // Session operations
    SESSION_MODIFIED: "session_modified",
    SESSION_DELETED: "session_deleted",
    
    // Repository operations
    REPO_CLONED: "repo_cloned",
    BRANCH_CREATED: "branch_created",
    COMMIT_PUSHED: "commit_pushed",
    PR_CREATED: "pr_created",
    
    // Chat operations
    CHAT_CREATED: "chat_created",
    CHAT_MODIFIED: "chat_modified",
    
    // Workflow operations
    WORKFLOW_STARTED: "workflow_started",
    WORKFLOW_COMPLETED: "workflow_completed",
    WORKFLOW_FAILED: "workflow_failed",
    
    // Admin operations
    USER_ROLE_CHANGED: "user_role_changed",
    PERMISSION_CHANGED: "permission_changed",
  },
};
