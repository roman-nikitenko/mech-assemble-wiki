import { beforeEach, describe, expect, it } from "vitest";
import { adminHeaders, clearAdminToken, getAdminToken, setAdminToken } from "./adminSession";

beforeEach(() => sessionStorage.clear());

describe("adminSession", () => {
  it("stores, exposes and clears the token", () => {
    expect(getAdminToken()).toBeNull();
    expect(adminHeaders()).toEqual({});
    setAdminToken("abc");
    expect(getAdminToken()).toBe("abc");
    expect(adminHeaders()).toEqual({ "x-admin-token": "abc" });
    clearAdminToken();
    expect(getAdminToken()).toBeNull();
  });
});
