-- CreateIndex: Application
CREATE INDEX "Application_userId_idx" ON "Application"("userId");
CREATE INDEX "Application_userId_status_idx" ON "Application"("userId", "status");
CREATE INDEX "Application_deadline_idx" ON "Application"("deadline");

-- CreateIndex: ScheduleEvent
CREATE INDEX "ScheduleEvent_userId_idx" ON "ScheduleEvent"("userId");

-- CreateIndex: YouthPolicy
CREATE INDEX "YouthPolicy_region_idx" ON "YouthPolicy"("region");
CREATE INDEX "YouthPolicy_mainCategory_idx" ON "YouthPolicy"("mainCategory");
