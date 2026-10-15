-- CreateTable
CREATE TABLE "TimeClockFile" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "collaboratorUserId" TEXT NOT NULL,
    "referenceMonth" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeClockFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeClockFile_collaboratorUserId_referenceMonth_idx" ON "TimeClockFile"("collaboratorUserId", "referenceMonth");

-- CreateIndex
CREATE INDEX "TimeClockFile_companyId_referenceMonth_idx" ON "TimeClockFile"("companyId", "referenceMonth");

-- AddForeignKey
ALTER TABLE "TimeClockFile" ADD CONSTRAINT "TimeClockFile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeClockFile" ADD CONSTRAINT "TimeClockFile_collaboratorUserId_fkey" FOREIGN KEY ("collaboratorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeClockFile" ADD CONSTRAINT "TimeClockFile_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Trava de acesso por linha, como nas demais tabelas (ver
-- 20260925150000_enable_row_level_security): o portal entra como "postgres" e
-- ignora RLS; qualquer outra chave fica sem leitura nem escrita por padrão.
ALTER TABLE "TimeClockFile" ENABLE ROW LEVEL SECURITY;
