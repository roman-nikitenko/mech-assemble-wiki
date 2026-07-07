// One PrismaClient for the whole app. Each PrismaClient manages its own
// connection pool, so creating one per file/request would leak connections —
// import this shared instance instead.
import "dotenv/config"; // load DATABASE_URL before the client initializes
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
