-- CreateTable
CREATE TABLE "SignatureRejection" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "signerUserId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "imageData" TEXT,
    "signedFilePath" TEXT,
    "auditFilePath" TEXT,
    "reason" TEXT NOT NULL,
    "rejectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rejectedByUserId" TEXT NOT NULL,

    CONSTRAINT "SignatureRejection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SignatureRejection_documentId_idx" ON "SignatureRejection"("documentId");

-- AddForeignKey
ALTER TABLE "SignatureRejection" ADD CONSTRAINT "SignatureRejection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRejection" ADD CONSTRAINT "SignatureRejection_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureRejection" ADD CONSTRAINT "SignatureRejection_rejectedByUserId_fkey" FOREIGN KEY ("rejectedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

