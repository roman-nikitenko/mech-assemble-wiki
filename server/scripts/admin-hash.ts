// Usage: npm run admin:hash -- "my password"  → paste output into .env
import { hashPassword } from "../src/lib/auth";

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run admin:hash -- "your password"');
  process.exit(1);
}
console.log(hashPassword(password));
