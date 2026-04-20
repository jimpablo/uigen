// @vitest-environment node
import { test, expect, vi, beforeEach, describe } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: () => mockCookieStore,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createSession", () => {
  test("sets an http-only cookie named auth-token", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name, _token, options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(options.httpOnly).toBe(true);
  });

  test("sets a valid JWT with three parts", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    const token = mockCookieStore.set.mock.calls[0][1];
    expect(token.split(".")).toHaveLength(3);
  });

  test("sets sameSite lax and path /", async () => {
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");

    const options = mockCookieStore.set.mock.calls[0][2];
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("sets an expiry approximately 7 days in the future", async () => {
    const before = Date.now();
    const { createSession } = await import("@/lib/auth");
    await createSession("user-1", "test@example.com");
    const after = Date.now();

    const expires: Date = mockCookieStore.set.mock.calls[0][2].expires;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });
});
