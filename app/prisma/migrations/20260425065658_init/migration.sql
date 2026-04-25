-- CreateTable
CREATE TABLE "Campaign" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "bankName" TEXT,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "calledCount" INTEGER NOT NULL DEFAULT 0,
    "interestedCount" INTEGER NOT NULL DEFAULT 0,
    "qualifiedCount" INTEGER NOT NULL DEFAULT 0,
    "bolnaBatchId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "campaignId" INTEGER,
    "loanType" TEXT,
    "loanAmount" REAL,
    "monthlyIncome" REAL,
    "employmentType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'called',
    "eligibility" TEXT NOT NULL DEFAULT 'pending',
    "callTranscript" TEXT,
    "summary" TEXT,
    "bolnaCallId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_phone_key" ON "Lead"("phone");
