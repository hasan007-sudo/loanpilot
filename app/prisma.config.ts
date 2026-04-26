import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// `datasource.url` here is consumed only by Prisma CLI (migrate, db pull, etc.).
// Migrations require a DIRECT connection — pgbouncer's transaction pooling
// strips the SQL features migrate needs. Runtime app uses the pooled
// DATABASE_URL via the PrismaPg adapter in lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
