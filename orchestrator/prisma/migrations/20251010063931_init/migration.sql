-- CreateTable
CREATE TABLE "Mapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fiderPostNumber" INTEGER NOT NULL,
    "fiderPostUrl" TEXT NOT NULL,
    "fiderPostTitle" TEXT NOT NULL,
    "planeIssueId" TEXT NOT NULL,
    "planeIssueUrl" TEXT NOT NULL,
    "planeProjectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productTag" TEXT NOT NULL,
    "planeProjectId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Mapping_fiderPostNumber_key" ON "Mapping"("fiderPostNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Mapping_planeIssueId_key" ON "Mapping"("planeIssueId");

-- CreateIndex
CREATE INDEX "Mapping_fiderPostNumber_idx" ON "Mapping"("fiderPostNumber");

-- CreateIndex
CREATE INDEX "Mapping_planeIssueId_idx" ON "Mapping"("planeIssueId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMapping_productTag_key" ON "ProjectMapping"("productTag");

-- CreateIndex
CREATE INDEX "ProjectMapping_productTag_idx" ON "ProjectMapping"("productTag");

-- CreateIndex
CREATE INDEX "WebhookLog_source_createdAt_idx" ON "WebhookLog"("source", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookLog_status_idx" ON "WebhookLog"("status");
