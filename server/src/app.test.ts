import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./app";

describe("app plumbing", () => {
  it("404s unknown routes with JSON", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });
});
