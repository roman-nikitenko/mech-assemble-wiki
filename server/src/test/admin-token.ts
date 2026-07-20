// Write-endpoint tests authenticate with a real token signed by the same
// code production uses — only the secret is test-local.
import { signAdminToken } from "../lib/auth";

export function testAdminToken(): string {
  process.env.ADMIN_JWT_SECRET ??= "test-secret";
  return signAdminToken();
}
