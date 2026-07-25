-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "owningAgency" TEXT NOT NULL,
    "primeContractorId" TEXT NOT NULL,
    "contractValueCents" INTEGER NOT NULL,
    "retainagePct" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "Project_primeContractorId_fkey" FOREIGN KEY ("primeContractorId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SovLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledValueCents" INTEGER NOT NULL,
    "unit" TEXT,
    "qtyScheduled" REAL,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "SovLine_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Milestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plannedDate" DATETIME NOT NULL,
    "forecastDate" DATETIME,
    "actualDate" DATETIME,
    "status" TEXT NOT NULL,
    CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Subcontract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "subcontractorId" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "valueCents" INTEGER NOT NULL,
    CONSTRAINT "Subcontract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Subcontract_subcontractorId_fkey" FOREIGN KEY ("subcontractorId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subcontractId" TEXT NOT NULL,
    "sovLineId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "issuedAt" DATETIME,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "verifiedAt" DATETIME,
    "qtyClaimed" REAL,
    "qtyVerified" REAL,
    CONSTRAINT "WorkOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_subcontractId_fkey" FOREIGN KEY ("subcontractId") REFERENCES "Subcontract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkOrder_sovLineId_fkey" FOREIGN KEY ("sovLineId") REFERENCES "SovLine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FieldVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "inspectorName" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "result" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "checklist" TEXT NOT NULL,
    CONSTRAINT "FieldVerification_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "fieldVerificationId" TEXT,
    "dailyReportId" TEXT,
    "url" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "lat" REAL,
    "lng" REAL,
    "takenAt" DATETIME,
    "caption" TEXT NOT NULL,
    CONSTRAINT "Photo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Photo_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Photo_fieldVerificationId_fkey" FOREIGN KEY ("fieldVerificationId") REFERENCES "FieldVerification" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Photo_dailyReportId_fkey" FOREIGN KEY ("dailyReportId") REFERENCES "DailyReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "weatherSummary" TEXT NOT NULL,
    "tempLowF" INTEGER,
    "tempHighF" INTEGER,
    "crew" TEXT NOT NULL,
    "workPerformed" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "safetyIncidents" TEXT NOT NULL,
    "delays" TEXT NOT NULL,
    "visitorLog" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "DailyReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChangeOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "decidedAt" DATETIME,
    CONSTRAINT "ChangeOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "approvedAt" DATETIME,
    "paidAt" DATETIME,
    CONSTRAINT "PayApplication_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PayAppLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payApplicationId" TEXT NOT NULL,
    "sovLineId" TEXT NOT NULL,
    "previousCents" INTEGER NOT NULL,
    "thisPeriodCents" INTEGER NOT NULL,
    "storedMaterialsCents" INTEGER NOT NULL,
    "retainageCents" INTEGER NOT NULL,
    CONSTRAINT "PayAppLine_payApplicationId_fkey" FOREIGN KEY ("payApplicationId") REFERENCES "PayApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PayAppLine_sovLineId_fkey" FOREIGN KEY ("sovLineId") REFERENCES "SovLine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExceptionAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    CONSTRAINT "ExceptionAlert_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL,
    "tags" TEXT NOT NULL,
    CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Project_contractNumber_key" ON "Project"("contractNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SovLine_projectId_code_key" ON "SovLine"("projectId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_projectId_number_key" ON "WorkOrder"("projectId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_projectId_date_key" ON "DailyReport"("projectId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChangeOrder_projectId_number_key" ON "ChangeOrder"("projectId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "PayApplication_projectId_number_key" ON "PayApplication"("projectId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "PayAppLine_payApplicationId_sovLineId_key" ON "PayAppLine"("payApplicationId", "sovLineId");
