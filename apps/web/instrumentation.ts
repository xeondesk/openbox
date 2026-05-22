/**
 * Sentry instrumentation for Next.js
 * 
 * Initializes error tracking and performance monitoring for the application.
 * This file is automatically loaded by Next.js via the instrumentation hook.
 */

import * as Sentry from "@sentry/nextjs";
import { sentryConfig } from "./lib/monitoring/sentry-config";

// Only initialize Sentry if DSN is configured
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN && process.env.NODE_ENV !== "development") {
  Sentry.init({
    dsn: SENTRY_DSN,
    ...sentryConfig,
  });
}

/**
 * Server-side initialization
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side initialization
    console.log("[v0] Sentry monitoring initialized for Node.js runtime");
  }
}
