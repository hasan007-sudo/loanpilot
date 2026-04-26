import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Seed connects via DIRECT_URL (bypasses pgbouncer) — pooled connections can
// reject writes / DDL-adjacent operations on some providers.
const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DIRECT_URL or DATABASE_URL must be set");

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function seed() {
  await prisma.campaign.deleteMany();

  const campaigns = await Promise.all([
    prisma.campaign.create({ data: { name: "Q1 Home Loan Drive",     bankName: "Apex Bank", totalLeads: 20, calledCount: 20, interestedCount: 12, qualifiedCount: 8, status: "completed" } }),
    prisma.campaign.create({ data: { name: "Personal Loan Campaign", bankName: "Apex Bank", totalLeads: 20, calledCount: 18, interestedCount: 10, qualifiedCount: 7, status: "running"   } }),
    prisma.campaign.create({ data: { name: "Auto Loan March",        bankName: "Apex Bank", totalLeads: 10, calledCount: 10, interestedCount: 6,  qualifiedCount: 5, status: "completed" } }),
  ]);

  console.log(`Seeded: ${campaigns.length} campaigns`);
  await prisma.$disconnect();
}

seed().catch(console.error);
