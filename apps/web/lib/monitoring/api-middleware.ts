/**
 * API middleware for tracking request metrics and errors
 */

import type { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { recordApiMetric, createSpan, recordError } from "./metrics";

/**
 * Wrap an API route handler with automatic metrics collection
 */
export function withMetrics(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest) => {
    const startTime = Date.now();
    const span = createSpan("api_request", request.nextUrl.pathname);

    try {
      span.setAttribute("method", request.method);
      span.setAttribute("path", request.nextUrl.pathname);

      const response = await handler(request);
      const responseTime = Date.now() - startTime;

      recordApiMetric(
        request.nextUrl.pathname,
        responseTime,
        response.status
      );

      span.end();
      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      recordError(error, {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        responseTime,
      });

      recordApiMetric(request.nextUrl.pathname, responseTime, 500);

      span.end();

      // Re-throw error to be handled by Next.js error handler
      throw error;
    }
  };
}

/**
 * Middleware context for manual metric recording
 */
export interface ApiMetricsContext {
  recordMetric: (name: string, value: number, tags?: Record<string, string>) => void;
  setAttribute: (key: string, value: unknown) => void;
  recordError: (error: Error | unknown) => void;
}

/**
 * Create a metrics context for an API endpoint
 */
export function createApiMetricsContext(request: NextRequest): ApiMetricsContext {
  const span = createSpan("api_request", request.nextUrl.pathname);

  return {
    recordMetric: (name: string, value: number, tags?: Record<string, string>) => {
      Sentry.metrics.gauge(name, value, { attributes: tags || {} });
    },
    setAttribute: (key: string, value: unknown) => {
      span.setAttribute(key, value);
    },
    recordError: (error: Error | unknown) => {
      Sentry.captureException(error);
    },
  };
}
