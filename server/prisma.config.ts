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
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
