import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const NAMES = [
  "Rahul Sharma","Priya Mehta","Amit Patel","Sunita Rao","Vikram Singh",
  "Deepa Nair","Rajesh Kumar","Anita Desai","Suresh Iyer","Kavita Joshi",
  "Manish Gupta","Pooja Agarwal","Ravi Verma","Neha Chopra","Arjun Menon",
  "Shruti Pillai","Arun Mishra","Divya Krishnan","Sanjay Yadav","Meera Bose",
  "Karan Malhotra","Anjali Reddy","Vijay Nambiar","Rekha Shetty","Nikhil Jain",
  "Sonal Kapoor","Tarun Bhatt","Smita Kulkarni","Rohit Tiwari","Alka Pandey",
  "Ashok Rao","Geeta Singh","Prakash More","Usha Naik","Dinesh Patil",
  "Lata Sawant","Harish Chauhan","Ritu Thakur","Mohan Lal","Sunanda Pillai",
  "Gopal Sinha","Vandana Misra","Sunil Dubey","Radha Murthy","Pankaj Shah",
  "Jyoti Nair","Akash Tomar","Pallavi Deshpande","Yogesh Kadam","Swati Hegde",
];

const LOAN_TYPES = ["home","personal","business","auto"];
const EMPLOYMENT = ["salaried","self_employed","business_owner"];
const STATUSES = ["called","interested","pre_qualified","not_interested","passed_to_rm"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const TRANSCRIPTS = [
  "Agent: Hello, this is Priya from Apex Bank. Customer: Yes, go ahead. Agent: Are you interested in a home loan? Customer: Yes, I'm looking for about 40 lakhs. Agent: What's your monthly income? Customer: Around 75,000. Agent: Are you salaried? Customer: Yes. Agent: Great, you appear eligible!",
  "Agent: Hi, calling from Apex Bank about loan offers. Customer: What kind of loans? Agent: Home, personal, business or auto. Customer: I need a personal loan of 5 lakhs. Agent: Monthly income? Customer: 35,000 salaried. Agent: You qualify for a personal loan.",
  "Agent: Good morning, Priya from Apex Bank. Customer: I'm busy, make it quick. Agent: Do you need a loan? Customer: Maybe a business loan. Agent: How much? Customer: 20 lakhs. Income around 60k, own business. Agent: Looks eligible, RM will call you.",
  "Agent: Calling about loan offers. Customer: Not interested. Agent: Understood, thank you for your time. Have a great day!",
  "Agent: Hi, this is Priya from Apex Bank. Customer: Yes? Agent: We have auto loan offers. Customer: I need a car loan, about 8 lakhs. Agent: Income? Customer: 28,000 salaried. Agent: You qualify for the auto loan!",
];

async function seed() {
  await prisma.campaign.deleteMany();
  await prisma.lead.deleteMany();

  const campaigns = await Promise.all([
    prisma.campaign.create({ data: { name: "Q1 Home Loan Drive", bankName: "Apex Bank", totalLeads: 20, calledCount: 20, interestedCount: 12, qualifiedCount: 8, status: "completed" } }),
    prisma.campaign.create({ data: { name: "Personal Loan Campaign", bankName: "Apex Bank", totalLeads: 20, calledCount: 18, interestedCount: 10, qualifiedCount: 7, status: "running" } }),
    prisma.campaign.create({ data: { name: "Auto Loan March", bankName: "Apex Bank", totalLeads: 10, calledCount: 10, interestedCount: 6, qualifiedCount: 5, status: "completed" } }),
  ]);

  for (let i = 0; i < 50; i++) {
    const name = NAMES[i];
    const phone = `+91${randInt(7000000000, 9999999999)}`;
    const loanType = rand(LOAN_TYPES);
    const employmentType = rand(EMPLOYMENT);
    const monthlyIncome = randInt(20000, 150000);
    const loanAmount = randInt(2, 80) * 100000;
    const status = rand(STATUSES);
    const campaign = campaigns[i % campaigns.length];
    const hasTranscript = i < 20;

    await prisma.lead.create({
      data: {
        phone, name, loanType, loanAmount, monthlyIncome, employmentType, status,
        eligibility: status === "pre_qualified" ? "eligible" : status === "not_interested" ? "ineligible" : "pending",
        campaignId: campaign.id,
        callTranscript: hasTranscript ? rand(TRANSCRIPTS) : null,
        summary: hasTranscript ? `${name} expressed interest in a ${loanType} loan of ₹${(loanAmount/100000).toFixed(1)}L. Monthly income ₹${monthlyIncome.toLocaleString("en-IN")}, ${employmentType}. ${status === "pre_qualified" ? "Pre-qualified — RM to follow up." : "Further review needed."}` : null,
      },
    });
  }

  console.log("✅ Seeded: 3 campaigns, 50 leads");
  await prisma.$disconnect();
}

seed().catch(console.error);
