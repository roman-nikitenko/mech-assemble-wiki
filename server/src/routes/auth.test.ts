import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";

// Mock the provider module so no real OAuth call happens. The login route
// gets a fake authorize URL; the callback gets a fixed profile.
vi.mock("../lib/oauth", () => ({
  isProvider: (p: string) => p === "google" || p === "discord",
  createAuthorizationURL: () => new URL("https://provider.example/authorize?fake=1"),
  fetchProfile: async () => ({ accountId: "test|acct-1", name: "Kael Voss" }),
}));

beforeAll(() => {
  process.env.SESSION_JWT_SECRET = "test-session-secret";
  process.env.APP_BASE_URL = "http://localhost:5173";
});

import { app } from "../app";
import { prisma } from "../lib/prisma";

afterAll(async () => {
  await prisma.user.deleteMany({ where: { providerAccountId: { startsWith: "test|" } } });
  await prisma.$disconnect();
});

describe("GET /api/auth/:provider/login", () => {
  it("sets state + verifier cookies and redirects to the provider", async () => {
    const res = await request(app).get("/api/auth/google/login");
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("provider.example/authorize");
    const cookies = (res.headers["set-cookie"] as unknown as string[]).join(";");
    expect(cookies).toContain("oauth_state_google=");
    expect(cookies).toContain("oauth_verifier_google=");
  });

  it("404s for an unknown provider", async () => {
    const res = await request(app).get("/api/auth/myspace/login");
    expect(res.status).toBe(404);
  });
});

describe("GET /api/auth/:provider/callback", () => {
  it("creates the user, sets a session cookie, and redirects to /profile", async () => {
    // First hit login to obtain matching state + verifier cookies.
    const login = await request(app).get("/api/auth/google/login");
    const setCookies = login.headers["set-cookie"] as unknown as string[];
    const state = /oauth_state_google=([^;]+)/.exec(setCookies.join(";"))![1];
    const cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");

    const res = await request(app)
      .get(`/api/auth/google/callback?code=abc&state=${state}`)
      .set("Cookie", cookieHeader);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("http://localhost:5173/profile");
    expect((res.headers["set-cookie"] as unknown as string[]).join(";")).toContain("session=");

    const user = await prisma.user.findUnique({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: "test|acct-1" } },
    });
    expect(user?.name).toBe("Kael Voss");
  });

  it("redirects to /login?error=state on a state mismatch", async () => {
    const res = await request(app)
      .get("/api/auth/google/callback?code=abc&state=WRONG")
      .set("Cookie", "oauth_state_google=RIGHT; oauth_verifier_google=v");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("http://localhost:5173/login?error=state");
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect((res.headers["set-cookie"] as unknown as string[]).join(";")).toMatch(/session=;/);
  });
});
