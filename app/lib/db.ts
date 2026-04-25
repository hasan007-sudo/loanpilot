import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const DB_URL = process.env.DATABASE_URL ?? "file:./dev.db";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const adapter = new PrismaBetterSqlite3({ url: DB_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
