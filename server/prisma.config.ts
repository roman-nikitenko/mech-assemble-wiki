// Prisma CLI configuration. This replaces the deprecated `prisma` field in
// package.json (removed in Prisma 7). One subtlety: when this file exists,
// the Prisma CLI stops auto-loading .env — the `import "dotenv/config"` line
// below takes over that job.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // NO seed command — deliberately removed 2026-07-09 after the demo-reset
    // seed destroyed real admin-entered data twice. Data lives in the DB and
    // is entered via /admin; back it up with `npm run backup`.
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
