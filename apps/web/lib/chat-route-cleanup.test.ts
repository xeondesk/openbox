import { describe, expect, vi, test } from "vitest";

const spies = {
  abortChatInstanceTransport: vi.fn((_chatId: string) => {}),
  removeChatInstance: vi.fn((_chatId: string) => {}),
  clearChatWorkspaceStatus: vi.fn((_chatId: string) => {}),
};

vi.mock("@/lib/chat-instance-manager", () => ({
  abortChatInstanceTransport: spies.abortChatInstanceTransport,
  removeChatInstance: spies.removeChatInstance,
}));

vi.mock("@/lib/workspace-status-store", () => ({
  clearChatWorkspaceStatus: spies.clearChatWorkspaceStatus,
}));

const cleanupModulePromise = import("./chat-route-cleanup");

describe("cleanupChatRouteOnUnmount", () => {
  test("aborts local transport and removes chat instance", async () => {
    const { cleanupChatRouteOnUnmount } = await cleanupModulePromise;

    const calls: string[] = [];
    const abortTransport = vi.fn((chatId: string) => {
      calls.push(`abort:${chatId}`);
    });
    const removeInstance = vi.fn((chatId: string) => {
      calls.push(`remove:${chatId}`);
    });
    const clearWorkspaceStatus = vi.fn((chatId: string) => {
      calls.push(`clear:${chatId}`);
    });

    cleanupChatRouteOnUnmount("chat-123", {
      abortTransport,
      removeInstance,
      clearWorkspaceStatus,
    });

    expect(abortTransport).toHaveBeenCalledWith("chat-123");
    expect(removeInstance).toHaveBeenCalledWith("chat-123");
    expect(clearWorkspaceStatus).toHaveBeenCalledWith("chat-123");
    expect(calls).toEqual([
      "abort:chat-123",
      "remove:chat-123",
      "clear:chat-123",
    ]);
  });

  test("clears workspace status with default dependencies", async () => {
    const { cleanupChatRouteOnUnmount } = await cleanupModulePromise;

    cleanupChatRouteOnUnmount("chat-789");

    expect(spies.clearChatWorkspaceStatus).toHaveBeenCalledWith("chat-789");
  });

  test("never issues a server stop signal during route teardown", async () => {
    const { cleanupChatRouteOnUnmount } = await cleanupModulePromise;

    const abortTransport = vi.fn((_chatId: string) => {});
    const removeInstance = vi.fn((_chatId: string) => {});
    const stopStream = vi.fn((_chatId: string) => {});

    cleanupChatRouteOnUnmount("chat-456", {
      abortTransport,
      removeInstance,
      stopStream,
    });

    expect(abortTransport).toHaveBeenCalledTimes(1);
    expect(removeInstance).toHaveBeenCalledTimes(1);
    expect(stopStream).not.toHaveBeenCalled();
  });
});
