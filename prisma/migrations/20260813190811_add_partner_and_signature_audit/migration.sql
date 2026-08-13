-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "partnerEmail" TEXT,
ADD COLUMN     "partnerName" TEXT;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "auditFilePath" TEXT,
ADD COLUMN     "fileHash" TEXT;
