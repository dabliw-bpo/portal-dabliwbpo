-- CreateTable
CREATE TABLE "TimeClockReminder" (
    "id" TEXT NOT NULL,
    "collaboratorUserId" TEXT NOT NULL,
    "referenceMonth" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeClockReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TimeClockReminder_collaboratorUserId_referenceMonth_key" ON "TimeClockReminder"("collaboratorUserId", "referenceMonth");

-- AddForeignKey
ALTER TABLE "TimeClockReminder" ADD CONSTRAINT "TimeClockReminder_collaboratorUserId_fkey" FOREIGN KEY ("collaboratorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Trava de acesso por linha, como nas demais tabelas (ver
-- 20260925150000_enable_row_level_security).
ALTER TABLE "TimeClockReminder" ENABLE ROW LEVEL SECURITY;
