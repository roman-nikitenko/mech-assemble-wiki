// Usage: npm run admin:check -- "my password"
// Answers one question: does this password match ADMIN_PASSWORD_HASH in .env?
import "dotenv/config";
import { verifyPassword } from "../src/lib/auth";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run admin:check -- "your password"');
  process.exit(1);
}
const stored = process.env.ADMIN_PASSWORD_HASH ?? "";
if (!stored) {
  console.error("ADMIN_PASSWORD_HASH is not set in .env");
  process.exit(1);
}
console.log(verifyPassword(password, stored) ? "MATCHES ✓" : "DOES NOT MATCH ✗");
