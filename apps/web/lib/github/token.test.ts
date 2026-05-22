import { beforeEach, describe, expect, vi, test } from "vitest";

let getAccessTokenResult: { accessToken?: string | null } | null;
let getAccessTokenError: Error | null;

const getAccessTokenSpy = vi.fn(
  async (_input: { body: { providerId: string; userId: string } }) => {
    if (getAccessTokenError) {
      throw getAccessTokenError;
    }

    return getAccessTokenResult;
  },
);

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: async () => {
    throw new Error("headers should not be called");
  },
}));

vi.mock("@/lib/auth/config", () => ({
  auth: {
    api: {
      getAccessToken: getAccessTokenSpy,
    },
  },
}));

vi.mock("@/lib/db/client", () => ({
  db: {},
}));

vi.mock("@/lib/db/schema", () => ({
  accounts: {},
}));

const tokenModulePromise = import("./token");

describe("getUserGitHubToken", () => {
  beforeEach(() => {
    getAccessTokenSpy.mockClear();
    getAccessTokenResult = { accessToken: "ghu_test" };
    getAccessTokenError = null;
  });

  test("looks up access tokens by user id without request headers", async () => {
    const { getUserGitHubToken } = await tokenModulePromise;

    const token = await getUserGitHubToken("user-1");

    expect(token).toBe("ghu_test");
    expect(getAccessTokenSpy).toHaveBeenCalledTimes(1);
    expect(getAccessTokenSpy.mock.calls[0]?.[0]).toEqual({
      body: { providerId: "github", userId: "user-1" },
    });
  });

  test("returns null when better-auth token lookup fails", async () => {
    const { getUserGitHubToken } = await tokenModulePromise;
    getAccessTokenError = new Error("boom");

    const token = await getUserGitHubToken("user-1");

    expect(token).toBeNull();
  });
});

describe("getGitHubAppUserToken", () => {
  beforeEach(() => {
    getAccessTokenSpy.mockClear();
    getAccessTokenResult = { accessToken: "ghu_test" };
    getAccessTokenError = null;
  });

  test("returns GitHub App user-to-server tokens", async () => {
    const { getGitHubAppUserToken } = await tokenModulePromise;

    const token = await getGitHubAppUserToken("user-1");

    expect(token).toBe("ghu_test");
  });
});
