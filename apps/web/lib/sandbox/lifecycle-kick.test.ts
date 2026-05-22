import { afterAll, beforeEach, describe, expect, vi, test } from "vitest";

vi.mock("server-only", () => ({}));

type TestSessionRecord = {
  id: string;
  status: "running" | "completed" | "failed" | "archived";
  lifecycleState:
    | "provisioning"
    | "active"
    | "hibernating"
    | "hibernated"
    | "restoring"
    | "archived"
    | "failed";
  sandboxState: {
    type: "vercel";
    sandboxId: string;
  } | null;
  lifecycleRunId: string | null;
};

let sessionRecord: TestSessionRecord | null = null;
const scheduledCallbacks: Array<() => Promise<void>> = [];

const spies = {
  start: vi.fn(async () => ({ runId: "workflow-run-1" })),
  claimSessionLifecycleRunId: vi.fn(
    async (sessionId: string, runId: string) => {
      if (
        !sessionRecord ||
        sessionRecord.id !== sessionId ||
        sessionRecord.lifecycleRunId !== null
      ) {
        return false;
      }

      sessionRecord = {
        ...sessionRecord,
        lifecycleRunId: runId,
      };
      return true;
    },
  ),
  getSessionById: vi.fn(async () =>
    sessionRecord
      ? {
          ...sessionRecord,
          sandboxState: sessionRecord.sandboxState
            ? { ...sessionRecord.sandboxState }
            : null,
        }
      : null,
  ),
  updateSession: vi.fn(
    async (_sessionId: string, patch: Record<string, unknown>) => {
      if (!sessionRecord) {
        return null;
      }

      sessionRecord = {
        ...sessionRecord,
        ...patch,
      } as TestSessionRecord;
      return sessionRecord;
    },
  ),
  evaluateSandboxLifecycle: vi.fn(async () => ({ action: "skipped" as const })),
  getLifecycleDueAtMs: vi.fn(() => Date.now()),
  canOperateOnSandbox: vi.fn(() => true),
};

const sandboxLifecycleWorkflow = Symbol("sandboxLifecycleWorkflow");

vi.mock("workflow/api", () => ({
  start: spies.start,
}));

vi.mock("@/app/workflows/sandbox-lifecycle", () => ({
  sandboxLifecycleWorkflow,
}));

vi.mock("@/lib/db/sessions", () => ({
  claimSessionLifecycleRunId: spies.claimSessionLifecycleRunId,
  getSessionById: spies.getSessionById,
  updateSession: spies.updateSession,
}));

vi.mock("./lifecycle", () => ({
  evaluateSandboxLifecycle: spies.evaluateSandboxLifecycle,
  getLifecycleDueAtMs: spies.getLifecycleDueAtMs,
}));

vi.mock("./utils", () => ({
  canOperateOnSandbox: spies.canOperateOnSandbox,
}));

const lifecycleKickModulePromise = import("./lifecycle-kick");

const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const consoleErrorSpy = vi.fn(() => {});
const consoleLogSpy = vi.fn(() => {});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe("kickSandboxLifecycleWorkflow", () => {
  beforeEach(() => {
    sessionRecord = {
      id: "session-1",
      status: "running",
      lifecycleState: "active",
      sandboxState: {
        type: "vercel",
        sandboxId: "sandbox-1",
      },
      lifecycleRunId: null,
    };
    scheduledCallbacks.length = 0;
    Object.values(spies).forEach((spy) => spy.mockClear());
    consoleErrorSpy.mockClear();
    consoleLogSpy.mockClear();
    console.error = consoleErrorSpy as typeof console.error;
    console.log = consoleLogSpy as typeof console.log;
  });

  test("claims the lifecycle lease before starting so overlapping kicks only start one workflow", async () => {
    const { kickSandboxLifecycleWorkflow } = await lifecycleKickModulePromise;

    const scheduleBackgroundWork = (callback: () => Promise<void>) => {
      scheduledCallbacks.push(callback);
    };

    kickSandboxLifecycleWorkflow({
      sessionId: "session-1",
      reason: "status-check-overdue",
      scheduleBackgroundWork,
    });
    kickSandboxLifecycleWorkflow({
      sessionId: "session-1",
      reason: "status-check-overdue",
      scheduleBackgroundWork,
    });

    expect(scheduledCallbacks).toHaveLength(2);

    await Promise.all(scheduledCallbacks.map((callback) => callback()));

    expect(spies.claimSessionLifecycleRunId).toHaveBeenCalledTimes(2);
    expect(spies.start).toHaveBeenCalledTimes(1);
    expect(spies.evaluateSandboxLifecycle).not.toHaveBeenCalled();

    const startCalls = spies.start.mock.calls as unknown as Array<
      [unknown, [string, string, string]]
    >;
    const startArgs = startCalls[0];
    expect(startArgs?.[0]).toBe(sandboxLifecycleWorkflow);
    expect(startArgs?.[1]?.[0]).toBe("session-1");
    expect(startArgs?.[1]?.[1]).toBe("status-check-overdue");
    expect(sessionRecord?.lifecycleRunId).not.toBeNull();
  });

  test("releases the claimed lease and falls back inline when workflow start fails", async () => {
    spies.start.mockImplementationOnce(async () => {
      throw new Error("workflow start failed");
    });

    const { kickSandboxLifecycleWorkflow } = await lifecycleKickModulePromise;

    kickSandboxLifecycleWorkflow({
      sessionId: "session-1",
      reason: "status-check-overdue",
      scheduleBackgroundWork: (callback) => {
        scheduledCallbacks.push(callback);
      },
    });

    expect(scheduledCallbacks).toHaveLength(1);

    await scheduledCallbacks[0]?.();

    expect(spies.start).toHaveBeenCalledTimes(1);
    expect(spies.evaluateSandboxLifecycle).toHaveBeenCalledTimes(1);
    expect(spies.updateSession).toHaveBeenCalledWith("session-1", {
      lifecycleRunId: null,
    });
    expect(sessionRecord?.lifecycleRunId).toBeNull();
  });
});
